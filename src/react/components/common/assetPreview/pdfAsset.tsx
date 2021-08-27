// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IAssetPreviewProps } from "./assetPreview";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { constants } from "../../../../common/constants";
import {resizeCanvas} from "../../../../common/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = constants.pdfjsWorkerSrc(pdfjsLib.version);

export interface IPDFAssetState {
    imageUri: string;
}

/**
 * PDFAsset component used to render all PDF assets
 */
export class PDFAsset extends React.Component<IAssetPreviewProps, IPDFAssetState> {
    private image: React.RefObject<HTMLImageElement> = React.createRef();
    private unmounted: boolean;

    constructor(props: IAssetPreviewProps) {
        super(props);
        this.unmounted = false;
        this.state = {
            imageUri: "",
        };
    }

    public componentWillUnmount() {
        this.unmounted = true;
    }

    public componentDidMount() {
        if (this.unmounted) {
            return;
        }
        if (this.props.asset) {
            if (this.props.asset.cachedImage) {
                this.setState({
                    imageUri: this.props.asset.cachedImage,
                });
            } else {
                setTimeout(() => {
                    this.loadPdfFile(this.props.asset.path);
                }, 1000);
            }
        }
    }

    public render() {
        return (
            <img ref={this.image}
                src={this.state.imageUri}
                alt={this.props.asset.name}
                onLoad={this.onLoad}
                style={{display: this.state.imageUri ? "block" : "none"}}
                crossOrigin="anonymous" />
        );
    }

    private loadPdfFile = async (url) => {
        if (this.unmounted) {
            return;
        }
        let pdf;
        try {
            pdf = await pdfjsLib.getDocument(url).promise;
            await this.loadPdfPage(pdf, 1);
        }
        catch (err) {
            if (this.props.onError) {
                this.props.onError(err);
            }
        }
        finally {
            if (pdf) {
                pdf.destroy();
            }
        }
    }

    private loadPdfPage = async (pdf, pageNumber) => {
        const page: any = await pdf.getPage(pageNumber);
        if (page) {
            page.cleanupAfterRender = true;
            const defaultScale = 1;
            const viewport = page.getViewport({scale: defaultScale});

            // Prepare canvas using PDF page dimensions
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: context,
                viewport,
            };
            await page.render(renderContext).promise;
            const thumbnailsUri = resizeCanvas(canvas, 240, 240).toDataURL(constants.convertedImageFormat,
                constants.convertedThumbnailQuality);
            if (!this.unmounted) {
                this.setState({
                    imageUri: thumbnailsUri
                });
            }
        }
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
