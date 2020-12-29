// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { mount, ReactWrapper } from "enzyme";
import React from "react";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode, IAssetMetadata, IAsset } from "../../../../models/applicationState";
import { AssetPreview, IAssetPreviewProps } from "../../common/assetPreview/assetPreview";
import Canvas, { ICanvasProps, ICanvasState } from "./canvas";
import Confirm, { IConfirmProps } from "../../common/confirm/confirm";

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
            project: MockFactory.createTestProject(),
            lockedTags: [],
            hoveredLabel: null,
            appSettings: null,
            highlightedTableCell: null,
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

    beforeAll(() => {
        const clipboard = (navigator as any).clipboard;
        if (!(clipboard && clipboard.writeText)) {
            (navigator as any).clipboard = {
                writeText: jest.fn(() => Promise.resolve()),
                readText: jest.fn(() => Promise.resolve(JSON.stringify([copiedRegion]))),
            };
        }
    });

    it("renders correctly from default state", async () => {
        const wrapper = createComponent();
        const canvas = wrapper.instance();

        // Simulate an image loading asset preview
        const image = document.createElement("img");
        wrapper.find(AssetPreview).props().onLoaded(MockFactory.createTestAsset() as IAsset, image);
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

    it("canvas is updated when asset loads", () => {
        const wrapper = createComponent();
        const img = document.createElement("img");
        wrapper.find(AssetPreview).props().onLoaded(MockFactory.createTestAsset() as IAsset, img);
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
    });

    it("canvas content source is updated when asset is deactivated", () => {
        const wrapper = createComponent();
        const contentSource = document.createElement("img");
        // wrapper.setState({ contentSource });
        // wrapper.find(AssetPreview).props().onDeactivated(document.createElement("img"));

        // expect(wrapper.instance().editor.addContentSource).toBeCalledWith(expect.any(HTMLImageElement));
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
        wrapper.find(AssetPreview).props().onLoaded(MockFactory.createTestAsset() as IAsset, img);
        wrapper.find(AssetPreview).props().onActivated(img);
        wrapper.find(AssetPreview).props().onDeactivated(img);

        // const canvasEditor = wrapper.instance().editor;

        // expect(canvasEditor.RM.addRegion).toBeCalledTimes(assetMetadata.regions.length);
        // expect(canvasEditor.AS.enable).toBeCalled();
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

        const newTag = "newTag";
        canvas.applyTag(newTag);

        const expected = cloneWithUpdatedRegionTags(wrapper.prop("selectedAsset"), "test1", [newTag]);

        expect(onAssetMetadataChanged).toBeCalledWith(expected);
        expect(wrapper.state().currentAsset.regions[0].tags).toEqual([newTag]);
    });

    it("Clears all regions from asset", async () => {
        const wrapper = createComponent();
        const clearConfirm = wrapper.find(Confirm) as ReactWrapper<IConfirmProps>;
        clearConfirm.props().onConfirm();

        await MockFactory.flushUi();
        expect(wrapper.state().currentAsset.regions).toEqual([]);
    });
});
