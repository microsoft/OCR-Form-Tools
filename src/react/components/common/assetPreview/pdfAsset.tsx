// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IAssetPreviewProps } from "./assetPreview";
import * as pdfjsLib from "pdfjs-dist";
import { constants } from "../../../../common/constants";
import {resizeCanvas} from "../../../../common/utils";

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
    private unmounted;

    constructor(props: IAssetPreviewProps) {
        super(props);
        this.unmounted = false;
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
        this.unmounted = true;
    }

    public componentDidMount() {
        if (this.unmounted || this.pendingRelease) {
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
                style={ { display: this.state.imageUri ? "block" : "none" } }
                crossOrigin="anonymous" />
        );
    }

    private loadPdfFile = (url) => {
        if (this.unmounted) {
            return;
        }
        this.loadingTask = pdfjsLib.getDocument(url);
        this.loadingTask.promise.then((pdf) => {
            this.pdf = pdf;
            if (this.unmounted) {
                this.releaseMemoryUsedByPDF();
                return;
            }
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
            if (this.unmounted) {
                this.releaseMemoryUsedByPDF();
                return;
            }
            this.renderTask = page.render(renderContext);
            this.renderTask.promise.then(() => {
                if (this.unmounted) {
                    this.releaseMemoryUsedByPDF();
                    return;
                }
                const thumbnails = resizeCanvas(this.canvas, 240, 240).toDataURL(constants.convertedImageFormat,
                                                                                 constants.convertedThumbnailQuality);
                this.setState({
                    imageUri: thumbnails,
                }, () => {
                    this.releaseMemoryUsedByPDF();
                });
            }).catch(() => {
                this.releaseMemoryUsedByPDF();
            });
        }).catch(() => {
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
        if (this.loadingTask) {
            if (!this.loadingTask.destroyed) {
                this.loadingTask.destroy();
            }
            this.loadingTask = null;
        }
        if (this.renderTask) {
            this.renderTask.cancel();
            this.renderTask = null;
        }
        if (this.page) {
            if (!this.page.pendingCleanup) {
                this.page.cleanup();
            }
            if (!this.page.destroyed) {
                this.page.destroy();
            }
            this.page = null;
        }
        if (this.pdf) {
            if (!this.pdf.destroyed) {
                this.pdf.cleanup();
                this.pdf.destroy();
            }
            this.pdf = null;
        }
        if (this.canvas) {
            delete this.canvas;
            this.canvas = null;
        }
    }
}
