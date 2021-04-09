// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { constants } from "../../common/constants";
import { strings } from "../../common/strings";
import { AppError, AssetState, AssetType, ErrorCode, IAsset, StorageType, ILabelData, AssetLabelingState } from "../../models/applicationState";
import { throwUnhandledRejectionForEdge } from "../../react/components/common/errorHandler/errorHandler";
import { AssetService } from "../../services/assetService";
import { IStorageProvider } from "./storageProviderFactory";
import {withQueueMap} from "../../common/queueMap/withQueueMap"

/**
 * Options for Azure Cloud Storage
 * @member sas - Shared Access Signature (SAS) token for accessing Azure Blob Storage
 * @member oauthToken - Not yet implemented. Optional token for accessing Azure Blob Storage
 */
export interface IAzureCloudStorageOptions {
    sas?: string;
    oauthToken?: string;
}

/**
 * Storage Provider for Azure Blob Storage
 */
@withQueueMap
export class AzureBlobStorage implements IStorageProvider {
    /**
     * Storage type
     * @returns - StorageType.Cloud
     */
    public storageType: StorageType = StorageType.Cloud;

    private containerClient: ContainerClient;
    constructor(private options?: IAzureCloudStorageOptions) {
        this.containerClient = new ContainerClient(options!.sas!);
    }

    /**
     * Initialize connection to Blob Storage account & container
     * If `createContainer` was specified in options, this function
     * creates the container. Otherwise, validates that container
     * is contained in list of containers
     * @throws - Error if container does not exist or not able to
     * connect to Azure Blob Storage
     */
    // tslint:disable-next-line:no-empty
    public async initialize(): Promise<void> { }

