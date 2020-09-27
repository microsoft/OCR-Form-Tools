// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import _ from "lodash";
import Guard from "../common/guard";
import {
    IAsset, AssetType, IProject, IAssetMetadata, AssetState,
    ILabelData, ILabel,
} from "../models/applicationState";
import { AssetProviderFactory, IAssetProvider } from "../providers/storage/assetProviderFactory";
import { StorageProviderFactory, IStorageProvider } from "../providers/storage/storageProviderFactory";
import { constants } from "../common/constants";
import { appInfo } from "../common/appInfo";
import { encodeFileURI } from "../common/utils";
import { strings, interpolate } from "../common/strings";
import { sha256Hash } from "../common/crypto";
import { toast } from "react-toastify";
import allSettled from "promise.allsettled"

const supportedImageFormats = {
    jpg: null, jpeg: null, null: null, png: null, bmp: null, tif: null, tiff: null, pdf: null,
};

interface IMime {
    types: string[];
    pattern: (number | undefined)[];
}

// tslint:disable number-literal-format
// tslint:disable no-magic-numbers
const imageMimes: IMime[] = [
    {
        types: ["bmp"],
        pattern: [0x42, 0x4d],
    },
    {
        types: ["png"],
        pattern: [0x89, 0x50, 0x4e, 0x47],
    },
    {
        types: ["jpeg", "jpg"],
        pattern: [0xff, 0xd8, 0xff],
    },
    {
        types: ["tif"],
        pattern: [0x49, 0x49, 0x2a, 0x00],
    },
    {
        types: ["tiff"],
        pattern: [0x4d, 0x4d, 0x00, 0x2a],
    },
    {
        types: ["pdf"],
        pattern: [0x25, 0x50, 0x44, 0x46, 0x2d],
    },
];
// We can expand this list @see https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
const mimeBytesNeeded: number = (Math.max(...imageMimes.map((m) => m.pattern.length)) - 1);

/**
 * @name - Asset Service
 * @description - Functions for dealing with project assets
 */
