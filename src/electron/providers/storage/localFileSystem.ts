// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import { BrowserWindow, dialog } from "electron";
import { IStorageProvider } from "../../../providers/storage/storageProviderFactory";
import { IAsset, AssetState, AssetType, StorageType, ILabelData, AssetLabelingState } from "../../../models/applicationState";
import { AssetService } from "../../../services/assetService";
import { constants } from "../../../common/constants";
import { strings } from "../../../common/strings";

// tslint:disable-next-line:no-var-requires
const FileType = require('file-type');

export default class LocalFileSystem implements IStorageProvider {

    public storageType: StorageType.Local;

    constructor(private browserWindow: BrowserWindow) {
    }

    public selectContainer(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            const result = await dialog.showOpenDialog(this.browserWindow, {
                title: strings.connections.providers.local.selectFolder,
                buttonLabel: strings.connections.providers.local.chooseFolder,
                properties: ["openDirectory", "createDirectory"],
            });

            if (!result || result.filePaths.length !== 1) {
                return reject();
            }

            resolve(result.filePaths[0]);
        });
    }

    public readText(filePath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(path.normalize(filePath), (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    return reject(err);
                }

                resolve(data.toString());
            });
        });
    }

    public isValidProjectConnection(folderPath) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                if (fs.existsSync(folderPath)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    public getFileType(filePath: string): Promise<Buffer> {
        return FileType.fromFile(filePath);
    }

    public readBinary(filePath: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(path.normalize(filePath), (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    }

    public writeBinary(filePath: string, contents: Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const containerName: fs.PathLike = path.normalize(path.dirname(filePath));
            const exists = fs.existsSync(containerName);
            if (!exists) {
                fs.mkdirSync(containerName);
            }

            fs.writeFile(path.normalize(filePath), contents, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    public writeText(filePath: string, contents: string): Promise<void> {
        const buffer = Buffer.from(contents);
        return this.writeBinary(filePath, buffer);
    }

    public deleteFile(filePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const exists = fs.existsSync(path.normalize(filePath));
            if (!exists) {
                resolve();
            }

            fs.unlink(filePath, (err) => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    public listFiles(folderPath: string): Promise<string[]> {
        return this.listItems(path.normalize(folderPath), (stats) => !stats.isDirectory());
    }

    public isFileExists(filePath: string): Promise<boolean> {
        return Promise.resolve(fs.existsSync(path.normalize(filePath)));
    }

    public listContainers(folderPath: string): Promise<string[]> {
        return this.listItems(path.normalize(folderPath), (stats) => stats.isDirectory());
    }

    public createContainer(folderPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.exists(path.normalize(folderPath), (exists) => {
                if (exists) {
                    resolve();
                } else {
                    fs.mkdir(path.normalize(folderPath), (err) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
                }
            });
        });
    }

    public deleteContainer(folderPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.exists(path.normalize(folderPath), (exists) => {
                if (exists) {
                    rimraf(path.normalize(folderPath), (err) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    public async getAssets(folderPath?: string, folderName?: string): Promise<IAsset[]> {
        folderPath = [folderPath, folderName].join("/");
        const result: IAsset[] = [];
        const files = await this.listFiles(path.normalize(folderPath));
        await Promise.all(files.map(async (file) => {
            const fileParts = file.split(/[\\\/]/);
            const fileName = fileParts[fileParts.length - 1];
            const asset = await AssetService.createAssetFromFilePath(file, folderName + "/" + fileName, true);
            if (this.isSupportedAssetType(asset.type)) {
                const labelFileName = decodeURIComponent(`${file}${constants.labelFileExtension}`);
                const ocrFileName = decodeURIComponent(`${file}${constants.ocrFileExtension}`);
                if (files.find((str) => str === labelFileName)) {
                    asset.state = AssetState.Tagged;
                    const json = await this.readText(labelFileName);
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
        const files = await this.listFiles(path.normalize(folderPath));
        if(files.findIndex(f=>f===assetName)!==-1){
            const fileParts = assetName.split(/[\\\/]/);
            const fileName = fileParts[fileParts.length - 1];
            const asset = await AssetService.createAssetFromFilePath(assetName, folderPath + "/" + fileName, true);
            if (this.isSupportedAssetType(asset.type)) {
                const labelFileName = decodeURIComponent(`${assetName}${constants.labelFileExtension}`);
                const ocrFileName = decodeURIComponent(`${assetName}${constants.ocrFileExtension}`);
                if (files.find((str) => str === labelFileName)) {
                    asset.state = AssetState.Tagged;
                    const json = await this.readText(labelFileName);
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
        else{
            return null;
        }
    }
    /**
     * Gets a list of file system items matching the specified predicate within the folderPath
     * @param  {string} folderPath
     * @param  {(stats:fs.Stats)=>boolean} predicate
     * @returns {Promise} Resolved list of matching file system items
     */
    private listItems(folderPath: string, predicate: (stats: fs.Stats) => boolean) {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(path.normalize(folderPath), async (err: NodeJS.ErrnoException, fileSystemItems: string[]) => {
                if (err) {
                    return reject(err);
                }

                const getStatsTasks = fileSystemItems.map((name) => {
                    const filePath = path.join(folderPath, name);
                    return this.getStats(filePath);
                });

                try {
                    const statsResults = await Promise.all(getStatsTasks);
                    const filteredItems = statsResults
                        .filter((result) => predicate(result.stats))
                        .map((result) => result.path);

                    resolve(filteredItems);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets the node file system stats for the specified path
     * @param  {string} path
     * @returns {Promise} Resolved path and stats
     */
    private getStats(path: string): Promise<{ path: string, stats: fs.Stats }> {
        return new Promise((resolve, reject) => {
            fs.stat(path, (err, stats: fs.Stats) => {
                if (err) {
                    reject(err);
                }

                resolve({
                    path,
                    stats,
                });
            });
        });
    }

    private isSupportedAssetType(assetType: AssetType) {
        return assetType === AssetType.Image || assetType === AssetType.TIFF || assetType === AssetType.PDF;
    }
}
