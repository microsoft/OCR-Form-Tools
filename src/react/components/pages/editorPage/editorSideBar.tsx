// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { AutoSizer, List } from "react-virtualized";
import { FontIcon } from "@fluentui/react";
import { IAsset, AssetState, ISize, AssetLabelingState } from "../../../../models/applicationState";
import { AssetPreview, ContentSource } from "../../common/assetPreview/assetPreview";
import { strings } from "../../../../common/strings";
import _ from "lodash";

/**
 * Properties for Editor Side Bar
 * @member assets - Array of assets to be previewed
 * @member onAssetSelected - Function to call when asset from side bar is selected
 * @member selectedAsset - Asset initially selected
 * @member thumbnailSize - The size of the asset thumbnails
 */
export interface IEditorSideBarProps {
    assets: IAsset[];
    onAssetSelected: (asset: IAsset) => void;
    onBeforeAssetSelected?: () => boolean;
    onAssetLoaded?: (asset: IAsset, ContentSource: ContentSource) => void;
    selectedAsset?: IAsset;
    thumbnailSize?: ISize;
}

/**
 * State for Editor Side Bar
 * @member selectedAsset - Asset selected from side bar
 */
export interface IEditorSideBarState {
    scrollToIndex: number;
}

/**
 * @name - Editor Side Bar
 * @description - Side bar for editor page
 */
export default class EditorSideBar extends React.Component<IEditorSideBarProps, IEditorSideBarState> {
    public state: IEditorSideBarState = {
        scrollToIndex: this.props.selectedAsset
            ? this.props.assets
                .findIndex((asset) => asset.id === this.props.selectedAsset.id)
            : 0,
    };

    private listRef: React.RefObject<List> = React.createRef();

    public render() {
        return (
            <div className="editor-page-sidebar-nav">
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            ref={this.listRef}
                            className="asset-list"
                            height={height}
                            width={width}
                            rowCount={this.props.assets.length}
                            rowHeight={() => this.getRowHeight(width)}
                            rowRenderer={this.rowRenderer}
                            overscanRowCount={10}
                            scrollToIndex={this.state.scrollToIndex}
                        />
                    )}
                </AutoSizer>
            </div>
        );
    }

    public componentDidUpdate(prevProps: IEditorSideBarProps) {
        if (prevProps.thumbnailSize !== this.props.thumbnailSize) {
            this.listRef.current.recomputeRowHeights();
        }

        if (!prevProps.selectedAsset && !this.props.selectedAsset) {
            return;
        }

        if ((!prevProps.selectedAsset && this.props.selectedAsset) ||
            prevProps.selectedAsset.id !== this.props.selectedAsset.id) {
            this.selectAsset(this.props.selectedAsset);
        }
    }

    private getRowHeight = (width: number) => {
        return width / (4 / 3) + 16;
    }

    private selectAsset = (selectedAsset: IAsset): void => {
        const scrollToIndex = this.props.assets.findIndex((asset) => asset.id === selectedAsset.id);

        this.setState({
            scrollToIndex,
        }, () => {
            this.listRef.current.forceUpdateGrid();
        });
    }

    private onAssetClicked = (asset: IAsset): void => {
        if (this.props.onBeforeAssetSelected) {
            if (!this.props.onBeforeAssetSelected()) {
                return;
            }
        }

        this.selectAsset(asset);
        this.props.onAssetSelected(asset);
    }

    private rowRenderer = ({ key, index, style }): JSX.Element => {
        const asset = this.props.assets[index];
        const selectedAsset = this.props.selectedAsset;

        return (
            <div key={asset.id} style={style} role="row"
                className={this.getAssetCssClassNames(asset, selectedAsset)}
                onClick={() => this.onAssetClicked(asset)}>
                <div className="asset-item-image" role="gridcell">
                    {this.renderBadges(asset)}
                    <AssetPreview asset={asset} onLoaded={this.props.onAssetLoaded} />
                </div>
                <div className="asset-item-metadata" role="rowheader">
                    <span className="asset-filename" title={asset.name}>
                        {asset.name.slice(asset.name.lastIndexOf("/") + 1, asset.name.length)}
                    </span>
                    {asset.size &&
                        <span>
                            {asset.size.width} x {asset.size.height}
                        </span>
                    }
                </div>
            </div>
        );
    }

    private renderBadges = (asset: IAsset): JSX.Element => {
        const getBadgeTaggedClass = (state: AssetLabelingState): string => {
            return state ? `badge-tagged-${AssetLabelingState[state]}` : "";
        };
        const getBadgeTaggedIcon=(labelingState:AssetLabelingState)=>{
            switch(labelingState){
                case AssetLabelingState.AutoLabeled:
                    return(
                        <FontIcon iconName="AutoEnhanceOn" />
                    );
                case AssetLabelingState.AutoLabeledAndAdjusted:
                    return(
                        <FontIcon iconName="AutoEnhanceOff" />
                    );
                case AssetLabelingState.Trained:
                    return(
                        <FontIcon iconName="MachineLearning" />
                    );
                default:
                    return(
                        <FontIcon iconName="Tag" />
                    )
            }
        }
        switch (asset.state) {
            case AssetState.Tagged:
                return (
                    <span title={_.capitalize(_.lowerCase(AssetLabelingState[asset.labelingState]))}
                        className={["badge", "badge-tagged", getBadgeTaggedClass(asset.labelingState)].join(" ")}>
                        {getBadgeTaggedIcon(asset.labelingState)}
                    </span>
                );
            case AssetState.Visited:
                return (
                    <span title={strings.editorPage.visited}
                        className="badge badge-visited">
                        <FontIcon iconName="View" />
                    </span>
                );
            default:
                return null;
        }
    }

    private getAssetCssClassNames = (asset: IAsset, selectedAsset: IAsset = null): string => {
        const cssClasses = ["asset-item"];
        if (selectedAsset && selectedAsset.id === asset.id) {
            cssClasses.push("selected");
        }

        return cssClasses.join(" ");
    }
}
