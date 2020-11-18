// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    AssetState, AssetType, IApplicationState, IAppSettings, IAsset, IAssetMetadata,
    IConnection, IProject, ITag, StorageType, ISecurityToken,
    IAppError, ErrorCode,
    IRegion, RegionType, FieldType, FieldFormat, FeatureCategory,
} from "../models/applicationState";
import { IAssetProvider, IAssetProviderRegistrationOptions } from "../providers/storage/assetProviderFactory";
import { IAzureCloudStorageOptions } from "../providers/storage/azureBlobStorage";
import { IStorageProvider, IStorageProviderRegistrationOptions } from "../providers/storage/storageProviderFactory";
import { IProjectSettingsPageProps } from "../react/components/pages/projectSettings/projectSettingsPage";
import { IEditorPageProps } from "../react/components/pages/editorPage/editorPage";
import IProjectActions, * as projectActions from "../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../redux/actions/appTitleActions";
import { generateKey } from "./crypto";
import { randomIntInRange, encodeFileURI } from "./utils";
import { appInfo } from "./appInfo";
import { IKeyboardBindingProps } from "../react/components/common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../react/components/common/keyboardManager/keyboardManager";
import { IKeyboardRegistrations } from "../react/components/common/keyboardManager/keyboardRegistrationManager";

export default class MockFactory {
    /**
     * Creates sample IAppError
     * @param errorCode The error code to map to the error
     * @param title The title of the error
     * @param message The detailed error message
     * @returns {IAppError}
     */
    public static createAppError(
        errorCode: ErrorCode = ErrorCode.Unknown,
        title: string = "",
        message: string = ""): IAppError {
        return {
            errorCode,
            title,
            message,
        };
    }

    /**
     * Creates fake IAsset
     * @param name Name of asset
     * @param assetState State of asset
     * @param path Path of asset
     * @param assetType Type of asset
     */
    public static createTestAsset(
        name: string = "test",
        assetState: AssetState = AssetState.NotVisited,
        path: string = encodeFileURI(`https://image.com/asset${name}.jpg`),
        assetType: AssetType = AssetType.Image,
        timestamp: number = 0): IAsset {
        let testAsset = null;
        switch (assetType) {
            case AssetType.Image:
                testAsset = {
                    id: `asset-${name}`,
                    format: "jpg",
                    name: `Asset ${name}.jpg`,
                    path: `${path}`,
                    state: assetState,
                    type: assetType,
                    size: {
                        width: 800,
                        height: 600,
                    },
                };
                break;
            default:
                testAsset = {
                    id: `asset-${name}`,
                    format: "?",
                    name: `Asset ${name}.asset`,
                    path: `${path}`,
                    state: assetState,
                    type: assetType,
                    size: {
                        width: 800,
                        height: 600,
                    },
                };
        }

        return testAsset;
    }

    /**
     * Creates array of fake IAsset
     * @param count Number of assets to create (default: 10)
     * @param startIndex The index that the assets should start at (default: 1)
     */
    public static createTestAssets(count: number = 10, startIndex: number = 1): IAsset[] {
        const assets: IAsset[] = [];
        for (let i = startIndex; i < (count + startIndex); i++) {
            assets.push(MockFactory.createTestAsset(i.toString()));
        }

        return assets;
    }

    /**
     * Creates fake IAssetMetadata
     * @param asset Test asset
     */
    public static createTestAssetMetadata(asset?: IAsset, regions?: IRegion[]): IAssetMetadata {
        return {
            asset: asset || MockFactory.createTestAsset(),
            regions: regions || [],
            version: appInfo.version,
            labelData: null,
        };
    }

    /**
     * Creates array of fake IProject
     * @param count Number of projects
     */
    public static createTestProjects(count: number = 10): IProject[] {
        const projects: IProject[] = [];
        for (let i = 1; i <= count; i++) {
            projects.push(MockFactory.createTestProject(i.toString()));
        }

        return projects;
    }

