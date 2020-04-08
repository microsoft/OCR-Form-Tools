// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios, { AxiosRequestConfig } from "axios";
import { IAsset, AssetType, IFileInfo } from "../models/applicationState";
import Guard from "./guard";
import * as EXIF from "exif-js";
import { isNumber } from "util";

/**
 * Helper class for reading HTML files
 */
export default class HtmlFileReader {

    public static videoAssetFiles = {};

    /**
     * Reads the file and returns the string value contained
     * @param file HTML file to read
     */
    public static readAsText(file: File): Promise<IFileInfo> {
        Guard.null(file);
        let fileInfo: IFileInfo;

        return new Promise<IFileInfo>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                if (reader.result) {
                    fileInfo = {
                        content: reader.result,
                        file,
                    };
                    resolve(fileInfo);
                } else {
                    reject();
                }
            };

            try {
                reader.readAsText(file);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Reads attributes from asset depending on type (video or image)
     * @param asset Asset to read from
     */
    public static async readAssetAttributes(asset: IAsset)
        : Promise<{ width: number, height: number, duration?: number }> {
        Guard.null(asset);

        switch (asset.type) {
            case AssetType.Image:
                return await this.readImageAttributes(asset.path);
            default:
                throw new Error("Asset not supported");
        }
    }

    public static async readAssetAttributesWithBuffer(base64: string)
        : Promise<{ width: number, height: number, duration?: number }> {
        Guard.null(base64);

        return await this.readImageAttributes("data:image;base64," + base64);
    }

    /**
     * Downloads the binary blob from the asset path
     * @param asset The asset to download
     */
    public static async getAssetBlob(asset: IAsset): Promise<Blob> {
        Guard.null(asset);

        const config: AxiosRequestConfig = {
            responseType: "blob",
        };

        // Download the asset binary from the storage provider
        const response = await axios.get<Blob>(asset.path, config);
        if (response.status !== 200) {
            throw new Error("Error downloading asset binary");
        }
        const data = await response.data;

        return data;
    }

    /**
     * Downloads the binary array from the asset path
     * @param asset The asset to download
     */
    public static async getAssetArray(asset: IAsset): Promise<ArrayBuffer> {
        const blob = await this.getAssetBlob(asset);
        return await new Response(blob).arrayBuffer();
    }

    public static readImageAttributes(url: string): Promise<{ width: number, height: number }> {
        return new Promise((resolve, reject) => {
            const image = document.createElement("img") as HTMLImageElement;
            image.onload = () => {
                resolve({
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                });
            };
            image.onerror = reject;
            image.src = url;
        });
    }

    public static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const fileReader: FileReader = new FileReader();

            try {
                fileReader.onload = () => {
                    resolve(fileReader.result as ArrayBuffer);
                };
                fileReader.readAsArrayBuffer(file);
            } catch (err) {
                reject(err);
            }
        });
    }

    public static async readImageOrientation(image: HTMLImageElement): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                EXIF.getData(image as any, () => {
                    const orientationTag = EXIF.getTag(image, "Orientation");
                    resolve(isNumber(orientationTag) ? orientationTag : 1);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}
