// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AzureBlobStorageError } from "./azureBlobStorageError";
import { IStorageProvider } from "./storageProviderFactory";
import { IAsset, AssetType, StorageType, AssetState, AppError } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import {
    TokenCredential, AnonymousCredential, ContainerURL,
    StorageURL, Credential, Aborter, BlockBlobURL, ServiceURL
} from "@azure/storage-blob";
import { constants } from "../../common/constants";
import { ErrorCode } from "../../models/applicationState";
import { strings } from "../../common/strings";
import { throwUnhandledRejectionForEdge } from "../../react/components/common/errorHandler/errorHandler";

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
export class AzureBlobStorage implements IStorageProvider {
    /**
     * Storage type
     * @returns - StorageType.Cloud
     */
    public storageType: StorageType = StorageType.Cloud;

    constructor(private options?: IAzureCloudStorageOptions) { }

    /**
     * Initialize connection to Blob Storage account & container
     * If `createContainer` was specified in options, this function
     * creates the container. Otherwise, validates that container
     * is contained in list of containers
     * @throws - Error if container does not exist or not able to
     * connect to Azure Blob Storage
     */
    // tslint:disable-next-line:no-empty
    public async initialize(): Promise<void> {}

    /**
     * Reads text from specified blob
     * @param blobName - Name of blob in container
     */
    public async readText(blobName: string, ignoreNotFound?: boolean): Promise<string> {
        try {
            const blockBlobURL = this.getBlockBlobURL(blobName);
            const downloadResponse = await blockBlobURL.download(Aborter.none, 0);
            return await this.bodyToString(downloadResponse);
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception, ignoreNotFound);
        }
    }

    public async isValidProjectConnection() {
        try {
            return await new ServiceURL(this.options.sas, StorageURL.newPipeline(this.getCredential())).getAccountInfo(Aborter.timeout(5000))
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            })
        } catch {
            return (false);
        }
    }

    /**
     * Reads Buffer from specified blob
     * @param blobName - Name of blob in container
     */
    public async readBinary(blobName: string) {
        try {
            const text = await this.readText(blobName);
            return Buffer.from(text);
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
            const containerURL = new ContainerURL(this.options.sas, StorageURL.newPipeline(this.getCredential()));
            const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, blobName);
            await blockBlobURL.upload(
                Aborter.none,
                content,
                content.length,
            );
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
    }

    /**
     * Writes buffer to blob in container
     * @param blobName - Name of blob in container
     * @param content - Buffer to write to blob
     */
    public writeBinary(blobName: string, content: Buffer) {
        try {
            return this.writeText(blobName, content);
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
            await this.getBlockBlobURL(blobName).delete(Aborter.none);
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
            let marker;
            const containerURL = new ContainerURL(this.options.sas, StorageURL.newPipeline(this.getCredential()));
            do {
                const pathIsString = typeof path === "string";
                if (pathIsString && path.length > 0 && path[path.length - 1] !== "/") {
                    path += "/";
                }
                const listBlobsResponse = pathIsString
                    ? await containerURL.listBlobHierarchySegment(
                        Aborter.none,
                        "/",
                        marker,
                        { prefix: path })
                    : await containerURL.listBlobFlatSegment(
                        Aborter.none,
                        marker);
                if (!listBlobsResponse.segment || !listBlobsResponse.containerName) {
                    throw new AzureBlobStorageError(404);
                }
                marker = listBlobsResponse.nextMarker;
                for (const blob of listBlobsResponse.segment.blobItems) {
                    if ((ext && blob.name.endsWith(ext)) || !ext) {
                        result.push(blob.name);
                    }
                }
            } while (marker);

            return result;
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
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
        const containerURL = new ContainerURL(this.options.sas, StorageURL.newPipeline(this.getCredential()));
        try {
            await containerURL.create(Aborter.none);
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
            const containerURL = new ContainerURL(this.options.sas, StorageURL.newPipeline(this.getCredential()));
            await containerURL.delete(Aborter.none);
        } catch (exception) {
            this.azureBlobStorageErrorHandler(exception);
        }
    }

    /**
     * Retrieves assets from Azure Blob Storage container
     */
    public async getAssets(folderPath?: string): Promise<IAsset[]> {
        const files: string[] = await this.listFiles(folderPath);
        const result: IAsset[] = [];
        for (const file of files) {
            const url = this.getUrl(file);
            const asset = await AssetService.createAssetFromFilePath(url, this.getFileName(url));
            if (this.isSupportedAssetType(asset.type)) {
                const labelFileName = decodeURIComponent(`${asset.name}${constants.labelFileExtension}`);
                const ocrFileName = decodeURIComponent(`${asset.name}${constants.ocrFileExtension}`);

                if (files.find((str) => str === labelFileName)) {
                    asset.state = AssetState.Tagged;
                } else if (files.find((str) => str === ocrFileName)) {
                    asset.state = AssetState.Visited;
                } else {
                    asset.state = AssetState.NotVisited;
                }

                result.push(asset);
            }
        }
        return result;
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

    /**
     * Gets a Credential object. OAuthToken if specified in options, anonymous
     * credential otherwise (uses the SAS token)
     * @returns - Credential object from Azure Storage SDK
     */
    private getCredential(): Credential {
        if (this.options.oauthToken) {
            return new TokenCredential(this.options.oauthToken);
        } else {
            return new AnonymousCredential();
        }
    }

    private getBlockBlobURL(blobName: string): BlockBlobURL {
        const containerURL = new ContainerURL(this.options.sas, StorageURL.newPipeline(this.getCredential()));
        return BlockBlobURL.fromContainerURL(containerURL, blobName);
    }

    private getUrl(blobName: string): string {
        return this.getBlockBlobURL(blobName).url;
    }

    private async bodyToString(
        response: {
            readableStreamBody?: NodeJS.ReadableStream;
            blobBody?: Promise<Blob>;
        },
        // tslint:disable-next-line:variable-name
        _length?: number,
    ): Promise<string> {
        const blob = await response.blobBody!;
        return this.blobToString(blob);
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