    /**
     * Creates fake IProject
     * @param name Name of project. project.id = `project-${name}` and project.name = `Project ${name}`
     * @param tagCount number of tags to create for project
     */
    public static createTestProject(name: string = "test", tagCount: number = 5): IProject {
        const connection = MockFactory.createTestConnection(name);

        return {
            id: `project-${name}`,
            name: `Project ${name}`,
            version: appInfo.version,
            securityToken: `Security-Token-${name}`,
            assets: {},
            sourceConnection: connection,
            tags: MockFactory.createTestTags(tagCount),
            apiUriBase: "localhost",
            folderPath: "",
            trainRecord: null,
            recentModelRecords: [],
            predictModelId: "",
        };
    }

    /**
     * Creates fake Azure containers
     * @param count Number of containers
     */
    public static createAzureContainers(count: number = 3) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push({
                name: `container${i}`,
                blobs: MockFactory.createAzureBlobs(i),
            });
        }
        return { containerItems: result };
    }

    /**
     * Creates fake IAzureCloudStorageOptions
     */
    public static createAzureOptions(): IAzureCloudStorageOptions {
        return { sas: "sas" };
    }

    /**
     * Creates fake data for testing Azure Cloud Storage
     */
    public static createAzureData() {
        const options = MockFactory.createAzureOptions();
        return {
            blobName: "file1.jpg",
            blobText: "This is the content",
            fileType: "image/jpg",
            containers: MockFactory.createAzureContainers(),
            blobs: MockFactory.createAzureBlobs(),
            options,
        };
    }

    /**
     * Creates fake Blob object
     * @param name Name of blob
     * @param content Content of blob
     * @param fileType File type of blob
     */
    public static blob(name: string, content: string | Buffer, fileType: string): Blob {
        const blob = new Blob([content], { type: fileType });
        blob["name"] = name;
        return blob;
    }

    /**
     * Creates fake Azure Blobs
     * @param id ID of blob
     * @param count Number of blobs
     */
    public static createAzureBlobs(id: number = 1, count: number = 10) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push({
                name: `blob-${id}-${i}.jpg`,
            });
        }
        return { segment: { blobItems: result } };
    }

    /**
     * Create array of fake ITag
     * @param count Number of tags
     */
    public static createTestTags(count: number = 5): ITag[] {
        const tags: ITag[] = [];
        for (let i = 0; i < count; i++) {
            tags.push(MockFactory.createTestTag(i.toString()));
        }
        return tags;
    }

    /**
     * Create fake ITag with random color
     * @param name Name of tag
     */
    public static createTestTag(name: string = "1"): ITag {
        return {
            name: `Tag ${name}`,
            color: MockFactory.randomColor(),
            type: FieldType.String,
            format: FieldFormat.NotSpecified,
        };
    }

    /**
     * Create array of IConnection, half Azure Blob connections, half Local File Storage connections
     * @param count Number of connections
     */
    public static createTestConnections(count: number = 10): IConnection[] {
        const connections: IConnection[] = [];
        for (let i = 1; i <= count; i++) {
            connections.push(MockFactory.createTestCloudConnection(i.toString()));
        }
        return connections;
    }

    /**
     *
     * @param name Name of connection
     */
    public static createTestCloudConnection(name: string = "test"): IConnection {
        return MockFactory.createTestConnection(name, "azureBlobStorage");
    }

    /**
     * Create fake IConnection
     * @param name Name of connection - default test
     * @param providerType Type of Connection - default local file system
     */
    public static createTestConnection(
        name: string = "test", providerType: string = "azureBlobStorage"): IConnection {
        return {
            id: `connection-${name}`,
            name: `Connection ${name}`,
            description: `Description for Connection ${name}`,
            providerType,
            providerOptions: MockFactory.getProviderOptions(providerType),
        };
    }

    /**
     * Get options for asset provider
     * @param providerType asset provider type
     */
    public static getProviderOptions(providerType) {
        switch (providerType) {
            case "azureBlobStorage":
                return MockFactory.createAzureOptions();
            default:
                return {};
        }
    }

    /**
     * Create array of filename strings
     */
    public static createFileList(): string[] {
        return ["file1.jpg", "file2.jpg", "file3.jpg"];
    }

    /**
     * Create fake Storage Provider of storage type Cloud
     * All functions are jest.fn to test for being called
     * readText resolves to "Fake text"
     * listFiles resolves with list of fake files
     */
    public static createStorageProvider(): IStorageProvider {
        return {
            storageType: StorageType.Cloud,

            initialize: jest.fn(() => Promise.resolve()),
            readText: jest.fn(() => Promise.resolve("Fake text")),
            readBinary: jest.fn(),
            deleteFile: jest.fn(),
            writeText: jest.fn(),
            isValidProjectConnection: jest.fn(),
            writeBinary: jest.fn(),
            listFiles: jest.fn(() => Promise.resolve(MockFactory.createFileList())),
            listContainers: jest.fn(),
            createContainer: jest.fn(),
            deleteContainer: jest.fn(),
            getAssets: jest.fn(),
            getAsset: jest.fn(),
            isFileExists: jest.fn(),
        };
    }

    /**
     * Creates a storage provider from IConnection
     * @param connection Connection with which to create Storage Provider
     */
    public static createStorageProviderFromConnection(connection: IConnection): IStorageProvider {
        return {
            ...MockFactory.createStorageProvider(),
            storageType: MockFactory.getStorageType(connection.providerType),
        };
    }

    /**
     * Create fake asset provider
     */
    public static createAssetProvider(): IAssetProvider {
        return {
            initialize: jest.fn(() => Promise.resolve()),
            getAssets(folderPath?: string, folderName?: string): Promise<IAsset[]> {
                throw new Error("Method not implemented.");
            },
            getAsset(folderPath: string, assetName: string): Promise<IAsset> {
                throw new Error("Method not implemented.");
            }
        };
    }

    /**
     * Create array of IStorageProviderRegistrationOptions
     * @param count Number of storage provider registrations to create
     */
    public static createStorageProviderRegistrations(count: number = 10): IStorageProviderRegistrationOptions[] {
        const registrations: IStorageProviderRegistrationOptions[] = [];
        for (let i = 1; i <= count; i++) {
            registrations.push(MockFactory.createStorageProviderRegistration(i.toString()));
        }

        return registrations;
    }

    /**
     * Create array of IAssetProviderRegistrationOptions
     * @param count Number of Asset Provider Registrations to create
     */
    public static createAssetProviderRegistrations(count: number = 10): IAssetProviderRegistrationOptions[] {
        const registrations: IAssetProviderRegistrationOptions[] = [];
        for (let i = 1; i <= count; i++) {
            registrations.push(MockFactory.createAssetProviderRegistration(i.toString()));
        }

        return registrations;
    }

    /**
     * Creates fake IStorageProviderRegistrationOptions
     * @param name Name of Storage Provider
     */
    public static createStorageProviderRegistration(name: string) {
        const registration: IStorageProviderRegistrationOptions = {
            name,
            displayName: `${name} display name`,
            description: `${name} short description`,
            factory: () => null,
        };

        return registration;
    }

    /**
     * Creates fake IAssetProviderRegistrationOptions
     * @param name Name of asset provider
     */
    public static createAssetProviderRegistration(name: string) {
        const registration: IAssetProviderRegistrationOptions = {
            name,
            displayName: `${name} display name`,
            description: `${name} short description`,
            factory: () => null,
        };

        return registration;
    }

    /**
     * Creates an array of test regions
     * @param count The number of regions to create (default: 5)
     */
    public static createTestRegions(count: number = 5) {
        const regions: IRegion[] = [];
        for (let i = 1; i <= count; i++) {
            regions.push(MockFactory.createTestRegion(`test${i}`));
        }
        return regions;
    }

    /**
     * Creates a test region with the optional specified id
     * @param id The id to assign to the region
     * @param tags the tags used in this region
     */
    public static createTestRegion(id = null, tags: string[] = []): IRegion {
        const origin = {
            x: randomIntInRange(0, 1024),
            y: randomIntInRange(0, 768),
        };
        const size = {
            width: randomIntInRange(1, 100),
            height: randomIntInRange(1, 100),
        };

        return {
            id,
            boundingBox: {
                left: origin.x,
                top: origin.y,
                width: size.width,
                height: size.height,
            },
            points: [
                { x: origin.x, y: origin.y }, // Top left
                { x: origin.x + size.width, y: origin.y }, // Top Right
                { x: origin.x, y: origin.y + size.height }, // Bottom Left
                { x: origin.x + size.width, y: origin.y + size.height }, // Bottom Right
            ],
            tags,
            type: RegionType.Rectangle,
            pageNumber: 1,
            category: FeatureCategory.Text,
        };
    }

    /**
     * Creates fake IAppSettings
     */
    public static appSettings(): IAppSettings {
        const securityTokens = MockFactory.createSecurityTokens();

        return {
            securityTokens: [
                ...securityTokens,
                MockFactory.createSecurityToken("TestProject"),
                MockFactory.createSecurityToken("test"),
            ],
        };
    }

    /**
     * Creates fake IProjectActions with jest functions for each action
     */
    public static projectActions(): IProjectActions {
        return {
            updateProjectTagsFromFiles: jest.fn(() => Promise.resolve()),
            updatedAssetMetadata: jest.fn(() => Promise.resolve()),
            loadProject: jest.fn(() => Promise.resolve()),
            saveProject: jest.fn(() => Promise.resolve()),
            deleteProject: jest.fn(() => Promise.resolve()),
            closeProject: jest.fn(() => Promise.resolve()),
            addAssetToProject: jest.fn(() => Promise.resolve()),
            deleteAsset: jest.fn(() => Promise.resolve()),
            loadAssets: jest.fn(() => Promise.resolve()),
            loadAssetMetadata: jest.fn(() => Promise.resolve()),
            refreshAsset: jest.fn(() => Promise.resolve()),
            saveAssetMetadata: jest.fn(() => Promise.resolve()),
            saveAssetMetadataAndCleanEmptyLabel: jest.fn(()=> Promise.resolve()),
            updateProjectTag: jest.fn(() => Promise.resolve()),
            deleteProjectTag: jest.fn(() => Promise.resolve()),
            reconfigureTableTag: jest.fn(() => Promise.resolve()),
        };
    }

    /**
     * Creates a security token used for testing
     * @param nameSuffix The name suffix to apply to the security token name
     */
    public static createSecurityToken(nameSuffix: string): ISecurityToken {
        return {
            name: `Security-Token-${nameSuffix}`,
            key: generateKey(),
        };
    }

    /**
     * Creates test security tokens
     * @param count The number of tokens to generate (default: 10)
     */
    public static createSecurityTokens(count: number = 10): ISecurityToken[] {
        const securityTokens: ISecurityToken[] = [];
        for (let i = 1; i <= 10; i++) {
            securityTokens.push(MockFactory.createSecurityToken(i.toString()));
        }

        return securityTokens;
    }

    /**
     * Creates fake IProjectSettingsPageProps
     * @param projectId Current project ID
     */
    public static projectSettingsProps(projectId?: string): IProjectSettingsPageProps {
        return {
            ...MockFactory.pageProps(projectId, "settings"),
            connections: MockFactory.createTestConnections(),
            appSettings: MockFactory.appSettings(),
            appTitleActions: (appTitleActions as any) as IAppTitleActions,
        };
    }

    /**
     * Creates fake IEditorPageProps
     * @param projectId Current project ID
     */
    public static editorPageProps(projectId?: string): IEditorPageProps {
        return {
            actions: (projectActions as any) as IProjectActions,
            applicationActions: (applicationActions as any) as IApplicationActions,
            appTitleActions: (appTitleActions as any) as IAppTitleActions,
            ...MockFactory.pageProps(projectId, "edit"),
        };
    }

    /**
     * Creates fake IApplicationState
     */
    public static initialState(state?: any): IApplicationState {
        const testProjects = MockFactory.createTestProjects();
        const testConnections = MockFactory.createTestConnections();

        return {
            appSettings: MockFactory.appSettings(),
            connections: testConnections,
            recentProjects: testProjects,
            currentProject: testProjects[0],
            ...state,
            appError: null,
        };
    }

    /**
     * Runs function that updates the UI, and flushes call stack
     * @param func - The function that updates the UI
     */
    public static flushUi(func: () => void = null): Promise<void> {
        return new Promise<void>((resolve) => {
            if (func) {
                func();
            }
            setImmediate(resolve);
        });
    }

    /**
     * Runs and waits for a condition to be met and resolves a promise
     * @param predicate The predicate to evaluate the condition
     * @param interval The interval to check the value
     */
    public static waitForCondition(predicate: () => boolean, interval: number = 100): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const handle = setInterval(() => {
                try {
                    if (predicate()) {
                        clearInterval(handle);
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            }, interval);
        });
    }

    public static createKeyboardRegistrations(count = 5, handlers?): IKeyboardRegistrations {
        const keyDownRegs = {};
        if (!handlers) {
            handlers = [];
            for (let i = 0; i < count; i++) {
                handlers.push(jest.fn(() => i));
            }
        }
        for (let i = 0; i < count; i++) {
            const upper = String.fromCharCode(65 + i);
            const lower = String.fromCharCode(97 + i);
            const binding: IKeyboardBindingProps = {
                displayName: `Binding ${i + 1}`,
                accelerators: [upper, lower],
                handler: handlers[i],
                icon: `test-icon-${i + 1}`,
                keyEventType: KeyEventType.KeyDown,
            };
            keyDownRegs[upper] = binding;
            keyDownRegs[lower] = binding;
        }
        return {
            keydown: keyDownRegs,
        };
    }

    public static mockElement(assetTestCache: Map<string, IAsset>) {
        document.createElement = jest.fn((elementType) => {
            switch (elementType) {
                case "img":
                    const mockImage = MockFactory.mockImage(assetTestCache);
                    return mockImage();
                case "canvas":
                    const mockCanvas = MockFactory.mockCanvas();
                    return mockCanvas();
            }
        });
    }

    public static mockImage(assetTestCache: Map<string, IAsset>) {
        return jest.fn(() => {
            const element: any = {
                naturalWidth: 0,
                naturalHeight: 0,
                onload: jest.fn(),
            };

            setImmediate(() => {
                const asset = assetTestCache.get(element.src);
                if (asset) {
                    element.naturalWidth = asset.size.width;
                    element.naturalHeight = asset.size.height;
                }

                element.onload();
            });

            return element;
        });
    }

    public static mockCanvas() {
        return jest.fn(() => {
            const canvas: any = {
                width: 800,
                height: 600,
                getContext: jest.fn(() => {
                    return {
                        drawImage: jest.fn(),
                    };
                }),
                toBlob: jest.fn((callback) => {
                    callback(new Blob(["Binary image data"]));
                }),
            };

            return canvas;
        });
    }

    private static pageProps(projectId: string, method: string) {
        return {
            project: null,
            appSettings: MockFactory.appSettings(),
            recentProjects: MockFactory.createTestProjects(),
            projectActions: (projectActions as any) as IProjectActions,
            applicationActions: (applicationActions as any) as IApplicationActions,
            history: MockFactory.history(),
            location: MockFactory.location(),
            match: MockFactory.match(projectId, method),
        };
    }

    /**
     * Creates fake match for page properties
     * @param projectId Current project id
     * @param method URL method for project (export, edit, settings)
     */
    private static match(projectId: string, method: string) {
        return {
            params: {
                projectId,
            },
            isExact: true,
            path: `https://localhost:3000/projects/${projectId}/${method}`,
            url: `https://localhost:3000/projects/${projectId}/${method}`,
        };
    }

    /**
     * Creates fake history for page properties
     */
    private static history() {
        return {
            length: 0,
            action: null,
            location: null,
            push: jest.fn(),
            replace: jest.fn(),
            go: jest.fn(),
            goBack: jest.fn(),
            goForward: jest.fn(),
            block: jest.fn(),
            listen: jest.fn(),
            createHref: jest.fn(),
        };
    }

    /**
     * Creates fake location for page properties
     */
    private static location() {
        return {
            hash: null,
            pathname: null,
            search: null,
            state: null,
        };
    }

    /**
     * Generates a random color string
     */
    private static randomColor(): string {
        return "#" + (Math.random() * 0xFFFFFF << 0).toString(16);
    }

    /**
     * Gets StorageType for asset providers
     * @param providerType Asset Provider type
     */
    private static getStorageType(providerType: string): StorageType {
        switch (providerType) {
            case "azureBlobStorage":
                return StorageType.Cloud;
            case "localFileSystemProxy":
                return StorageType.Local;
            default:
                return StorageType.Other;
        }
    }
}
