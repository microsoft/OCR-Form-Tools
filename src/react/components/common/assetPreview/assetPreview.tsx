// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { IAsset, AssetType } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { ImageAsset } from "./imageAsset";
import { PDFAsset } from "./pdfAsset";
import { TiffAsset } from "./tiffAsset";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { Label } from "@fluentui/react/lib/Label";

export interface IGenericContentSource {
    width: number;
    height: number;
    offsetWidth: number;
    offsetHeight: number;
    offsetTop: number;
    offsetLeft: number;
}
export type ContentSource = HTMLImageElement | HTMLVideoElement | IGenericContentSource;

/**
 * AssetPreview component properties
 */
export interface IAssetPreviewProps {
    /** The Asset to preview */
    asset: IAsset;
    /** Specifies whether the asset controls are enabled */
    controlsEnabled?: boolean;
    /** Event handler that fires when the asset has been loaded */
    onLoaded?: (asset: IAsset, contentSource: ContentSource) => void;
    /** Event handler that fires when the asset has been activated (ex. Video resumes playing) */
    onActivated?: (contentSource: ContentSource) => void;
    /** Event handler that fires when the asset has been deactivated (ex. Canvas tools takes over) */
    onDeactivated?: (contentSource: ContentSource) => void;
    /** Event handler that fires when an error occurred loading an asset */
    onError?: (event: React.SyntheticEvent) => void;
    /** Event handler that fires when the loaded asset has changed */
    onAssetChanged?: (asset: IAsset) => void;
    /** Event handler that fires right before an asset has changed */
    onBeforeAssetChanged?: () => boolean;
}

/**
 * State for Asset Preview
 * @member loaded - Asset is loaded
 */
export interface IAssetPreviewState {
    loaded: boolean;
    hasError: boolean;
}

/**
 * @name - Asset Preview
 * @description - Small preview of assets for selection in editor page
 */
export class AssetPreview extends React.Component<IAssetPreviewProps, IAssetPreviewState> {
    /** Default properties for component if not defined */
    public static defaultProps: IAssetPreviewProps = {
        asset: null,
        controlsEnabled: true,
    };

    constructor(props: IAssetPreviewProps) {
        super(props);

        this.state = {
            loaded: false,
            hasError: false,
        };
    }

    public componentDidUpdate(prevProps: Readonly<IAssetPreviewProps>) {
        if (this.props.asset.id !== prevProps.asset.id) {
            this.setState({
                loaded: false,
                hasError: false,
            });

            if (this.props.onAssetChanged) {
                this.props.onAssetChanged(this.props.asset);
            }
        }
    }

    public render() {
        const { loaded, hasError } = this.state;
        const { size } = this.props.asset;
        const classNames = ["asset-preview"];
        if (size) {
            if (size.width > size.height) {
                classNames.push("landscape");
            } else {
                classNames.push("portrait");
            }
        }

        return (
            <div className={classNames.join(" ")}>
                <div className="asset-preview-container">
                    {!loaded &&
                        <div className="asset-loading">
                            <div className="asset-loading-spinner">
                                <Spinner size={SpinnerSize.small} />
                            </div>
                        </div>
                    }
                    {this.props.asset.isRunningOCR &&
                        <div className="asset-loading">
                            <div className="asset-loading-ocr-spinner">
                                <Label className="p-0" ></Label>
                                <Spinner size={SpinnerSize.small} label="Running Layout..." ariaLive="off" labelPosition="right" />
                            </div>
                        </div>
                    }
                    {this.props.asset.isRunningAutoLabeling &&
                        <div className="asset-loading">
                            <div className="asset-loading-ocr-spinner">
                                <Label className="p-0" ></Label>
                                <Spinner size={SpinnerSize.small} label="Auto Labeling..." ariaLive="off" labelPosition="right" />
                            </div>
                        </div>
                    }
                    {hasError &&
                        <div className="asset-error text-danger">
                            <i className="fas fa-2x fa-exclamation-circle" />
                            <p className="m-2">{strings.editorPage.assetError}</p>
                        </div>
                    }
                    {!hasError &&
                        this.renderAsset()
                    }
                </div>
            </div>
        );
    }

    private renderAsset = () => {
        const { asset } = this.props;

        switch (asset.type) {
            case AssetType.Image:
                return <ImageAsset asset={asset}
                    onLoaded={this.onAssetLoad}
                    onError={this.onError}
                    onActivated={this.props.onActivated}
                    onDeactivated={this.props.onDeactivated} />;
            case AssetType.TIFF:
                return <TiffAsset asset={asset}
                    onLoaded={this.onAssetLoad}
                    onError={this.onError}
                    onActivated={this.props.onActivated}
                    onDeactivated={this.props.onDeactivated} />;
            case AssetType.PDF:
                return <PDFAsset asset={asset}
                    onLoaded={this.onAssetLoad}
                    onError={this.onError}
                    onActivated={this.props.onActivated}
                    onDeactivated={this.props.onDeactivated} />;
            default:
                return <div className="asset-error">{strings.editorPage.assetError}</div>;
        }
    }

    /**
     * Internal event handler for when the referenced asset has been loaded
     * @param contentSource The visual HTML element of the asset (img/video tag)
     */
    private onAssetLoad = (asset: IAsset, contentSource: ContentSource) => {
        this.setState({
            loaded: true,
        }, () => {
            if (this.props.onLoaded) {
                this.props.onLoaded(this.props.asset, contentSource);
            }
        });
    }

    private onError = (e: SyntheticEvent) => {
        this.setState({
            hasError: true,
            loaded: true,
        }, () => {
            if (this.props.onError) {
                this.props.onError(e);
            }
        });
    }
}