    /**
     * Reads text from specified blob
     * @param blobName - Name of blob in container
     */
    public async readText(blobName: string, ignoreNotFound?: boolean | undefined): Promise<string> {
        try {
            const client = this.containerClient.getBlockBlobClient(blobName);
            const result = await client.download();

            return await this.blobToString(await result.blobBody!);
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception, ignoreNotFound);
        }
    }

    public async isValidProjectConnection(filepath?: string | undefined): Promise<boolean> {
        try {
            const client = new BlobServiceClient(this.options!.sas!);
            return await client.getAccountInfo()
                .then(() => {
                    return true;
                })
                .catch(() => {
                    return false;
                });
        } catch {
            return false;
        }
    }

    /**
     * Reads Buffer from specified blob
     * @param blobName - Name of blob in container
     */
    public async readBinary(blobName: string): Promise<Buffer> {
        try {
            const client = this.containerClient.getBlockBlobClient(blobName);
            const result = await client.download();

            const arrayBuffer = await this.blobToArrayBuffer(await result.blobBody!);
            return Buffer.from(arrayBuffer);
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
    }

    /**
     * Writes text to blob in container
     * @param blobName - Name of blob in container
     * @param content - Content to write to blob (string or Buffer)
     */
    public async writeText(blobName: string, content: string | Buffer) {
        try {
            await this.containerClient.uploadBlockBlob(blobName, content, content.length);
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
    }

    /**
     * Writes buffer to blob in container
     * @param blobName - Name of blob in container
     * @param content - Buffer to write to blob
     */
    public async writeBinary(blobName: string, content: Buffer) {
        try {
            await this.containerClient.uploadBlockBlob(blobName, content, content.length);
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
    }

    /**
     * Deletes file from container
     * @param blobName - Name of blob in container
     */
    public async deleteFile(blobName: string, ignoreNotFound?: boolean, ignoreForbidden?: boolean): Promise<void> {
        try {
            await this.containerClient.deleteBlob(blobName);
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception, ignoreNotFound, ignoreForbidden);
        }
    }

    /**
     * Lists files in container
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Only uses container
     * as specified in Azure Cloud Storage Options. Included to satisfy
     * Storage Provider interface
     * @param ext - Extension of files to filter on when retrieving files
     * from container
     */
    public async listFiles(path?: string, ext?: string): Promise<string[]> {
        try {
            const result: string[] = [];
            for await (const blob of this.containerClient.listBlobsFlat({ prefix: path, includeDeleted: false })) {
                if ((ext && blob.name.endsWith(ext)) || !ext) {
                    result.push(blob.name);
                }
            }
            return result;
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
    }

    /**
     * check file is exists
     * @param filePath
     */
    public async isFileExists(filePath: string) :Promise<boolean> {
        const client = this.containerClient.getBlobClient(filePath);
        return await client.exists();
    }
    /**
     * Lists the containers with in the Azure Blob Storage account
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Lists containers in storage account.
     * Path does not really make sense in this scenario. Included to satisfy interface
     */
    public async listContainers(path: string) {
        return Promise.reject("Not implemented");
    }

    /**
     * Creates container specified in Azure Cloud Storage options
     * @param containerName - NOT USED IN CURRENT IMPLEMENTATION. Because `containerName`
     * is a required attribute of the Azure Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async createContainer(containerName: string): Promise<void> {
        try {
            await this.containerClient.create();
        } catch (e) {
            if (e.statusCode === 409) {
                return;
            }

            throw e;
        }
    }

    /**
     * Deletes container specified in Azure Cloud Storage options
     * @param containerName - NOT USED IN CURRENT IMPLEMENTATION. Because `containerName`
     * is a required attribute of the Azure Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async deleteContainer(containerName: string): Promise<void> {
        try {
            await this.containerClient.delete();
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
    }

    /**
     * Retrieves assets from Azure Blob Storage container
     */
    public async getAssets(folderPath?: string, folderName?: string): Promise<IAsset[]> {
        const files: string[] = await this.listFiles(folderPath);
        const result: IAsset[] = [];
        await Promise.all(files.map(async (file) => {
            const url = this.getUrl(file);
            const asset = await AssetService.createAssetFromFilePath(url, this.getFileName(url));
            if (this.isSupportedAssetType(asset.type)) {
                const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
                const ocrFileName = decodeURIComponent(`${asset.name}${constants.ocrFileExtension}`);

                if (files.find((str) => str === labelFileName)) {
                    asset.state = AssetState.Tagged;
                    const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
                    const json = await this.readText(labelFileName, true);
                    const labelData = JSON.parse(json) as ILabelData;
                    if (labelData) {
                        asset.labelingState = labelData.labelingState || AssetLabelingState.ManuallyLabeled;
                        asset.schema = labelData.$schema;
                    }
                } else if (files.find((str) => str === ocrFileName)) {
                    asset.state = AssetState.Visited;
                } else {
                    asset.state = AssetState.NotVisited;
                }
                result.push(asset);
            }
        }));
        return result;
    }

    public async getAsset(folderPath: string, assetName: string): Promise<IAsset>{
        const files: string[] = await this.listFiles(folderPath);
        if(files.findIndex(f=>f===assetName)!==-1){
            const url = this.getUrl(assetName);
            const asset = await AssetService.createAssetFromFilePath(url, this.getFileName(url));
            if (this.isSupportedAssetType(asset.type)) {
                const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
                const ocrFileName = decodeURIComponent(`${asset.name}${constants.ocrFileExtension}`);

                if (files.find((str) => str === labelFileName)) {
                    asset.state = AssetState.Tagged;
                    const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
                    const json = await this.readText(labelFileName, true);
                    const labelData = JSON.parse(json) as ILabelData;
                    if (labelData) {
                        asset.labelingState = labelData.labelingState || AssetLabelingState.ManuallyLabeled;
                        asset.schema = labelData.$schema;
                    }
                } else if (files.find((str) => str === ocrFileName)) {
                    asset.state = AssetState.Visited;
                } else {
                    asset.state = AssetState.NotVisited;
                }
                return asset;
            }
        }
        else {
            return null;
        }
    }

    /**
     *
     * @param url - URL for Azure Blob
     */
    public getFileName(url: string) {
        const pathParts = url.split("/");
        return pathParts[pathParts.length - 1].split("?")[0];
    }

    private isSupportedAssetType(assetType: AssetType) {
        return assetType === AssetType.Image || assetType === AssetType.TIFF || assetType === AssetType.PDF;
    }

    private getUrl(blobName: string): string {
        return this.containerClient.getBlobClient(blobName).url;
    }

    private async blobToString(blob: Blob): Promise<string> {
        const fileReader = new FileReader();

        return new Promise<string>((resolve, reject) => {
            fileReader.onloadend = (ev: any) => {
                resolve(ev.target!.result);
            };
            fileReader.onerror = reject;
            fileReader.readAsText(blob);
        });
    }
    private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
        const fileReader = new FileReader();
        return new Promise<ArrayBuffer>((resolve, reject) => {
            fileReader.onloadend = (ev: any) => {
                resolve(ev.target!.result);
            };
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(blob);
        });
    }

    private azureBlobStorageErrorHandler = (exception, ignoreNotFound?: boolean, ignoreForbidden?: boolean) => {
        const appError = this.toAppError(exception);
        throwUnhandledRejectionForEdge(appError, ignoreNotFound, ignoreForbidden);
        throw appError;
    }

    private toAppError(exception) {
        if (exception.statusCode === 404) {
            return new AppError(
                ErrorCode.BlobContainerIONotFound,
                strings.errors.blobContainerIONotFound.message,
                strings.errors.blobContainerIONotFound.title);
        } else if (exception.statusCode === 403) {
            return new AppError(
                ErrorCode.BlobContainerIOForbidden,
                strings.errors.blobContainerIOForbidden.message,
                strings.errors.blobContainerIOForbidden.title);
        } else if (exception.code === "REQUEST_SEND_ERROR") {
            return new AppError(
                ErrorCode.RequestSendError,
                strings.errors.requestSendError.message,
                strings.errors.requestSendError.title,
            );
        }
        return exception;
    }
}
