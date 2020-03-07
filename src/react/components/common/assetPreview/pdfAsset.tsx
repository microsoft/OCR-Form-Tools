// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IAssetPreviewProps } from "./assetPreview";
import * as pdfjsLib from "pdfjs-dist";
import { constants } from "../../../../common/constants";

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

    constructor(props: IAssetPreviewProps) {
        super(props);

        this.state = {
            imageUri: "",
        };
    }

    public componentDidMount() {
        if (this.props.asset != null) {
            this.loadPdfFile(this.props.asset.path);
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
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then((pdf) => {
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
        pdf.getPage(pageNumber).then((page) => {
            const defaultScale = 1;
            const viewport = page.getViewport({ scale: defaultScale });

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

            const renderTask = page.render(renderContext);
            renderTask.promise.then(() => {
                this.setState({
                    imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedThumbnailQuality),
                });
            });
          });
    }

    private onLoad = () => {
        if (this.props.onLoaded) {
            this.props.onLoaded(this.image.current);
        }
        if (this.props.onActivated) {
            this.props.onActivated(this.image.current);
        }
        if (this.props.onDeactivated) {
            this.props.onDeactivated(this.image.current);
        }
    }
}
