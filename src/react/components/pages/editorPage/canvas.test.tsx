import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { RegionType } from "vott-react";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode, IAssetMetadata, IRegion, IAsset } from "../../../../models/applicationState";
import { AssetPreview, IAssetPreviewProps } from "../../common/assetPreview/assetPreview";
import Canvas, { ICanvasProps, ICanvasState } from "./canvas";
import CanvasHelpers from "./canvasHelpers";
import { appInfo } from "../../../../common/appInfo";

jest.mock("vott-ct/lib/js/CanvasTools/CanvasTools.Editor");
import { Editor } from "vott-ct/lib/js/CanvasTools/CanvasTools.Editor";

jest.mock("vott-ct/lib/js/CanvasTools/Region/RegionsManager");
import { RegionsManager } from "vott-ct/lib/js/CanvasTools/Region/RegionsManager";
import Confirm, { IConfirmProps } from "../../common/confirm/confirm";
import { Rect } from "vott-ct/lib/js/CanvasTools/Core/Rect";
import { SelectionMode } from "vott-ct/lib/js/CanvasTools/Interface/ISelectorSettings";

describe("Editor Canvas", () => {
    function createComponent(canvasProps?: ICanvasProps, assetPreviewProps?: IAssetPreviewProps)
        : ReactWrapper<ICanvasProps, ICanvasState, Canvas> {
        const props = createProps();
        const cProps = canvasProps || props.canvas;
        const aProps = assetPreviewProps || props.assetPreview;
        return mount(
            <Canvas {...cProps}>
                <AssetPreview {...aProps} />
            </Canvas>,
        );
    }

    function getAssetMetadata() {
        const asset: IAsset = {
            ...MockFactory.createTestAsset(),
            size: {
                width: 1600,
                height: 1200,
            },
        };
        return MockFactory.createTestAssetMetadata(asset, MockFactory.createTestRegions());
    }

    function createProps() {
        const canvasProps: ICanvasProps = {
            selectedAsset: getAssetMetadata(),
            onAssetMetadataChanged: jest.fn(),
            onCanvasRendered: jest.fn(),
            editorMode: EditorMode.Rectangle,
            selectionMode: SelectionMode.RECT,
            project: MockFactory.createTestProject(),
            lockedTags: [],
            hoveredLabel: null,
        };

        const assetPreviewProps: IAssetPreviewProps = {
            asset: getAssetMetadata().asset,
        };

        return {
            canvas: canvasProps,
            assetPreview: assetPreviewProps,
        };
    }

    const copiedRegion = MockFactory.createTestRegion("copiedRegion");

    const editorMock = Editor as any;

    beforeAll(() => {
        let selectionMode = {
            mode: SelectionMode.NONE,
            template: null,
        };

        editorMock.prototype.addContentSource = jest.fn(() => Promise.resolve());
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
        editorMock.prototype.RM = new RegionsManager(null, null);
        editorMock.prototype.AS = {
            enable: jest.fn(),
            disable: jest.fn(),
            setSelectionMode: jest.fn(({ mode, template = null }) => { selectionMode = { mode, template }; }),
            getSelectorSettings: jest.fn(() => selectionMode),
        };

        const clipboard = (navigator as any).clipboard;
        if (!(clipboard && clipboard.writeText)) {
            (navigator as any).clipboard = {
                writeText: jest.fn(() => Promise.resolve()),
                readText: jest.fn(() => Promise.resolve(JSON.stringify([copiedRegion]))),
            };
        }
    });

    function mockSelectedRegions(ids: string[]) {
        editorMock.prototype.RM = {
            ...new RegionsManager(null, null),
            getSelectedRegionsBounds: jest.fn(() => ids.map((id) => {
                return { id };
            })),
        };
    }

    it("renders correctly from default state", async () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();

        // Simulate an image loading asset preview
        const image = document.createElement("img");
        wrapper.find(AssetPreview).props().onLoaded(image);
        wrapper.find(AssetPreview).props().onDeactivated(image);
        wrapper.update();

        expect(wrapper.find(".canvas-enabled").exists()).toBe(true);
        expect(wrapper.state()).toEqual({
            contentSource: expect.any(HTMLImageElement),
            enabled: true,
            currentAsset: canvas.props.selectedAsset,
        });
    });

    it("renders in a disabled state when asset fails to load", () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();

        // Simulate an error loading asset preview
        wrapper.find(AssetPreview).props().onError(new Event("error") as any);
        wrapper.update();

        expect(wrapper.find(".canvas-disabled").exists()).toBe(true);
        expect(wrapper.state()).toEqual({
            contentSource: null,
            enabled: false,
            currentAsset: canvas.props.selectedAsset,
        });
    });

    it("regions are cleared and reset when selected asset changes", async () => {
        const wrapper = createComponent();
        const rmMock = RegionsManager as any;
        rmMock.prototype.deleteAllRegions.mockClear();

        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));
        assetMetadata.regions.push(MockFactory.createTestRegion());
        assetMetadata.regions.push(MockFactory.createTestRegion());

        mockSelectedRegions([]);
        wrapper.setProps({ selectedAsset: assetMetadata });
        const img = document.createElement("img");
        wrapper.find(AssetPreview).props().onLoaded(img);
        wrapper.find(AssetPreview).props().onDeactivated(img);

        // expect(wrapper.instance().editor.RM.deleteAllRegions).toBeCalled();
        expect(wrapper.instance().getSelectedRegions()).toEqual([]);
    });

    it("canvas is updated when asset loads", () => {
        const wrapper = createComponent();
        const img = document.createElement("img");
        wrapper.find(AssetPreview).props().onLoaded(img);
        wrapper.find(AssetPreview).props().onDeactivated(img);

        // expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
        // expect(wrapper.state().contentSource).toEqual(expect.any(HTMLImageElement));
    });

    it("loads asset with regions even if project has no tags", () => {
        const cProps = createProps().canvas;
        const assetMetadata = {
            ...MockFactory.createTestAssetMetadata(),
            regions: MockFactory.createTestRegions(),
        };

        const wrapper = createComponent({
            ...cProps,
            project: {
                ...MockFactory.createTestProject(),
                tags: null,
            },
            selectedAsset: assetMetadata,
        });
        const canvas = wrapper.instance() as Canvas;
        expect(wrapper.state().currentAsset).toEqual(assetMetadata);
        expect(() => canvas.updateCanvasToolsRegionTags()).not.toThrowError();
    });

    it("canvas content source is updated when asset is deactivated", () => {
        const wrapper = createComponent();
        const contentSource = document.createElement("img");
        // wrapper.setState({ contentSource });
        // wrapper.find(AssetPreview).props().onDeactivated(document.createElement("img"));

        // expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("onSelectionEnd adds region to asset and selects it", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });

        const newRegionData = MockFactory.createTestRegionData();
        const canvas = wrapper.instance();
        const originalRegions = wrapper.state().currentAsset.regions;
        const original: IAssetMetadata = {
            asset: { ...canvas.props.selectedAsset.asset },
            regions: [...canvas.props.selectedAsset.regions],
            version: appInfo.version,
            labelData: null,
        };

        // canvas.editor.onSelectionEnd(newRegionData);
        const expectedRegion = CanvasHelpers.fromRegionData(newRegionData, RegionType.Rectangle);

        const newRegion = wrapper.state().currentAsset.regions
            .find((r) => !originalRegions.find((or) => or.id === r.id));

        mockSelectedRegions([newRegion.id]);
        expect(wrapper.instance().getSelectedRegions()).toEqual([newRegion]);

        expect(wrapper.state().currentAsset.regions).toMatchObject([
            ...original.regions,
            { ...expectedRegion, id: expect.any(String) },
        ]);
    });

    it("copies correct rectangle for copyRect", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });

        const testRegionData = MockFactory.createTestRegionData();
        // wrapper.instance().editor.onSelectionEnd(testRegionData);

        const testRegion = wrapper.state().currentAsset.regions[0];
        mockSelectedRegions([testRegion.id]);
        expect(wrapper.instance().getSelectedRegions()).toEqual([testRegion]);

        wrapper.setProps({ selectionMode: SelectionMode.COPYRECT });
        // expect(wrapper.instance().editor.AS.getSelectorSettings()).toEqual({
        //     mode: SelectionMode.COPYRECT,
        //     template: new Rect(testRegionData.width, testRegionData.height),
        // });
    });

    it("throws error when no selected region for copyRect", () => {
        const wrapper = createComponent();
        const defaultTemplate = new Rect(20, 20);
        mockSelectedRegions([]);

        wrapper.setProps({ selectionMode: SelectionMode.COPYRECT });
        // expect(wrapper.instance().editor.AS.getSelectorSettings()).toEqual({
        //     mode: SelectionMode.COPYRECT,
        //     template: defaultTemplate,
        // });
    });

    it("canvas updates regions when a new asset is loaded", () => {
        const wrapper = createComponent();

        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));
        assetMetadata.regions.push(MockFactory.createTestRegion());
        assetMetadata.regions.push(MockFactory.createTestRegion());

        // Clear out mock counts
        // (wrapper.instance().editor.RM.addRegion as any).mockClear();

        wrapper.setProps({ selectedAsset: assetMetadata });
        const img = document.createElement("img");
        wrapper.find(AssetPreview).props().onLoaded(img);
        wrapper.find(AssetPreview).props().onActivated(img);
        wrapper.find(AssetPreview).props().onDeactivated(img);

        // const canvasEditor = wrapper.instance().editor;

        // expect(canvasEditor.RM.addRegion).toBeCalledTimes(assetMetadata.regions.length);
        // expect(canvasEditor.AS.enable).toBeCalled();
    });

    it("canvas is disabled while new asset is loading", () => {
        const wrapper = createComponent();

        const assetMetadata = MockFactory.createTestAssetMetadata(MockFactory.createTestAsset("new-asset"));

        wrapper.setProps({ selectedAsset: assetMetadata });
        // wrapper.setState({ enabled: true });

        // const img = document.createElement("img");
        // wrapper.find(AssetPreview).props().onLoaded(img);
        // wrapper.find(AssetPreview).props().onActivated(img);

        // const canvasEditor = wrapper.instance().editor;

        // expect(canvasEditor.RM.deleteAllRegions).toBeCalled();
        // expect(canvasEditor.AS.disable).toBeCalled();
        // expect(canvasEditor.AS.setSelectionMode).toBeCalledWith(SelectionMode.NONE);
    });

    it("onRegionMove edits region info in asset", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });

        const canvas = wrapper.instance();
        const original: IAssetMetadata = {
            asset: { ...canvas.props.selectedAsset.asset },
            regions: [...canvas.props.selectedAsset.regions],
            version: appInfo.version,
            labelData: null,
        };

        const movedRegionData = MockFactory.createTestRegionData();
        // canvas.editor.onRegionMoveEnd("test1", movedRegionData);

        expect(onAssetMetadataChanged).toBeCalledWith({
            ...original,
            regions: original.regions.map((r) => {
                if (r.id === "test1") {
                    return {
                        ...r,
                        points: movedRegionData.points,
                        boundingBox: {
                            height: movedRegionData.height,
                            width: movedRegionData.width,
                            left: movedRegionData.x,
                            top: movedRegionData.y,
                        },
                    };
                }
                return r;
            }),
        });
    });

    it("onRegionDelete removes region from asset and clears selectedRegions", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });

        const canvas = wrapper.instance();
        const original: IAssetMetadata = {
            asset: { ...canvas.props.selectedAsset.asset },
            regions: [...canvas.props.selectedAsset.regions],
            version: appInfo.version,
            labelData: null,
        };

        expect(wrapper.state().currentAsset.regions.length).toEqual(original.regions.length);

        mockSelectedRegions(["test1"]);
        // canvas.editor.onRegionDelete("test1");

        expect(wrapper.state().currentAsset.regions.length).toEqual(original.regions.length - 1);
        expect(onAssetMetadataChanged).toBeCalledWith({
            ...original,
            regions: original.regions.filter((r) => r.id !== "test1"),
        });
        expect(wrapper.instance().getSelectedRegions().length).toEqual(0);
    });

    it("onRegionSelected adds region to list of selected regions on asset", () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();
        // const original: IAssetMetadata = {
        //     asset: { ...canvas.props.selectedAsset.asset },
        //     regions: [...canvas.props.selectedAsset.regions],
        //     version: appInfo.version,
        // };
        // expect(wrapper.state().currentAsset.regions.length).toEqual(original.regions.length);

        // mockSelectedRegions(["test1"]);
        // expect(wrapper.instance().getSelectedRegions().length).toEqual(1);
        // expect(wrapper.instance().getSelectedRegions()).toMatchObject([
        //     original.regions.find((region) => region.id === "test1"),
        // ]);

        // mockSelectedRegions(["test1", "test2"]);
        // expect(wrapper.instance().getSelectedRegions().length).toEqual(2);
        // expect(wrapper.instance().getSelectedRegions()).toMatchObject([
        //     original.regions.find((region) => region.id === "test1"),
        //     original.regions.find((region) => region.id === "test2"),
        // ]);
    });

    function cloneWithUpdatedRegionTags(original: IAssetMetadata, regionId: string, tags: string[]) {
        return {
            ...original,
            regions: original.regions.map((r) => {
                if (r.id === regionId) {
                    return {
                        ...r,
                        tags,
                    };
                }
                return r;
            }),
        };
    }

    it("Applies single tag to selected region", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        wrapper.setProps({ onAssetMetadataChanged });
        const canvas = wrapper.instance();
        mockSelectedRegions(["test1"]);
        // canvas.editor.onRegionSelected("test1", null);

        const newTag = "newTag";
        canvas.applyTag(newTag);

        const expected = cloneWithUpdatedRegionTags(wrapper.prop("selectedAsset"), "test1", [newTag]);

        expect(onAssetMetadataChanged).toBeCalledWith(expected);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual([newTag]);
    });

    it("Adds new locked tag to selected region", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        const newTag = "newTag";
        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags: [newTag],
        });
        const canvas = wrapper.instance();
        mockSelectedRegions(["test1"]);
        // canvas.editor.onRegionSelected("test1", false);

        canvas.applyTag(newTag);

        const expected = cloneWithUpdatedRegionTags(wrapper.prop("selectedAsset"), "test1", [newTag]);

        expect(onAssetMetadataChanged).toBeCalledWith(expected);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual([newTag]);
    });

    it("Removes old locked tag from selected region", () => {
        const original = cloneWithUpdatedRegionTags(getAssetMetadata(), "test1", ["tag4"]);
        const canvasProps: ICanvasProps = {
            ...createProps().canvas,
            selectedAsset: original,
        };
        const wrapper = createComponent(canvasProps);
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag4"];

        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        mockSelectedRegions(["test1"]);
        // canvas.editor.onRegionSelected("test1", false);
        const expectedTags = ["tag4"];
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual(expectedTags);
        expect(onAssetMetadataChanged).toBeCalledWith(cloneWithUpdatedRegionTags(original, "test1", expectedTags));

        wrapper.setProps({
            lockedTags: [],
        });

        canvas.applyTag("tag4");
        expect(onAssetMetadataChanged).toBeCalledWith(cloneWithUpdatedRegionTags(original, "test1", []));
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual([]);
    });

    it("Applies locked tags to selected region with empty tags", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag1", "tag2", "tag3"];
        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        mockSelectedRegions(["test1"]);
        // canvas.editor.onRegionSelected("test1", null);

        // const expected: IAssetMetadata =
        //    cloneWithUpdatedRegionTags(wrapper.prop("selectedAsset"), "test1", lockedTags);
        // expect(wrapper.state().currentAsset.regions[0].tags).toEqual(lockedTags);
        // expect(onAssetMetadataChanged).toBeCalledWith(expected);
    });

    it("Applies locked tags to selected region with existing tags", () => {
        const original = getAssetMetadata();
        const canvasProps: ICanvasProps = {
            ...createProps().canvas,
            selectedAsset: cloneWithUpdatedRegionTags(original, "test1", ["tag4"]),
        };
        const wrapper = createComponent(canvasProps);
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag1", "tag2", "tag3"];

        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });
        const canvas = wrapper.instance();

        mockSelectedRegions(["test1"]);
        // canvas.editor.onRegionSelected("test1", null);

        // const expectedTags = ["tag4", ...lockedTags];

        // const expected: IAssetMetadata = cloneWithUpdatedRegionTags(original, "test1", expectedTags);
        // expect(wrapper.state().currentAsset.regions[0].tags).toEqual(expectedTags);
        // expect(onAssetMetadataChanged).toBeCalledWith(expected);
    });

    it("Applies locked tags to newly drawn region", () => {
        const wrapper = createComponent();
        const onAssetMetadataChanged = jest.fn();
        const lockedTags = ["tag1", "tag2", "tag3"];
        const canvas = wrapper.instance();

        const newRegionData = MockFactory.createTestRegionData();
        const newRegion = CanvasHelpers.fromRegionData(newRegionData, RegionType.Rectangle);

        wrapper.setProps({
            onAssetMetadataChanged,
            lockedTags,
        });

        const originalRegions = wrapper.state().currentAsset.regions;

        // canvas.editor.onSelectionEnd(newRegionData);

        // const expected: IRegion = {
        //     ...newRegion,
        //     id: expect.any(String),
        //     tags: lockedTags,
        // };

        // mockSelectedRegions([expected.id]);

        // expect(wrapper.state().currentAsset.regions
        //     .find((r) => !originalRegions.find((or) => or.id === r.id)))
        //     .toMatchObject(expected);
    });

    it("Clears all regions from asset", async () => {
        const wrapper = createComponent();
        const clearConfirm = wrapper.find(Confirm) as ReactWrapper<IConfirmProps>;
        clearConfirm.props().onConfirm();

        await MockFactory.flushUi();
        expect(wrapper.state().currentAsset.regions).toEqual([]);
    });

    it("Tags are re-applied when the project tags are updated", () => {
        const wrapper = createComponent();
        const assetMetadata = wrapper.props().selectedAsset;
        const project = { ...wrapper.props().project };
        const tags = [...project.tags];
        tags[0].color = "#FFCCFF";
        project.tags = tags;

        // const editor = wrapper.instance().editor;
        // const updateTagsSpy = jest.spyOn(editor.RM, "updateTagsById");

        // wrapper.setProps({ project });
        // expect(updateTagsSpy).toBeCalledTimes(assetMetadata.regions.length);
    });
});
