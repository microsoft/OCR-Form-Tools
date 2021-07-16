// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import _ from "lodash";
import Guard from "../common/guard";
import {
    IAsset, AssetType, IProject, IAssetMetadata, AssetState,
    ILabelData, ILabel, AssetLabelingState, FieldType, FieldFormat, ITableConfigItem, ITableRegion, IFormRegion, TableVisualizationHint
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
import mime from 'mime';
import FileType from 'file-type';
import BrowserFileType from 'file-type/browser';

const supportedImageFormats = {
    jpg: null, jpeg: null, null: null, png: null, bmp: null, tif: null, tiff: null, pdf: null,
};

interface IMime {
    types: string[];
    pattern: (number | undefined)[];
}

/**
 * @name - Asset Service
 * @description - Functions for dealing with project assets
 */
export class AssetService {
    private getOcrFromAnalyzeResult(analyzeResult: any) {
        return _.get(analyzeResult, "analyzeResult.readResults", []);
    }
    getAssetPredictMetadata(asset: IAsset, predictResults: any): IAssetMetadata {
        asset = _.cloneDeep(asset);
        const getBoundingBox = (pageIndex, arr: number[]) => {
            const ocrForCurrentPage: any = this.getOcrFromAnalyzeResult(predictResults)[pageIndex - 1];
            const ocrExtent = [0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height];
            const ocrWidth = ocrExtent[2] - ocrExtent[0];
            const ocrHeight = ocrExtent[3] - ocrExtent[1];
            const result = [];
            for (let i = 0; i < arr.length; i += 2) {
                result.push(...[
                    (arr[i] / ocrWidth),
                    (arr[i + 1] / ocrHeight),
                ]);
            }
            return result;
        };
        const getLabelValues = (field: any) => {
            return field.elements?.map((path: string): IFormRegion => {
                const pathArr = path.split('/').slice(1);
                const word = pathArr.reduce((obj: any, key: string) => obj[key], { ...predictResults.analyzeResult });
                return {
                    page: field.page,
                    text: word.text || word.state,
                    boundingBoxes: [getBoundingBox(field.page, word.boundingBox)]
                };
            });
        };
        const labels =
            predictResults.analyzeResult.documentResults
                .map(result => Object.keys(result.fields)
                    .filter(key => result.fields[key])
                    .map<ILabel>(key => (
                        {
                            label: key,
                            key: null,
                            confidence: result.fields[key].confidence,
                            value: getLabelValues(result.fields[key])
                        }))).flat(2);

        const fileName = decodeURIComponent(asset.name).split('/').pop();
        const labelData: ILabelData = {
            document: fileName,
            labels: []
        };
        const metadata: IAssetMetadata = {
            asset: { ...asset },
            regions: [],
            version: appInfo.version,
            labelData,
        }
        if (labels.length > 0) {
            labelData.labelingState = AssetLabelingState.AutoLabeled;
            labelData.labels = labels;
            metadata.asset.labelingState = AssetLabelingState.AutoLabeled;
            metadata.asset.state = AssetState.Tagged;
        }
        return metadata;
    }
    async uploadPredictResultAsOrcResult(asset: IAsset, predictResults: any): Promise<void> {
        const ocrData = _.cloneDeep(predictResults);
        delete ocrData.analyzeResult.documentResults;
        if (ocrData.analyzeResult.errors) {
            delete ocrData.analyzeResult.errors;
        }
        const ocrFileName = `${asset.name}${constants.ocrFileExtension}`;
        await this.storageProvider.writeText(ocrFileName, JSON.stringify(ocrData, null, 2));
    }

    async syncAssetPredictResult(asset: IAsset, predictResults: any): Promise<IAssetMetadata> {
        const assetMeatadata = this.getAssetPredictMetadata(asset, predictResults);
        const ocrData = _.cloneDeep(predictResults);
        delete ocrData.analyzeResult.documentResults;
        if (ocrData.analyzeResult.errors) {
            delete ocrData.analyzeResult.errors;
        }
        const ocrFileName = `${asset.name}${constants.ocrFileExtension}`;
        if (assetMeatadata) {


            await Promise.all([
                this.save(assetMeatadata),
                this.storageProvider.writeText(ocrFileName, JSON.stringify(ocrData, null, 2))
            ]);
            return assetMeatadata;
        }
        else {
            const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
            try {
                await Promise.all([
                    this.storageProvider.deleteFile(labelFileName, true, true),
                    this.storageProvider.writeText(ocrFileName, JSON.stringify(ocrData, null, 2))
                ]);
            } catch (err) {
                // The label file may not exist - that's OK.
            }
            return null;
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
        const pathParts = filePath.split(/[\\/]/);
        fileName = fileName || pathParts[pathParts.length - 1];
        const fileNameParts = fileName.split(".");

        const extensionParts = fileNameParts[fileNameParts.length - 1].split(/[?#]/);
        let assetFormat = extensionParts[0].toLowerCase();
        let assetMimeType = mime.getType(assetFormat);
        if (supportedImageFormats.hasOwnProperty(assetFormat)) {
            let checkFileType;
            let corruptFileName;
            if (nodejsMode) {
                try {
                    checkFileType = await FileType.fromFile(normalizedPath);
                } catch {
                    // do nothing
                }
                corruptFileName = fileName.split(/[\\/]/).pop().replace(/%20/g, " ");

            } else {
                try {
                    const getFetchSteam = (): Promise<Response> => this.pollForFetchAPI(() => fetch(filePath), 1000, 200);
                    const response = await getFetchSteam();
                    checkFileType = await BrowserFileType.fromStream(response.body);
                } catch {
                    // do nothing
                }
                corruptFileName = fileName.split("%2F").pop().replace(/%20/g, " ");
            }
            let fileType;
            let mimeType;
            if (checkFileType) {
                fileType = checkFileType.ext;
                mimeType = checkFileType.mime;
            }

            if (!fileType) {
                console.error(interpolate(strings.editorPage.assetWarning.incorrectFileExtension.failedToFetch, { fileName: corruptFileName.toLocaleUpperCase() }));
            }
            // If file was renamed/spoofed - fix file extension to true MIME if it's type is in supported file types and show message
            else if (fileType !== assetFormat) {
                assetFormat = fileType;
                assetMimeType = mimeType;
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
            mimeType: assetMimeType,
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
            case "ai":
            case "pdf":
                return AssetType.PDF;
            default:
                return AssetType.Unknown;
        }
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

    public async getAsset(assetName: string): Promise<IAsset> {
        return await this.assetProvider.getAsset(this.project.folderPath, assetName);
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
    public async save(metadata: IAssetMetadata, needCleanEmptyLabel: boolean = false): Promise<IAssetMetadata> {
        Guard.null(metadata);

        const labelFileName = decodeURIComponent(`${metadata.asset.name}${constants.labelFileExtension}`);
        if (metadata.labelData) {
            await this.storageProvider.writeText(labelFileName, JSON.stringify(metadata.labelData, null, 4));
        }
        let cleanLabel: boolean = false;
        if (needCleanEmptyLabel && !metadata.labelData?.labels?.find(label => label?.value?.length !== 0)) {
            cleanLabel = true;
        }
        if (cleanLabel || metadata.asset.state !== AssetState.Tagged) {
            // If the asset is no longer tagged, then it doesn't contain any regions
            // and the file is not required.
            try {
                await this.storageProvider.deleteFile(labelFileName, true, true);
            } catch (err) {
                // The file may not exist - that's OK.
            }
        }
        return _.cloneDeep(metadata);
    }

    /**
     * Get metadata for asset
     * @param asset - Asset for which to retrieve metadata
     */
    public async getAssetMetadata(asset: IAsset): Promise<IAssetMetadata> {
        Guard.null(asset);
        const newAsset = _.cloneDeep(asset);
        const labelFileName = decodeURIComponent(`${newAsset.name}${constants.labelFileExtension}`);
        try {
            const json = await this.storageProvider.readText(labelFileName, true);
            const labelData = JSON.parse(json) as ILabelData;
            if (labelData) {
                labelData.labelingState = labelData.labelingState || AssetLabelingState.ManuallyLabeled;
                newAsset.labelingState = labelData.labelingState;
            }

            // to persist table labeling
            // if (!labelData.document || (!labelData.labels && !labelData.tableLabels)) {
            //     const reason = interpolate(strings.errors.missingRequiredFieldInLabelFile.message, { labelFileName });
            //     toast.error(reason, { autoClose: false });
            //     throw new Error("Invalid label file");
            // }
            // if (labelData.labels.length === 0) {
            //     const reason = interpolate(strings.errors.noLabelInLabelFile.message, { labelFileName });
            //     toast.info(reason);
            //     throw new Error("Empty label file");
            // }
            // if (labelData.labels.find((f) => f.label.trim().length === 0) ||labelData.tableLabels.find((f) => f.tableKey.trim().length === 0) ) {
            //     toast.error(strings.tags.warnings.emptyName, { autoClose: false });
            //     throw new Error("Invalid label file");
            // }
            // if (labelData.labels.containsDuplicates<ILabel>((f) => f.label) || labelData.tableLabels.containsDuplicates<ITableLabel>((f) => f.tableKey)) {
            //     const reason = interpolate(strings.errors.duplicateFieldKeyInLabelsFile.message, { labelFileName });
            //     toast.error(reason, { autoClose: false });
            //     throw new Error("Invalid label file");
            // }

            // const labelHash = new Set<string>();
            // for (const label of labelData.labels) {
            //     const pageSet = new Set<number>();
            //     for (const valueObj of label.value) {
            //         if (pageSet.size !== 0 && !pageSet.has(valueObj.page)) {
            //             const reason = interpolate(
            //                 strings.errors.sameLabelInDifferentPageError.message, { tagName: label.label });
            //             toast.error(reason, { autoClose: false });
            //             throw new Error("Invalid label file");
            //         }

            //         pageSet.add(valueObj.page);
            //         for (const box of valueObj.boundingBoxes) {
            //             const hash = [valueObj.page, ...box].join();
            //             if (labelHash.has(hash)) {
            //                 const reason = interpolate(
            //                     strings.errors.duplicateBoxInLabelFile.message, { page: valueObj.page });
            //                 toast.error(reason, { autoClose: false });
            //                 throw new Error("Invalid label file");
            //             }
            //             labelHash.add(hash);
            //         }
            //     }
            // }
            // toast.dismiss();
            return {
                asset: { ...newAsset, labelingState: labelData.labelingState },
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
                asset: { ...newAsset },
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
    public async deleteTag(tagName: string, tagType: FieldType, tagFormat: FieldFormat): Promise<IAssetMetadata[]> {
        const transformer = (tagNames) => tagNames.filter((t) => t !== tagName);
        const labelTransformer = (labelData: ILabelData) => {
            if (tagType === FieldType.Object || tagType === FieldType.Array) {
                labelData.labels = labelData.labels.filter((label) => label.label.split("/")[0].replace(/~1/g, "/").replace(/~0/g, "~") !== tagName);
            } else {
                if (constants.supportedLabelsSchemas.has(labelData?.$schema)) {
                    labelData.labels = labelData.labels.filter((label) => label.label.replace(/~1/g, "/").replace(/~0/g, "~") !== tagName);
                } else {
                    labelData.labels = labelData.labels.filter((label) => label.label !== tagName);
                }
            }
            return labelData;
        };
        return await this.getUpdatedAssets(tagName, tagType, tagFormat, transformer, labelTransformer);
    }

    public async refactorTableTag(originalTagName: string, tagName: string, tagType: FieldType, tagFormat: FieldFormat, visualizationHint: TableVisualizationHint, deletedColumns: ITableConfigItem[], deletedRows: ITableConfigItem[], newRows: ITableConfigItem[], newColumns: ITableConfigItem[]): Promise<IAssetMetadata[]> {
        const transformer = (tagNames, columnKey, rowKey) => {
            let newTags = tagNames;
            let newColumnKey = columnKey;
            let newRowKey = rowKey;
            if (tagNames[0] === originalTagName) {
                const hasDeletedRowOrKey = deletedColumns?.find((deletedColumn) => deletedColumn.originalName === columnKey) || deletedRows?.find((deletedRow) => deletedRow.originalName === rowKey);
                if (hasDeletedRowOrKey) {
                    newTags = [];
                    newColumnKey = undefined;
                    newRowKey = undefined
                    return { newTags, newColumnKey, newRowKey }
                }
                const columnRenamed = newColumns?.find((newColumn) => newColumn.originalName === columnKey && newColumn.originalName !== newColumn.name)
                const rowRenamed = newRows?.find((newRow) => newRow.originalName === rowKey && newRow.originalName !== newRow.name)
                if (columnRenamed) {
                    newColumnKey = columnRenamed.name;
                }
                if (rowRenamed) {
                    newRowKey = rowRenamed.name
                }
            }
            return { newTags, newColumnKey, newRowKey }
        }
        const labelTransformer = (labelData: ILabelData) => {
            labelData.labels = labelData?.labels?.reduce((result, label) => {
                const labelString = label.label.split("/").map((layer) => { return layer.replace(/~1/g, "/").replace(/~0/g, "~") });
                if (labelString.length > 1) {
                    const labelTagName = labelString[0];
                    if (labelTagName !== originalTagName) {
                        result.push(label);
                        return result;
                    }
                    let columnKey;
                    let rowKey;
                    if (tagType === FieldType.Object) {
                        if (visualizationHint === TableVisualizationHint.Vertical) {
                            rowKey = labelString[1]
                            columnKey = labelString[2];
                        } else {
                            columnKey = labelString[1]
                            rowKey = labelString[2];
                        }
                        if (deletedRows?.find((deletedRow) => deletedRow.originalName === rowKey) || deletedColumns?.find((deletedColumn) => deletedColumn.originalName === columnKey)) {
                            return result;
                        }
                        const column = newColumns?.find((newColumn) => newColumn.originalName === columnKey)
                        const row = newRows?.find((newRow) => newRow.originalName === rowKey)
                        if (visualizationHint === TableVisualizationHint.Vertical) {
                            result.push({
                                ...label,
                                label: tagName.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + (row?.name || rowKey).replace(/~/g, "~0").replace(/\//g, "~1") + "/" + (column?.name || columnKey).replace(/~/g, "~0").replace(/\//g, "~1"),
                            })
                        } else {
                            result.push({
                                ...label,
                                label: tagName.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + (column?.name || columnKey).replace(/~/g, "~0").replace(/\//g, "~1") + "/" + (row?.name || rowKey).replace(/~/g, "~0").replace(/\//g, "~1"),
                            })
                        }

                    } else {
                        rowKey = labelString[1]
                        columnKey = labelString[2];
                        if (deletedColumns?.find((deletedColumn) => deletedColumn.originalName === columnKey)) {
                            return result;
                        }
                        const column = newColumns?.find((newColumn) => newColumn.originalName === columnKey)
                        result.push({
                            ...label,
                            label: tagName.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + rowKey.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + (column?.name || columnKey).replace(/~/g, "~0").replace(/\//g, "~1"),
                        })
                    }
                    return result;

                } else {
                    result.push(label);
                    return result;
                }
            }, [])
            return labelData;
        }

        return await this.getUpdatedAssetsAfterReconfigure(originalTagName, tagName, tagType, tagFormat, transformer, labelTransformer);
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
        return await this.getUpdatedAssets(tagName, null, null, transformer, labelTransformer);
    }

    /**
     * Update tags within asset metadata files
     * @param tagName Name of tag to update within project
     * @param transformer Function that accepts array of tags from a region and returns a modified array of tags
     */
    private async getUpdatedAssets(
        tagName: string,
        tagType: FieldType,
        tagFormat: FieldFormat,
        transformer: (tags: string[]) => string[],
        labelTransformer: (label: ILabelData) => ILabelData)
        : Promise<IAssetMetadata[]> {
        // Loop over assets and update if necessary
        const updates = await _.values(this.project.assets).mapAsync(async (asset) => {
            const assetMetadata = await this.getAssetMetadata(asset);
            const isUpdated = this.updateTagInAssetMetadata(assetMetadata, tagName, tagType, tagFormat, transformer, labelTransformer);

            return isUpdated ? assetMetadata : null;
        });

        return updates.filter((assetMetadata) => !!assetMetadata);
    }

    private async getUpdatedAssetsAfterReconfigure(
        originalTagName: string,
        tagName: string,
        tagType: FieldType,
        tagFormat: FieldFormat,
        transformer: (tags: string[], columnKey: string, rowKey: string) => any,
        labelTransformer: (label: ILabelData) => ILabelData)
        : Promise<IAssetMetadata[]> {
        // Loop over assets and update if necessary
        const updates = await _.values(this.project.assets).mapAsync(async (asset) => {
            const assetMetadata = await this.getAssetMetadata(asset);
            const isUpdated = this.reconfigureTableTagInAssetMetadata(assetMetadata, originalTagName, tagName, tagType, tagFormat, transformer, labelTransformer);
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
        tagType: FieldType,
        tagFormat: FieldFormat,
        transformer: (tags: string[]) => string[],
        labelTransformer: (labelData: ILabelData) => ILabelData): boolean {
        let foundTag = false;

        for (const region of assetMetadata.regions) {
            if (region.tags.find((t) => t === tagName)) {
                foundTag = true;
                region.tags = transformer(region.tags);
            }
        }
        if (tagType === FieldType.Array || tagType === FieldType.Object) {
            if (assetMetadata?.labelData?.labels) {
                const field = assetMetadata.labelData.labels.find((field) => field.label.split("/")[0].replace(/~1/g, "/").replace(/~0/g, "~") === tagName);
                if (field) {
                    foundTag = true;
                    assetMetadata.labelData = labelTransformer(assetMetadata.labelData);
                }
            }
        } else {
            if (assetMetadata.labelData && assetMetadata.labelData.labels) {
                const field = assetMetadata.labelData.labels.find((field) => field.label === tagName);
                if (field) {
                    foundTag = true;
                }
            }
        }

        if (foundTag) {
            assetMetadata.labelData = labelTransformer(assetMetadata.labelData);
            assetMetadata.regions = assetMetadata.regions.filter((region) => region.tags.length > 0);
            assetMetadata.asset.state = _.get(assetMetadata, "labelData.labels.length") || _.get(assetMetadata, "labelData.tableLabels.length")
                ? AssetState.Tagged : AssetState.Visited;
            return true;
        }

        return false;
    }

    private reconfigureTableTagInAssetMetadata(
        assetMetadata: IAssetMetadata,
        originalTagName: string,
        tagName: string,
        tagType: FieldType,
        tagFormat: FieldFormat,
        transformer: any,
        labelTransformer: (labelData: ILabelData) => ILabelData): boolean {
        let foundTag = false;
        for (const region of assetMetadata.regions) {
            if (region.tags.find((t) => t === originalTagName)) {
                foundTag = true;
                const { newTags, newColumnKey, newRowKey } = transformer((region as ITableRegion).tags, (region as ITableRegion).columnKey, (region as ITableRegion).rowKey);
                region.tags = newTags;
                (region as ITableRegion).columnKey = newColumnKey;
                (region as ITableRegion).rowKey = newRowKey;

            }
        }
        if (tagType === FieldType.Array || tagType === FieldType.Object) {
            const field = assetMetadata?.labelData?.labels?.find((field) => field.label.split("/")[0] === originalTagName.replace(/~/g, "~0").replace(/\//g, "~1"));
            if (field) {
                foundTag = true;
            }
        }

        if (foundTag) {
            assetMetadata.labelData = labelTransformer(assetMetadata.labelData);
            if (assetMetadata.labelData.labels.length === 0) {
                delete assetMetadata.labelData.labelingState;
                delete assetMetadata.asset.labelingState;
            }
            assetMetadata.regions = assetMetadata.regions.filter((region) => region.tags.length > 0);
            assetMetadata.asset.state = _.get(assetMetadata, "labelData.labels.length") || _.get(assetMetadata, "labelData.tableLabels.length")
                ? AssetState.Tagged : AssetState.Visited;
            if (assetMetadata.asset.labelingState === AssetLabelingState.Trained) {
                assetMetadata.asset.labelingState = AssetLabelingState.ManuallyLabeled;
                if (assetMetadata.labelData) {
                    assetMetadata.labelData.labelingState = AssetLabelingState.ManuallyLabeled;
                }
            } else if (assetMetadata.asset.labelingState === AssetLabelingState.AutoLabeled) {
                assetMetadata.asset.labelingState = AssetLabelingState.AutoLabeledAndAdjusted;
                if (assetMetadata.labelData) {
                    assetMetadata.labelData.labelingState = AssetLabelingState.AutoLabeledAndAdjusted;
                }
            }
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

    /**
     * Chech and update schema version through label.json files relate to project assets.
     * @param project to get assets and connect to file system.
     * @returns updated project
     */
    public static checkAndUpdateSchema = async (project: IProject): Promise<IProject> => {
        let shouldAssetsUpdate = false;
        let updatedProject;
        const { assets } = project;
        if (_.isPlainObject(assets)) {
            const assetService = new AssetService(project);
            const assetMetadatas: IAssetMetadata[] = await Promise.all(Object.values(assets).map(async (asset) => await assetService.getAssetMetadata(asset)));
            await Promise.all(assetMetadatas.map(async (assetMetadata) => {
                if (_.isPlainObject(assetMetadata.labelData)) {
                    let shouldSaveMetadata = false;

                    // Check and update $schema property.
                    if (AssetService.shouldSchemaUpdate(assetMetadata.labelData?.$schema)) {
                        shouldAssetsUpdate = true;
                        assetMetadata.labelData = { ...assetMetadata.labelData, "$schema": constants.labelsSchema };
                        shouldSaveMetadata = true;
                    }

                    // Check and remove labelType property.
                    let shouldUpdateLabels = false;
                    const labels = assetMetadata.labelData?.labels || [];
                    labels.forEach(label => {
                        if (AssetService.shouldRemoveLabelType(label)) {
                            delete label.labelType;
                            shouldUpdateLabels = true;
                        }
                    });

                    if (shouldUpdateLabels) {
                        assetMetadata.labelData = { ...assetMetadata.labelData, labels };
                        shouldSaveMetadata = true;
                    }

                    // Save back to storage.
                    if (shouldSaveMetadata) {
                        await assetService.save(assetMetadata);
                    }
                }
            }));
            const updatedAssets = { ...assets };
            for (const [assetID, asset] of Object.entries(assets)) {
                if (AssetService.shouldSchemaUpdate(asset.schema)) {
                    updatedAssets[assetID] = { ...assets[assetID], schema: constants.labelsSchema };
                }
            }
            updatedProject = { ...project, assets: updatedAssets };
        }
        return shouldAssetsUpdate ? updatedProject : project;
    }

    public static shouldSchemaUpdate = (schema: string): boolean => {
        return constants.supportedLabelsSchemas.has(schema) && schema !== constants.labelsSchema;
    }

    public static shouldRemoveLabelType = (label: ILabel): boolean => {
        return label.hasOwnProperty("labelType") && label.labelType === null;
    }
}
