// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IAssetPreviewProps } from "./assetPreview";
import * as pdfjsLib from "pdfjs-dist";
import { constants } from "../../../../common/constants";
import utils from "../imageMap/utils";
import {resizeCanvas} from "../../../../common/utils";
import {IAsset} from "../../../../models/applicationState";

// temp hack for enabling worker
pdfjsLib.GlobalWorkerOptions.workerSrc = constants.pdfjsWorkerSrc(pdfjsLib.version);

export interface IPDFAssetState {
    imageUri: string;
}

/**
 * PDFAsset component used to render all PDF assets
 */
export class PDFAsset extends React.Component<IAssetPreviewProps, IPDFAssetState> {
    private image: React.RefObject<HTMLImageElement> = React.createRef();
    private pdf;
    private page;
    private renderTask;
    private canvas;
    private loadingTask;

    constructor(props: IAssetPreviewProps) {
        super(props);
        this.page = null;
        this.pdf = null;
        this.renderTask = null;
        this.canvas = null;
        this.loadingTask = null;
        this.state = {
            imageUri: "",
        };
    }

    public componentWillUnmount() {
        this.releaseMemoryUsedByPDF();
    }

    public componentDidMount() {
        if (this.props.asset != null) {
            if (this.props.asset.cachedImage) {
                this.setState({
                    imageUri: this.props.asset.cachedImage,
                });
            } else {
                this.loadPdfFile(this.props.asset.path);
            }
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

    private loadPdfFile = (url) => {
        this.loadingTask = pdfjsLib.getDocument(url);
        this.loadingTask.promise.then((pdf) => {
            this.pdf = pdf;
            // Fetch the first page
            this.loadPdfPage(pdf, 1 /*pageNumber*/);
        }, (reason) => {
            this.releaseMemoryUsedByPDF();
            // PDF loading error
            if (this.props.onError) {
                this.props.onError(reason);
            }
        });
    }

    private loadPdfPage = (pdf, pageNumber) => {
        pdf.getPage(pageNumber).then((page) => {
            this.page = page;
            const defaultScale = 1;
            const viewport = page.getViewport({ scale: defaultScale });

            // Prepare canvas using PDF page dimensions
            this.canvas = document.createElement("canvas");
            const context = this.canvas.getContext("2d");
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;

            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: context,
                viewport,
            };

            this.renderTask = page.render(renderContext);
            this.renderTask.promise.then(() => {
                const thumbnails = resizeCanvas(this.canvas, 240, 240).toDataURL(constants.convertedImageFormat, constants.convertedThumbnailQuality);
                this.setState({
                    imageUri: thumbnails,
                }, () => {
                    this.releaseMemoryUsedByPDF();
                });
            }).catch((err) => {
                this.releaseMemoryUsedByPDF();
            });
        }).catch((err) => {
            this.releaseMemoryUsedByPDF();
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

    private releaseMemoryUsedByPDF() {
        if (this.pdf) {
            this.pdf.cleanup();
            if (!this.pdf.destroyed) {
                this.pdf.destroy();
            }
            this.pdf = null;
        }
        if (this.renderTask) {
            this.renderTask.cancel();
            this.renderTask = null;
        }
        if (this.page) {
            if (!this.page.pendingCleanup) {
                this.page.cleanup();
            }
            if(!this.page.destroyed) {
                this.page.destroy();
            }
            this.page = null;
        }
        if (this.loadingTask) {
            if (!this.loadingTask.destroyed) {
                this.loadingTask.destroy();
            }
            this.loadingTask = null;
        }
        if (this.canvas) {
            delete this.canvas;
            this.canvas = null;
        }
    }
}
