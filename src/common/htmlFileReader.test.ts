// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios, { AxiosResponse } from "axios";
import HtmlFileReader from "./htmlFileReader";
import { AssetService } from "../services/assetService";
import MockFactory from "./mockFactory";
import { AssetState, IAsset } from "../models/applicationState";

describe("Html File Reader", () => {
    const assetTestCache = new Map<string, IAsset>();

    beforeEach(() => {
        assetTestCache.clear();
        MockFactory.mockElement(assetTestCache);
    });

    it("Resolves promise after successfully reading file", async () => {
        const expectedText = "test file contents";
        const blob = new Blob([expectedText], { type: "text/plain" });
        const file = new File([blob], "test.txt");

        const actualText = await HtmlFileReader.readAsText(file);
        expect(actualText.content).toEqual(expectedText);
    });

    it("Throws error with null file value", () => {
        expect(() => HtmlFileReader.readAsText(null)).toThrowError();
    });

    it("Loads attributes for an image asset", async () => {
        const imageAsset = await AssetService.createAssetFromFilePath("https://server.com/image.jpg");
        imageAsset.size = {
            width: 1920,
            height: 1080,
        };
        assetTestCache.set(imageAsset.path, imageAsset);

        const result = await HtmlFileReader.readAssetAttributes(imageAsset);

        expect(result.width).toEqual(imageAsset.size.width);
        expect(result.height).toEqual(imageAsset.size.height);
    });

    describe("Download asset binaries", () => {
        it("Downloads a blob from the asset path", async () => {
            const asset = await AssetService.createAssetFromFilePath("https://server.com/image.jpg");
            axios.get = jest.fn((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 200,
                    statusText: "OK",
                    data: new Blob(["Some binary data"]),
                });
            });

            const result = await HtmlFileReader.getAssetBlob(asset);
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(Blob);
            expect(axios.get).toBeCalledWith(asset.path, { responseType: "blob" });
        });

        it("Rejects the promise when request receives non 200 result", async () => {
            const asset = await AssetService.createAssetFromFilePath("https://server.com/image.jpg");
            axios.get = jest.fn((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 404,
                    statusText: "Not Found",
                    data: null,
                });
            });

            await expect(HtmlFileReader.getAssetBlob(asset)).rejects.not.toBeNull();
            expect(axios.get).toBeCalledWith(asset.path, { responseType: "blob" });
        });
    });

    describe("Download asset binaries array", () => {
        beforeEach(() => {
            axios.get = jest.fn((url, config) => {
                return Promise.resolve<AxiosResponse>({
                    config,
                    headers: null,
                    status: 200,
                    statusText: "OK",
                    data: [1, 2, 3],
                });
            });
        });

        it("Downloads a byte array from the asset path", async () => {
            const asset = await AssetService.createAssetFromFilePath("https://server.com/image.jpg");
            const result = await HtmlFileReader.getAssetArray(asset);
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(ArrayBuffer);
            expect(axios.get).toBeCalledWith(asset.path, { responseType: "blob" });
        });

        it("Test non valid asset type", async () => {
            const imageAsset = await AssetService.createAssetFromFilePath("https://server.com/image.notsupported");
            try {
                const result = await HtmlFileReader.readAssetAttributes(imageAsset);
            } catch (error) {
                expect(error).toEqual(new Error("Asset not supported"));
            }
        });
    });
});
