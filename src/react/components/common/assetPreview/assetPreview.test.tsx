// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ReactWrapper, mount } from "enzyme";
import { AssetPreview, IAssetPreviewProps, IAssetPreviewState } from "./assetPreview";
import MockFactory from "../../../../common/mockFactory";
import { ImageAsset } from "./imageAsset";
import { AssetType, IAsset } from "../../../../models/applicationState";

describe("Asset Preview Component", () => {
    let wrapper: ReactWrapper<IAssetPreviewProps, IAssetPreviewState> = null;
    // tslint:disable-next-line:max-line-length
    const dataUri = "data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7";
    const onLoadedHandler = jest.fn();
    const onErrorHandler = jest.fn();
    const onActivatedHandler = jest.fn();
    const onDeactivatedHandler = jest.fn();
    const onChildAssetSelectedHandler = jest.fn();
    const onAssetChangedHandler = jest.fn();
    const onBeforeAssetChangedHandler = jest.fn(() => true);

    const defaultProps: IAssetPreviewProps = {
        asset: {
            ...MockFactory.createTestAsset("test-image-asset"),
            path: dataUri,
        },
        controlsEnabled: true,
        onLoaded: onLoadedHandler,
        onError: onErrorHandler,
        onActivated: onActivatedHandler,
        onDeactivated: onDeactivatedHandler,
        onBeforeAssetChanged: onBeforeAssetChangedHandler,
        onAssetChanged: onAssetChangedHandler,
    };

    function createComponent(props?: IAssetPreviewProps): ReactWrapper<IAssetPreviewProps, IAssetPreviewState> {
        props = props || defaultProps;
        return mount(<AssetPreview {...props} />);
    }

    beforeEach(() => {
        onLoadedHandler.mockClear();
        onErrorHandler.mockClear();
        onActivatedHandler.mockClear();
        onDeactivatedHandler.mockClear();
        onBeforeAssetChangedHandler.mockClear();
        onAssetChangedHandler.mockClear();
        onChildAssetSelectedHandler.mockClear();
    });

    it("renders an image asset when asset type is image", () => {
        wrapper = createComponent();
        const imageProps = wrapper.find(ImageAsset).props();

        expect(wrapper.find(ImageAsset).exists()).toBe(true);
        expect(imageProps.onActivated).toBe(onActivatedHandler);
        expect(imageProps.onDeactivated).toBe(onDeactivatedHandler);

    });

    it("renders loading indicator if asset isn't fully loaded", () => {
        wrapper = createComponent();
        expect(wrapper.find(".asset-loading").exists()).toBe(true);
        expect(wrapper.state().loaded).toBe(false);
    });

    it("renders asset error string if asset type is unknown", () => {
        const props: IAssetPreviewProps = {
            ...defaultProps,
            asset: {
                ...MockFactory.createTestAsset("unknown-asset"),
                type: AssetType.Unknown,
            },
        };

        wrapper = createComponent(props);
        expect(wrapper.find(".asset-error").exists()).toBe(true);
    });

    it("renders asset error when there is an error loading an asset", () => {
        wrapper = createComponent();
        const errorEvent = new Event("error");

        wrapper.find(ImageAsset).props().onError(errorEvent as any);
        wrapper.update();

        expect(wrapper.find(".asset-error").exists()).toBe(true);
    });

    it("raises asset loaded handler when image asset loading is complete", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onLoaded(MockFactory.createTestAsset() as IAsset,
                                                  document.createElement("img"));
        wrapper.update();

        expect(onLoadedHandler).toBeCalledWith(expect.any(HTMLImageElement));
        expect(wrapper.state().loaded).toBe(true);
        expect(wrapper.find(".asset-loading").exists()).toBe(false);
    });

    it("raises asset error handler when an image asset fails to load successfully", () => {
        wrapper = createComponent();
        const errorEvent = new Event("error");
        wrapper.find(ImageAsset).props().onError(errorEvent as any);

        expect(wrapper.state().hasError).toBe(true);
        expect(wrapper.state().loaded).toBe(true);
        expect(onErrorHandler).toBeCalledWith(errorEvent);
    });

    it("raises activated handler when asset is activated", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onActivated(document.createElement("img"));

        expect(onActivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("raises deactivated handler when asset is deactivated", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onDeactivated(document.createElement("img"));

        expect(onDeactivatedHandler).toBeCalledWith(expect.any(HTMLImageElement));
    });

    it("renders landscape asset correctly", () => {
        const props = { ...defaultProps };
        props.asset.size = {
            width: 800,
            height: 600,
        };

        wrapper = createComponent(props);
        const assetPreview = wrapper.find(".asset-preview");

        expect(assetPreview.exists()).toBe(true);
        expect(assetPreview.props().className).toContain("landscape");
    });

    it("renders portrait asset correctly", () => {
        const props = { ...defaultProps };
        props.asset.size = {
            width: 600,
            height: 800,
        };

        wrapper = createComponent(props);
        const assetPreview = wrapper.find(".asset-preview");

        expect(assetPreview.exists()).toBe(true);
        expect(assetPreview.props().className).toContain("portrait");
    });

    it("updates loaded/error flags when asset changes", () => {
        wrapper = createComponent();
        wrapper.find(ImageAsset).props().onLoaded(MockFactory.createTestAsset() as IAsset,
                                                  document.createElement("img"));

        expect(wrapper.state()).toEqual({
            loaded: true,
            hasError: false,
        });

        wrapper.setProps({
            asset: MockFactory.createTestAsset("AnotherImageAsset"),
        });

        expect(wrapper.state()).toEqual({
            loaded: false,
            hasError: false,
        });
    });
});
