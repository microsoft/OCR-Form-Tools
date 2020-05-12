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

/**
 * @name - Asset Service
 * @description - Functions for dealing with project assets
 */
export class AssetService {
    /**
     * Create IAsset from filePath
     * @param filePath - filepath of asset
     * @param fileName - name of asset
     */
    public static async createAssetFromFilePath(filePath: string, fileName?: string): Promise<IAsset> {
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

        const hash = await sha256Hash(filePath);
        // eslint-disable-next-line
        const pathParts = filePath.split(/[\\\/]/);
        fileName = fileName || pathParts[pathParts.length - 1];
        const fileNameParts = fileName.split(".");

        // eslint-disable-next-line
        const extensionParts = fileNameParts[fileNameParts.length - 1].split(/[\?#]/);
        let assetFormat = extensionParts[0];

        if (assetFormat !== "json" && assetFormat !== "fott" && assetFormat !== "txt") {
            const mime = await this.getMimeType(filePath);
            // If file was renamed - fix file extension to true MIME type
            if (assetFormat !== mime) {
                assetFormat = mime;

                const corruptFileName = fileName.split("%").pop().substring(2);
                toast.info(`Attention! ${corruptFileName} extension doesn't correspond file MIME type of the file. Please check ${corruptFileName}`, {autoClose: false});
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
        switch (format.toLowerCase()) {
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

    public static getMimeType = async (uri: string) => {
        const FileType = require("file-type/browser");
        const response = await fetch(uri);
        const fileType = await FileType.fromStream(response.body);
        if (fileType) {
            return fileType.mime.split("/").pop();
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
        const returnedAssets = assets.map((asset) => {
            asset.name = decodeURIComponent(asset.name);
            return asset;
        }).filter((asset) => this.isInExactFolderPath(asset.name, folderPath));

        return returnedAssets;
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
}