export class AssetService {
    private getOcrFromAnalyzeResult(analyzeResult: any) {
        return _.get(analyzeResult, "analyzeResult.readResults", []);
    }
    async uploadAssetPredictResult(asset: IAsset, readResults: any): Promise<void> {
        const getBoundingBox = (pageIndex, arr: number[]) => {
            const ocrForCurrentPage: any = this.getOcrFromAnalyzeResult(readResults)[pageIndex - 1];
            const ocrExtent = [0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height];
            const ocrWidth = ocrExtent[2] - ocrExtent[0];
            const ocrHeight = ocrExtent[3] - ocrExtent[1];
            const result = [];
            for (let i = 0; i < arr.length; i += 2) {
                result.push([
                    (arr[i] / ocrWidth),
                    (arr[i + 1] / ocrHeight),
                ]);
            }
            return result;
        };
        const getLabelValues = (field: any) => {
            return field.elements.map((path: string) => {
                const pathArr = path.split('/').slice(1);
                const word = pathArr.reduce((obj: any, key: string) => obj[key], { ...readResults.analyzeResult });
                return {
                    page: field.page,
                    text: word.text || word.state,
                    confidence: word.confidence,
                    boundingBoxes: [getBoundingBox(field.page, word.boundingBox)]
                };
            });
        };
        const labels = [];
        readResults.analyzeResult.documentResults
            .map(result => Object.keys(result.fields)
                .filter(key => result.fields[key])
                .map<ILabel>(key => (
                    {
                        label: key,
                        key: null,
                        value: getLabelValues(result.fields[key])
                    }))).forEach(items => {
                        labels.push(...items);
                    });

        if (labels.length > 0) {
            const fileName = decodeURIComponent(asset.name).split('/').pop();
            const labelData: ILabelData = {
                document: fileName,
                labels
            };
            const metadata = {
                ...await this.getAssetMetadata(asset),
                labelData
            };
            metadata.asset.state = AssetState.Tagged;

            const ocrData = JSON.parse(JSON.stringify(readResults));
            delete ocrData.analyzeResult.documentResults;
            if (ocrData.analyzeResult.errors) {
                delete ocrData.analyzeResult.errors;
            }
            const ocrFileName = `${asset.name}${constants.ocrFileExtension}`;
            await Promise.all([
                this.save(metadata),
                this.storageProvider.writeText(ocrFileName, JSON.stringify(ocrData, null, 2))
            ]);
        }
        else {
            const ocrData = { ...readResults };
            delete ocrData.analyzeResult.documentResults;
            if (ocrData.analyzeResult.errors) {
                delete ocrData.analyzeResult.errors;
            }
            const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
            const ocrFileName = decodeURIComponent(`${asset.name}${constants.ocrFileExtension}`);
            try {
                await Promise.all([
                    this.storageProvider.deleteFile(labelFileName, true, true),
                    this.storageProvider.writeText(ocrFileName, JSON.stringify(ocrData, null, 2))
                ]);
            }
            catch{
                return;
            }
        }
    }
    /**
     * Create IAsset from filePath
     * @param filePath - filepath of asset
     * @param fileName - name of asset
     */
    public static async createAssetFromFilePath(filePath: string, fileName?: string, nodejsMode?: boolean): Promise<IAsset> {
        Guard.empty(filePath);

        const normalizedPath = filePath.toLowerCase();

        // If the path is not already prefixed with a protocol
        // then assume it comes from the local file system
        if (!normalizedPath.startsWith("http://") &&
            !normalizedPath.startsWith("https://") &&
            !normalizedPath.startsWith("file:")) {
            // First replace \ character with / the do the standard url encoding then encode unsupported characters
            filePath = encodeFileURI(filePath, true);
        }

        const hash = await sha256Hash(filePath, nodejsMode);
        // eslint-disable-next-line
        const pathParts = filePath.split(/[\\\/]/);
        fileName = fileName || pathParts[pathParts.length - 1];
        const fileNameParts = fileName.split(".");

        // eslint-disable-next-line
        const extensionParts = fileNameParts[fileNameParts.length - 1].split(/[\?#]/);
        let assetFormat = extensionParts[0].toLowerCase();

        if (supportedImageFormats.hasOwnProperty(assetFormat)) {
            let types;
            let corruptFileName;
            if (nodejsMode) {
                const FileType = require('file-type');
                const fileType = await FileType.fromFile(normalizedPath);
                types = [fileType.ext];
                corruptFileName = fileName.split(/[\\\/]/).pop().replace(/%20/g, " ");

            } else {
                types = await this.getMimeType(filePath);
                corruptFileName = fileName.split("%2F").pop().replace(/%20/g, " ");
            }
            if (!types) {
                console.error(interpolate(strings.editorPage.assetWarning.incorrectFileExtension.failedToFetch, { fileName: corruptFileName.toLocaleUpperCase() }));
            }
            // If file was renamed/spoofed - fix file extension to true MIME type and show message
            else if (!types.includes(assetFormat)) {
                assetFormat = types[0];
                console.error(`${strings.editorPage.assetWarning.incorrectFileExtension.attention} ${corruptFileName.toLocaleUpperCase()} ${strings.editorPage.assetWarning.incorrectFileExtension.text} ${corruptFileName.toLocaleUpperCase()}`);
            }
        }

        const assetType = this.getAssetType(assetFormat);

        return {
            id: hash,
            format: assetFormat,
            state: AssetState.NotVisited,
            type: assetType,
            name: fileName,
            path: filePath,
            size: null,
        };
    }

    /**
     * Get Asset Type from format (file extension)
     * @param format - File extension of asset
     */
    public static getAssetType(format: string): AssetType {
        switch (format?.toLowerCase()) {
            case "jpg":
            case "jpeg":
            case "png":
            case "bmp":
                return AssetType.Image;
            case "tif":
            case "tiff":
                return AssetType.TIFF;
            case "pdf":
                return AssetType.PDF;
            default:
                return AssetType.Unknown;
        }
    }

    // If extension of a file was spoofed, we fetch only first 4 or needed amount of bytes of the file and read MIME type
    public static async getMimeType(uri: string): Promise<string[]> {
        const getFirst4bytes = (): Promise<Response> => this.pollForFetchAPI(() => fetch(uri, { headers: { range: `bytes=0-${mimeBytesNeeded}` } }), 1000, 200);
        let first4bytes: Response;
        try {
            first4bytes = await getFirst4bytes()
        } catch {
            return new Promise<string[]>((resolve) => {
                resolve(null);
            });
        }
        const arrayBuffer: ArrayBuffer = await first4bytes.arrayBuffer();
        const blob: Blob = new Blob([new Uint8Array(arrayBuffer).buffer]);
        const isMime = (bytes: Uint8Array, mime: IMime): boolean => {
            return mime.pattern.every((p, i) => !p || bytes[i] === p);
        };
        const fileReader: FileReader = new FileReader();

        return new Promise<string[]>((resolve, reject) => {
            fileReader.onloadend = (e) => {
                if (!e || !fileReader.result) {
                    return [];
                }
                const bytes: Uint8Array = new Uint8Array(fileReader.result as ArrayBuffer);
                const type: string[] = imageMimes.filter((mime) => isMime(bytes, mime))?.[0]?.types;
                resolve(type || []);
            };
            fileReader.readAsArrayBuffer(blob);
        });
    }

    private assetProviderInstance: IAssetProvider;
    private storageProviderInstance: IStorageProvider;

    constructor(private project: IProject) {
        Guard.null(project);
    }

    /**
     * Get Asset Provider from project's source connection
     */
    protected get assetProvider(): IAssetProvider {
        if (!this.assetProviderInstance) {
            this.assetProviderInstance = AssetProviderFactory.create(
                this.project.sourceConnection.providerType,
                this.project.sourceConnection.providerOptions,
            );
        }

        return this.assetProviderInstance;
    }

    /**
     * Get Storage Provider from project's target connection
     */
    protected get storageProvider(): IStorageProvider {
        if (!this.storageProviderInstance) {
            this.storageProviderInstance = StorageProviderFactory.create(
                this.project.sourceConnection.providerType,
                this.project.sourceConnection.providerOptions,
            );
        }

        return this.storageProviderInstance;
    }

    /**
     * Get assets from provider
     */
    public async getAssets(): Promise<IAsset[]> {
        const folderPath = this.project.folderPath;
        const assets = await this.assetProvider.getAssets(folderPath);
        return this.filterAssets(assets, folderPath);
    }

    private filterAssets = (assets, folderPath) => {
        if (this.project.sourceConnection.providerType === "localFileSystemProxy") {
            return assets.map((asset) => {
                asset.name = decodeURIComponent(asset.name);
                return asset;
            })
        } else {
            return assets.map((asset) => {
                asset.name = decodeURIComponent(asset.name);
                return asset;
            }).filter((asset) => this.isInExactFolderPath(asset.name, folderPath));
        }
    }
    public async uploadBuffer(name: string, buffer: Buffer) {
        const path = this.project.folderPath ? `${this.project.folderPath}/${name}` : name;
        await this.storageProvider.writeBinary(path, buffer);
    }
    public async uploadText(name: string, contents: string) {
        const path = this.project.folderPath ? `${this.project.folderPath}/${name}` : name;
        await this.storageProvider.writeText(path, contents);
    }
    /**
     * Delete asset
     * @param metadata - Metadata for asset
     */
    public async delete(metadata: IAssetMetadata): Promise<void> {
        Guard.null(metadata);

        const labelFileName = decodeURIComponent(`${metadata.asset.name}${constants.labelFileExtension}`);
        const ocrFileName = decodeURIComponent(`${metadata.asset.name}${constants.ocrFileExtension}`);
        const assetFileName = decodeURIComponent(`${metadata.asset.name}`);
        await allSettled(
            [
                this.storageProvider.deleteFile(labelFileName, true, true),
                this.storageProvider.deleteFile(ocrFileName, true, true),
                this.storageProvider.deleteFile(assetFileName, true, true)
            ]
        );
    }

    /**
     * Save metadata for asset
     * @param metadata - Metadata for asset
     */
    public async save(metadata: IAssetMetadata): Promise<IAssetMetadata> {
        Guard.null(metadata);

        const labelFileName = decodeURIComponent(`${metadata.asset.name}${constants.labelFileExtension}`);
        if (metadata.labelData) {
            await this.storageProvider.writeText(labelFileName, JSON.stringify(metadata.labelData, null, 4));
        }

        if (metadata.asset.state !== AssetState.Tagged) {
            // If the asset is no longer tagged, then it doesn't contain any regions
            // and the file is not required.
            try {
                await this.storageProvider.deleteFile(labelFileName, true, true);
            } catch (err) {
                // The file may not exist - that's OK.
            }
        }
        return metadata;
    }

    /**
     * Get metadata for asset
     * @param asset - Asset for which to retrieve metadata
     */
    public async getAssetMetadata(asset: IAsset): Promise<IAssetMetadata> {
        Guard.null(asset);

        const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
        try {
            const json = await this.storageProvider.readText(labelFileName, true);
            const labelData = JSON.parse(json) as ILabelData;
            if (!labelData.document || !labelData.labels) {
                const reason = interpolate(strings.errors.missingRequiredFieldInLabelFile.message, { labelFileName });
                toast.error(reason, { autoClose: false });
                throw new Error("Invalid label file");
            }
            if (labelData.labels.length === 0) {
                const reason = interpolate(strings.errors.noLabelInLabelFile.message, { labelFileName });
                toast.info(reason);
                throw new Error("Empty label file");
            }
            if (labelData.labels.find((f) => f.label.trim().length === 0)) {
                toast.error(strings.tags.warnings.emptyName, { autoClose: false });
                throw new Error("Invalid label file");
            }
            if (labelData.labels.containsDuplicates<ILabel>((f) => f.label)) {
                const reason = interpolate(strings.errors.duplicateFieldKeyInLabelsFile.message, { labelFileName });
                toast.error(reason, { autoClose: false });
                throw new Error("Invalid label file");
            }
            const labelHash = new Set<string>();
            for (const label of labelData.labels) {
                const pageSet = new Set<number>();
                for (const valueObj of label.value) {
                    if (pageSet.size !== 0 && !pageSet.has(valueObj.page)) {
                        const reason = interpolate(
                            strings.errors.sameLabelInDifferentPageError.message, { tagName: label.label });
                        toast.error(reason, { autoClose: false });
                        throw new Error("Invalid label file");
                    }
                    pageSet.add(valueObj.page);
                    for (const box of valueObj.boundingBoxes) {
                        const hash = [valueObj.page, ...box].join();
                        if (labelHash.has(hash)) {
                            const reason = interpolate(
                                strings.errors.duplicateBoxInLabelFile.message, { page: valueObj.page });
                            toast.error(reason, { autoClose: false });
                            throw new Error("Invalid label file");
                        }
                        labelHash.add(hash);
                    }
                }
            }
            toast.dismiss();
            return {
                asset: { ...asset },
                regions: [],
                version: appInfo.version,
                labelData,
            };
        } catch (err) {
            if (err instanceof SyntaxError) {
                const reason = interpolate(strings.errors.invalidJSONFormat.message, { labelFileName });
                toast.error(reason, { autoClose: false });
            }
            return {
                asset: { ...asset },
                regions: [],
                version: appInfo.version,
                labelData: null,
            };
        }
    }

    /**
     * Delete a tag from asset metadata files
     * @param tagName Name of tag to delete
     */
    public async deleteTag(tagName: string): Promise<IAssetMetadata[]> {
        const transformer = (tagNames) => tagNames.filter((t) => t !== tagName);
        const labelTransformer = (labelData: ILabelData) => {
            labelData.labels = labelData.labels.filter((label) => label.label !== tagName);
            return labelData;
        };
        return await this.getUpdatedAssets(tagName, transformer, labelTransformer);
    }

    /**
     * Rename a tag within asset metadata files
     * @param tagName Name of tag to rename
     */
    public async renameTag(tagName: string, newTagName: string): Promise<IAssetMetadata[]> {
        const transformer = (tags) => tags.map((t) => (t === tagName) ? newTagName : t);
        const labelTransformer = (labelData: ILabelData) => {
            const field = labelData.labels.find((label) => label.label === tagName);
            if (field) {
                field.label = newTagName;
            }
            return labelData;
        };
        return await this.getUpdatedAssets(tagName, transformer, labelTransformer);
    }

    /**
     * Update tags within asset metadata files
     * @param tagName Name of tag to update within project
     * @param transformer Function that accepts array of tags from a region and returns a modified array of tags
     */
    private async getUpdatedAssets(
        tagName: string,
        transformer: (tags: string[]) => string[],
        labelTransformer: (label: ILabelData) => ILabelData)
        : Promise<IAssetMetadata[]> {
        // Loop over assets and update if necessary
        const updates = await _.values(this.project.assets).mapAsync(async (asset) => {
            const assetMetadata = await this.getAssetMetadata(asset);
            const isUpdated = this.updateTagInAssetMetadata(assetMetadata, tagName, transformer, labelTransformer);

            return isUpdated ? assetMetadata : null;
        });

        return updates.filter((assetMetadata) => !!assetMetadata);
    }

    /**
     * Update tag within asset metadata object
     * @param assetMetadata Asset metadata to update
     * @param tagName Name of tag being updated
     * @param transformer Function that accepts array of tags from a region and returns a modified array of tags
     * @returns Modified asset metadata object or null if object does not need to be modified
     */
    private updateTagInAssetMetadata(
        assetMetadata: IAssetMetadata,
        tagName: string,
        transformer: (tags: string[]) => string[],
        labelTransformer: (labelData: ILabelData) => ILabelData): boolean {
        let foundTag = false;

        for (const region of assetMetadata.regions) {
            if (region.tags.find((t) => t === tagName)) {
                foundTag = true;
                region.tags = transformer(region.tags);
            }
        }

        if (assetMetadata.labelData && assetMetadata.labelData.labels) {
            const field = assetMetadata.labelData.labels.find((field) => field.label === tagName);
            if (field) {
                foundTag = true;
                assetMetadata.labelData = labelTransformer(assetMetadata.labelData);
            }
        }

        if (foundTag) {
            assetMetadata.regions = assetMetadata.regions.filter((region) => region.tags.length > 0);
            assetMetadata.asset.state = _.get(assetMetadata, "labelData.labels.length")
                ? AssetState.Tagged : AssetState.Visited;
            return true;
        }

        return false;
    }

    private isInExactFolderPath = (assetName: string, normalizedPath: string): boolean => {
        if (normalizedPath === "") {
            return assetName.lastIndexOf("/") === -1;
        }

        const startsWithFolderPath = assetName.indexOf(`${normalizedPath}/`) === 0;
        return startsWithFolderPath && assetName.lastIndexOf("/") === normalizedPath.length;
    }

    /**
     * Poll function to repeatedly check if request succeeded
     * @param func - function that will be called repeatedly
     * @param timeout - timeout
     * @param interval - interval
     */
    private static pollForFetchAPI = (func, timeout, interval): Promise<any> => {
        const endTime = Number(new Date()) + (timeout || 10000);
        interval = interval || 100;

        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then(
                response => {
                    if (response.ok) {
                        resolve(response);
                    } else {
                        // Didn't succeeded after too much time, reject
                        reject("Timed out, please try other file or check your network setting.");
                    }
                }).catch(() => {
                    if (Number(new Date()) < endTime) {
                        // If the request isn't succeeded and the timeout hasn't elapsed, go again
                        setTimeout(checkSucceeded, interval, resolve, reject);
                    } else {
                        // Didn't succeeded after too much time, reject
                        reject("Timed out fetching file.");
                    }
                });
        };
        return new Promise(checkSucceeded);
    }
}
