// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IAssetPreviewProps } from "./assetPreview";
import { IAsset } from "../../../../models/applicationState";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { parseTiffData, renderTiffToCanvas } from "../../../../common/utils";
import { constants } from "../../../../common/constants";

export interface ITiffAsset {
    imageUri: string;
}

/**
 * TiffAsset component used to render all Tiff assets
 */
export class TiffAsset extends React.Component<IAssetPreviewProps, ITiffAsset> {
    private image: React.RefObject<HTMLImageElement> = React.createRef();

    constructor(props: IAssetPreviewProps) {
        super(props);

        this.state = {
            imageUri: "",
        };
    }

    public componentDidMount() {
        if (this.props.asset != null) {
            this.loadTiffFile(this.props.asset);
        }
    }

    public render() {
        return (
            <img ref={this.image}
                src={this.state.imageUri}
                alt={this.props.asset.name}
                onLoad={this.onLoad}
                style={ { display: this.state.imageUri ? "block" : "none" } }
                crossOrigin="anonymous" />
        );
    }

    private loadTiffFile = async (asset: IAsset) => {
        const assetArrayBuffer = await HtmlFileReader.getAssetArray(asset);
        const tiffImages = parseTiffData(assetArrayBuffer);
        this.loadTiffPage(tiffImages, 1 /*pageNumber*/);
    }

    private loadTiffPage = (tiffImages, pageNumber) => {
        const tiffImage = tiffImages[pageNumber - 1];
        const canvas = renderTiffToCanvas(tiffImage);
        this.setState({
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedThumbnailQuality),
        });
}

    private onLoad = () => {
        if (this.props.onLoaded) {
            this.props.onLoaded(this.props.asset, this.image.current);
        }
        if (this.props.onActivated) {
            this.props.onActivated(this.image.current);
        }
        if (this.props.onDeactivated) {
            this.props.onDeactivated(this.image.current);
        }
    }
}
