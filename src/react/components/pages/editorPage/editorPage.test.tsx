// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { mount, ReactWrapper } from "enzyme";
import _ from "lodash";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { AnyAction, Store } from "redux";
import EditorPage, { IEditorPageProps, IEditorPageState } from "./editorPage";
import MockFactory from "../../../../common/mockFactory";
import {
    IApplicationState, IAssetMetadata, IProject,
    IAsset, AssetState, ISize,
} from "../../../../models/applicationState";
import { AssetProviderFactory } from "../../../../providers/storage/assetProviderFactory";
import createReduxStore from "../../../../redux/store/store";
import { AssetService } from "../../../../services/assetService";
import registerToolbar, { ToolbarItemName } from "../../../../registerToolbar";
import { KeyboardManager, KeyEventType } from "../../common/keyboardManager/keyboardManager";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

import Canvas from "./canvas";
import { appInfo } from "../../../../common/appInfo";
import SplitPane from "react-split-pane";
import EditorSideBar from "./editorSideBar";
import Alert from "../../common/alert/alert";
import registerMixins from "../../../../registerMixins";
import { TagInput } from "../../common/tagInput/tagInput";
import { EditorToolbar } from "./editorToolbar";
import { ToolbarItem } from "../../toolbar/toolbarItem";

function createComponent(store, props: IEditorPageProps): ReactWrapper<IEditorPageProps, IEditorPageState, EditorPage> {
    return mount(
        <Provider store={store}>
            <KeyboardManager>
                <Router>
                    <EditorPage {...props} />
                </Router>
            </KeyboardManager>
        </Provider>,
    );
}

function getState(wrapper): IEditorPageState {
    return wrapper.find(EditorPage).childAt(0).state() as IEditorPageState;
}

function dispatchKeyEvent(key: string, eventType: KeyEventType = KeyEventType.KeyDown) {
    window.dispatchEvent(new KeyboardEvent(
        eventType, {
            key,
        },
    ));
}

