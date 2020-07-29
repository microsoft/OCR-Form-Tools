// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IAssetPreviewProps } from "./assetPreview";
import * as pdfjsLib from "pdfjs-dist";
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
    private pdf;
    private page;
    private renderTask;
    private canvas;
    private loadingTask;
    private unmounted;
    private pendingRelease;

    constructor(props: IAssetPreviewProps) {
        super(props);
        this.unmounted = false;
        this.page = null;
        this.pdf = null;
        this.renderTask = null;
        this.canvas = null;
        this.loadingTask = null;
        this.pendingRelease = false;
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
        if (this.unmounted || this.pendingRelease) {
            return;
        }
        this.loadingTask = pdfjsLib.getDocument(url);
        this.loadingTask.promise.then((pdf) => {
            this.pdf = pdf;
            if (this.pendingRelease) {
                return
            }
            if (this.unmounted) {
                if (this.pdf) {
                    this.releaseMemoryUsedByPDF();
                }
                return;
            }
            // Fetch the first page
            this.loadPdfPage(pdf, 1 /*pageNumber*/);
        }, (reason) => {
            // PDF loading error
            if (this.props.onError) {
                this.props.onError(reason);
            }
        });
    }

    private loadPdfPage = (pdf, pageNumber) => {
            if (this.pendingRelease) {
                return
            }
            if (this.unmounted) {
                if (this.pdf) {
                    this.releaseMemoryUsedByPDF();
                }
                return;
            }
        pdf.getPage(pageNumber).then((page) => {
            this.page = page;
            this.page.cleanupAfterRender = true;
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
            if (this.pendingRelease || !this.page) {
                return
            }
            if (this.unmounted) {
                if (this.page) {
                    this.releaseMemoryUsedByPDF();
                }
                return;
            }
            this.renderTask = page.render(renderContext);
            this.renderTask.promise.then(() => {
                if (this.pendingRelease) {
                    return
                }
                if (this.unmounted || !this.page) {
                    if (this.page) {
                        this.releaseMemoryUsedByPDF();
                    }
                    return;
                }
                const thumbnails = resizeCanvas(this.canvas, 240, 240).toDataURL(constants.convertedImageFormat,
                                                                                 constants.convertedThumbnailQuality);
                this.setState({
                    imageUri: thumbnails,
                }, () => {
                    if (this.page) {
                        this.releaseMemoryUsedByPDF();
                    }
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

    private async releaseMemoryUsedByPDF() {
        if (this.pendingRelease) {
            return;
        }
        this.pendingRelease = true;
        try {
            if (this.renderTask) {
                await this.renderTask?.promise
                this.renderTask = null;
            }
            if (this.loadingTask) {
                await this.loadingTask?.promise
                this.loadingTask = null;
            }
            if (this.pdf) {
                await this.pdf?.cleanup();
                await this.pdf?.destroy();
                this.pdf = null;
            }
            if (this.canvas) {
                delete this.canvas;
                this.canvas = null;
            }
        } catch {
            // do nothing on rejects
        }
    }
}
