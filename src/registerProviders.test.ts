// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import registerProviders from "./registerProviders";
import { StorageProviderFactory } from "./providers/storage/storageProviderFactory";
import { AssetProviderFactory } from "./providers/storage/assetProviderFactory";

jest.mock("./common/hostProcess");
import getHostProcess, { HostProcessType } from "./common/hostProcess";

describe("Register Providers", () => {
    describe("Browser Registration", () => {
        it("Doesn't Register localFileSystemProxy", () => {
            const getHostProcessMock = getHostProcess as jest.Mock;
            getHostProcessMock.mockImplementation(() => {
                return {
                    type: HostProcessType.Browser,
                    release: "browser",
                };
            });

            registerProviders();

            expect(StorageProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
            expect(AssetProviderFactory.providers["localFileSystemProxy"]).toBeUndefined();
        });
    });
});
