import _ from "lodash";
import { TFRecordsExportProvider } from "./tensorFlowRecords";
import { ExportAssetState } from "./exportProvider";
import registerProviders from "../../registerProviders";
import { ExportProviderFactory } from "./exportProviderFactory";
import {
    IAssetMetadata, AssetState, IRegion,
    RegionType, IPoint, IExportProviderOptions,
} from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

jest.mock("../../services/assetService");
import { AssetService } from "../../services/assetService";

jest.mock("../storage/localFileSystemProxy");
import { LocalFileSystemProxy } from "../storage/localFileSystemProxy";
import registerMixins from "../../registerMixins";
import { appInfo } from "../../common/appInfo";
import { AssetProviderFactory } from "../storage/assetProviderFactory";
import HtmlFileReader from "../../common/htmlFileReader";

registerMixins();

describe("TFRecords Json Export Provider", () => {
    const testAssets = MockFactory.createTestAssets(10, 1);
    const baseTestProject = MockFactory.createTestProject("Test Project");
    baseTestProject.assets = {
        "asset-1": MockFactory.createTestAsset("1", AssetState.Tagged),
        "asset-2": MockFactory.createTestAsset("2", AssetState.Tagged),
        "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
        "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
    };
    baseTestProject.sourceConnection = MockFactory.createTestConnection("test", "localFileSystemProxy");
    baseTestProject.targetConnection = MockFactory.createTestConnection("test", "localFileSystemProxy");

    const tagLengthInPbtxt = 31;

    HtmlFileReader.getAssetArray = jest.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]).buffer));

    beforeAll(() => {
        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });
    });

    beforeEach(() => {
        registerProviders();
    });

    it("Is defined", () => {
        expect(TFRecordsExportProvider).toBeDefined();
    });

    it("Can be instantiated through the factory", () => {
        const options: IExportProviderOptions = {
            assetState: ExportAssetState.All,
        };
        const exportProvider = ExportProviderFactory.create("tensorFlowRecords", baseTestProject, options);
        expect(exportProvider).not.toBeNull();
        expect(exportProvider).toBeInstanceOf(TFRecordsExportProvider);
    });

    describe("Export variations", () => {
        beforeEach(() => {
            const assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
            assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
                const mockTag = MockFactory.createTestTag();

                const mockStartPoint: IPoint = {
                    x: 1,
                    y: 2,
                };

                const mockEndPoint: IPoint = {
                    x: 3,
                    y: 4,
                };

                const mockRegion: IRegion = {
                    id: "id",
                    type: RegionType.Rectangle,
                    tags: [mockTag.name],
                    points: [mockStartPoint, mockEndPoint],
                    pageNumber: 1,
                };

                const assetMetadata: IAssetMetadata = {
                    asset,
                    regions: [mockRegion],
                    version: appInfo.version,
                    labelData: null,
                };

                return Promise.resolve(assetMetadata);
            });

            const storageProviderMock = LocalFileSystemProxy as jest.Mock<LocalFileSystemProxy>;
            storageProviderMock.mockClear();
        });

        it("Exports all assets", async () => {
            const options: IExportProviderOptions = {
                assetState: ExportAssetState.All,
            };

            const testProject = { ...baseTestProject };
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new TFRecordsExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;
            expect(createContainerCalls.length).toEqual(1);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(testAssets.length);
            expect(writeBinaryCalls[0][0].endsWith("Asset 1.tfrecord")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("Asset 2.tfrecord")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("Asset 3.tfrecord")).toEqual(true);
            expect(writeBinaryCalls[3][0].endsWith("Asset 4.tfrecord")).toEqual(true);

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeTextFileCalls.length).toEqual(1);
            expect(writeTextFileCalls[0][0].endsWith("tf_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));
        });

        it("Exports only visited assets (includes tagged)", async () => {
            const options: IExportProviderOptions = {
                assetState: ExportAssetState.Visited,
            };

            const testProject = { ...baseTestProject };
            testProject.tags = MockFactory.createTestTags(1);

            const exportProvider = new TFRecordsExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;
            expect(createContainerCalls.length).toEqual(1);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(3);
            expect(writeBinaryCalls[0][0].endsWith("Asset 1.tfrecord")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("Asset 2.tfrecord")).toEqual(true);
            expect(writeBinaryCalls[2][0].endsWith("Asset 3.tfrecord")).toEqual(true);

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeTextFileCalls.length).toEqual(1);
            expect(writeTextFileCalls[0][0].endsWith("tf_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));
        });

        it("Exports only tagged assets", async () => {
            const options: IExportProviderOptions = {
                assetState: ExportAssetState.Tagged,
            };

            const testProject = { ...baseTestProject };
            testProject.tags = MockFactory.createTestTags(3);

            const exportProvider = new TFRecordsExportProvider(testProject, options);
            await exportProvider.export();

            const storageProviderMock = LocalFileSystemProxy as any;
            const createContainerCalls = storageProviderMock.mock.instances[0].createContainer.mock.calls;
            expect(createContainerCalls.length).toEqual(1);

            const writeBinaryCalls = storageProviderMock.mock.instances[0].writeBinary.mock.calls;
            expect(writeBinaryCalls.length).toEqual(2);
            expect(writeBinaryCalls[0][0].endsWith("Asset 1.tfrecord")).toEqual(true);
            expect(writeBinaryCalls[1][0].endsWith("Asset 2.tfrecord")).toEqual(true);

            const writeTextFileCalls = storageProviderMock.mock.instances[0].writeText.mock.calls;
            expect(writeTextFileCalls.length).toEqual(1);
            expect(writeTextFileCalls[0][0].endsWith("tf_label_map.pbtxt")).toEqual(true);
            expect(writeTextFileCalls[0][1].length)
                .toEqual((tagLengthInPbtxt * testProject.tags.length));
        });
    });
});