describe("Editor Page Component", () => {
    let assetServiceMock: jest.Mocked<typeof AssetService> = null;
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    const electronMock = {
        remote: {
            app: {
                getAppPath: jest.fn(() => ""),
            },
        },
    };

    const testAssets: IAsset[] = MockFactory.createTestAssets(5);

    beforeAll(() => {
        registerToolbar();
    });

    beforeEach(() => {
        assetServiceMock = AssetService as jest.Mocked<typeof AssetService>;
        assetServiceMock.prototype.getAssetMetadata = jest.fn((asset) => {
            const assetMetadata: IAssetMetadata = {
                asset: { ...asset },
                regions: [],
                version: appInfo.version,
                labelData: null,
            };

            return Promise.resolve(assetMetadata);
        });
        assetServiceMock.prototype.save = jest.fn((assetMetadata) => {
            return Promise.resolve({ ...assetMetadata });
        });

        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve({ ...project }));
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve({ ...project }));

        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });
    });

    it("Sets project state from redux store", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        expect(loadProjectSpy).not.toBeCalled();
        expect(editorPage.prop("project")).toEqual(testProject);
        expect(editorPage.state().isValid).toBe(true);
    });

    it("Updates state from props changes if project is null at creation", async () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, false);
        const props = MockFactory.editorPageProps(testProject.id);

        // Simulate navigation directly via a null project
        props.project = null;

        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0);

        editorPage.props().project = testProject;
        await MockFactory.flushUi();
        expect(editorPage.props().project).toEqual(testProject);
    });

    it("Loads and merges project assets with asset provider assets when state changes", async () => {
        const projectAssets = MockFactory.createTestAssets(10, 10);
        const testProject = MockFactory.createTestProject("TestProject");
        testProject.assets = _.keyBy(projectAssets, (asset) => asset.id);

        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        await MockFactory.flushUi();

        const expectedAsset = editorPage.state().assets[0];

        expect(editorPage.props().project).toEqual(expect.objectContaining(partialProject));
        expect(editorPage.state().assets.length).toEqual(projectAssets.length + testAssets.length);
        expect(editorPage.state().selectedAsset).toMatchObject({
            asset: {
                ...expectedAsset,
                state: AssetState.Visited,
            },
        });
    });

    it("Default asset is loaded and saved during initial page rendering", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const loadAssetMetadataSpy = jest.spyOn(props.actions, "loadAssetMetadata");
        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();
        wrapper.update();

        const expectedAsset = editorPage.state().assets[0];
        const partialProject = {
            id: testProject.id,
            name: testProject.name,
        };

        expect(loadAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), defaultAsset);
        expect(saveAssetMetadataSpy).toBeCalledWith(
            expect.objectContaining(partialProject),
            expect.objectContaining({
                asset: {
                    ...expectedAsset,
                    state: AssetState.Visited,
                },
            }),
        );
        expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
    });

    it("sets page state to invalid when edited asset includes un-tagged regions", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();
        wrapper.update();

        // Create a new un-tagged region
        const newRegion = MockFactory.createTestRegion("unTaggedRegion", []);
        const assetMetadata: IAssetMetadata = {
            asset: defaultAsset,
            regions: [newRegion],
            version: appInfo.version,
            labelData: null,
        };

        saveAssetMetadataSpy.mockClear();
        saveProjectSpy.mockClear();

        // Initial state change of region
        wrapper.find(Canvas).props().onAssetMetadataChanged(assetMetadata);

        expect(editorPage.state().isValid).toBe(false);
        expect(saveAssetMetadataSpy).not.toBeCalled();
        expect(saveProjectSpy).not.toBeCalled();

        // Apply tag to region
        newRegion.tags = ["test"];
        wrapper.find(Canvas).props().onAssetMetadataChanged(assetMetadata);

        await MockFactory.flushUi();

        expect(editorPage.state().isValid).toBe(true);
        expect(saveAssetMetadataSpy).toBeCalled();
        expect(saveProjectSpy).toBeCalled();
    });

    it("displays un-tagged warning when user attempts to switch assets while page is in invalid state", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        const defaultAsset = testAssets[0];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();
        wrapper.update();

        // Create a new un-tagged region
        const newRegion = MockFactory.createTestRegion("unTaggedRegion", []);
        const assetMetadata: IAssetMetadata = {
            asset: defaultAsset,
            regions: [newRegion],
            version: appInfo.version,
            labelData: null,
        };

        saveAssetMetadataSpy.mockClear();
        saveProjectSpy.mockClear();

        // Initial state change
        wrapper.find(Canvas).props().onAssetMetadataChanged(assetMetadata);
        // Attempt to navigate to different asset
        wrapper.find(EditorSideBar).props().onAssetSelected(testAssets[1]);

        expect(editorPage.state().isValid).toBe(false);
        expect(editorPage.state().showInvalidRegionWarning).toBe(true);

        // Close the warning
        wrapper.find(Alert).props().onClose();

        expect(editorPage.state().showInvalidRegionWarning).toBe(false);
    });

    it("Check correct saving and loading of last visited asset", async () => {
        // create test project and asset
        const testProject = MockFactory.createTestProject("TestProject");
        testProject.lastVisitedAssetId = testAssets[1].id;
        const defaultAsset = testAssets[1];

        // mock store and props
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);

        const loadAssetMetadataSpy = jest.spyOn(props.actions, "loadAssetMetadata");
        const saveAssetMetadataSpy = jest.spyOn(props.actions, "saveAssetMetadata");
        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");

        // create mock editor page
        const wrapper = createComponent(store, props);
        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        await MockFactory.flushUi();

        const expectedAsset = editorPage.state().assets[1];
        const partialProject = {
            id: testProject.id,
            name: testProject.name,
            lastVisitedAssetId: testAssets[1].id,
        };

        expect(loadAssetMetadataSpy).toBeCalledWith(expect.objectContaining(partialProject), defaultAsset);
        expect(saveAssetMetadataSpy).toBeCalledWith(
            expect.objectContaining(partialProject),
            expect.objectContaining({
                asset: {
                    ...expectedAsset,
                    state: AssetState.Visited,
                },
            }),
        );
        expect(saveProjectSpy).toBeCalledWith(expect.objectContaining(partialProject));
    });

    it("When an image is updated the asset metadata is updated", async () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = MockFactory.editorPageProps(testProject.id);
        const wrapper = createComponent(store, props);
        const imageAsset = testAssets[0];

        await MockFactory.flushUi();
        wrapper.update();

        const editedImageAsset: IAssetMetadata = {
            asset: imageAsset,
            regions: [MockFactory.createTestRegion("editedImageAsset", ["test"])],
            version: appInfo.version,
            labelData: null,
        };

        const saveMock = assetServiceMock.prototype.save as jest.Mock;
        saveMock.mockClear();

        wrapper.find(Canvas).props().onAssetMetadataChanged(editedImageAsset);
        await MockFactory.flushUi();

        const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps, IEditorPageState>;

        // Image asset is updated
        expect(assetServiceMock.prototype.save).toBeCalledWith({
            asset: {
                ...imageAsset,
                state: AssetState.Tagged,
            },
            regions: editedImageAsset.regions,
            version: appInfo.version,
        });

        const matchingRootAsset = editorPage.state().assets.find((asset) => asset.id === imageAsset.id);
        expect(matchingRootAsset.state).toEqual(AssetState.Tagged);
    });

    describe("Basic tag interaction tests", () => {

        beforeAll(() => {
            registerMixins();
        });

        it("tags are initialized correctly", () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            expect(wrapper.find(TagInput).props().tags).toEqual(project.tags);
        });

        it("create a new tag updates project tags", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            const newTag = MockFactory.createTestTag("NewTag");
            const updatedTags = [...project.tags, newTag];
            wrapper.find(TagInput).props().onChange(updatedTags);

            await MockFactory.flushUi();
            wrapper.update();

            const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps>;
            const projectTags = editorPage.props().project.tags;

            expect(projectTags).toHaveLength(updatedTags.length);
            expect(projectTags[projectTags.length - 1].name).toEqual(newTag.name);
        });

        it("Remove a tag", async () => {
            const project = MockFactory.createTestProject("test", 5);
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            const tagToDelete = project.tags[project.tags.length - 1];

            // Accept the modal delete warning
            wrapper.update();
            wrapper.find(".modal-footer button").first().simulate("click");

            await MockFactory.flushUi();
            wrapper.update();

            const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps>;
            const projectTags = editorPage.props().project.tags;

            expect(projectTags).toHaveLength(project.tags.length - 1);
        });

        it("Adds tag to locked tags when CmdOrCtrl clicked", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            wrapper.update();
            wrapper.find("span.tag-name-text")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            const newEditorPage = wrapper.find(EditorPage).childAt(0);
            expect(newEditorPage.state().lockedTags).toEqual([project.tags[0].name]);
        });

        it("Removes tag from locked tags when ctrl clicked", async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
            });

            const wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);

            wrapper.update();
            wrapper.find("span.tag-name-text")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            let editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().lockedTags).toEqual([project.tags[0].name]);

            wrapper.update();
            wrapper.find("span.tag-name-text")
                .first()
                .simulate("click", { target: { innerText: project.tags[0].name }, ctrlKey: true });
            editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().lockedTags).toEqual([]);
        });
    });

    describe("Resizing editor page", () => {
        let wrapper: ReactWrapper;
        const defaultThumbnailSize: ISize = {
            width: 400,
            height: 300,
        };

        beforeEach(async () => {
            const project = MockFactory.createTestProject();
            const store = createReduxStore({
                ...MockFactory.initialState(),
                currentProject: project,
                appSettings: {
                    ...MockFactory.appSettings(),
                    thumbnailSize: defaultThumbnailSize,
                },
            });

            wrapper = createComponent(store, MockFactory.editorPageProps());
            await waitForSelectedAsset(wrapper);
            wrapper.update();
        });

        it("loads default thumbnail size from app settings", () => {
            const editorPage = wrapper.find(EditorPage).childAt(0);
            expect(editorPage.state().thumbnailSize).toEqual(defaultThumbnailSize);
        });

        it("Saves thumbnail size to app settings", () => {
            const editorPage = wrapper.find(EditorPage).childAt(0) as ReactWrapper<IEditorPageProps>;
            const saveSettingsSpy = jest.spyOn(editorPage.props().applicationActions, "saveAppSettings");
            const newThumbnailWidth = 300;

            wrapper.find(SplitPane).props().onChange(newThumbnailWidth);
            wrapper.find(SplitPane).props().onDragFinished(newThumbnailWidth);

            expect(saveSettingsSpy).toBeCalledWith(expect.objectContaining({
                thumbnailSize: {
                    width: newThumbnailWidth,
                    height: newThumbnailWidth / (4 / 3),
                },
            }));
        });
    });
});

async function createStore(project: IProject, setCurrentProject: boolean = false): Promise<Store<any, AnyAction>> {
    const initialState: IApplicationState = {
        currentProject: setCurrentProject ? project : null,
        appSettings: MockFactory.appSettings(),
        connections: [],
        recentProjects: [project],
    };

    return await createReduxStore(initialState);
}

async function waitForSelectedAsset(wrapper: ReactWrapper) {
    await MockFactory.waitForCondition(() => {
        const editorPage = wrapper
            .find(EditorPage)
            .childAt(0);

        return !!editorPage.state().selectedAsset;
    });
}
