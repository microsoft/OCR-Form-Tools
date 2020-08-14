// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import _ from "lodash";
import {
    AssetState, IAssetMetadata, IProject, ITag,
} from "../../../../models/applicationState";
import { strings, interpolate } from "../../../../common/strings";
import {
    XYPlot, Sunburst, Hint, DiscreteColorLegend,
    HorizontalGridLines, XAxis, YAxis, VerticalBarSeries, LabelSeries
} from "react-vis";
import "react-vis/dist/styles/radial-chart.scss";
import "react-vis/dist/styles/plot.scss";
import "./projectSettingsPage.scss";
import { Spinner } from "@fluentui/react";
/**
 * Required properties for Project Metrics
 * @member project - Current project to fill metrics table
 */
export interface IProjectMetricsProps {
    project: IProject;
}

export interface IProjectMetricsState {
    loading: boolean;
    hoveredCell: any;
    projectAssetsMetadata: IAssetMetadata[];
    metricsContainerWidth: number;
}

/**
 * @name - Project Form
 * @description -
 */
export default class ProjectMetrics extends Component<IProjectMetricsProps, IProjectMetricsState> {
    public state = {
        loading: true,
        hoveredCell: null,
        sourceDocuments: [],
        projectAssetsMetadata: [],
        metricsContainerWidth: 0,
    };

    public async componentDidMount() {
        this.setState({ loading: true });
        await this.getAssetsAndMetadata();
        this.getMetricsContainerWidth();
        window.addEventListener("resize", this.refresh);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.refresh);
    }

    public render() {
        return (
            <div className="condensed-list bg-darker-2 project-settings-page-metrics">
                <h6 className="condensed-list-header bg-darker-4 p-2">
                    <i className="fas fa-chart-bar mr-1" />
                    <span>{strings.projectMetrics.title}</span>
                </h6>
                <div className="condensed-list-body">
                    {this.state.loading &&
                        <Spinner
                            className="loading"
                            label={strings.projectMetrics.loading}
                        />
                    }
                    {!this.state.loading &&
                        this.renderMetrics()
                    }
                </div>
            </div>
        );
    }

    private refresh = () => {
        this.forceUpdate();
        this.getMetricsContainerWidth();
    }

    private static buildValue(hoveredCell) {
        const { radius, angle, angle0 } = hoveredCell;
        const truedAngle = (angle + angle0) / 2;
        return {
            x: radius * Math.cos(truedAngle),
            y: radius * Math.sin(truedAngle),
        };
    }

    private getMetricsContainerWidth = () => {
        const container = document.getElementsByClassName("project-settings-page-metrics")[0];
        if (container) {
            return this.setState({ metricsContainerWidth: container.clientWidth })
        }
    };

    private renderMetrics() {
        const sourceDocumentsCount = this.getSourceDocumentsCount();
        const taggedDocumentsCount = this.getTaggedDocumentsCount();
        const visitedDocumentsCount = this.getVisitedDocumentsCount();
        const assetChartSize = window.innerWidth >= 1920 ? 300 : 200;

        const assetChartData = {
            animation: true,
            title: "asset-count",
            children: [
                {
                    title: interpolate(strings.projectMetrics.visitedAssets, { count: visitedDocumentsCount }),
                    children: [
                        {
                            title: interpolate(strings.projectMetrics.taggedAssets, { count: taggedDocumentsCount }),
                            bigness: 1,
                            children: [],
                            clr: "#70c400",
                            size: taggedDocumentsCount,
                            dontRotateLabel: true,
                        },
                        {
                            bigness: 1,
                            children: [],
                            clr: "#ff8c00",
                            title: interpolate(strings.projectMetrics.nonTaggedAssets,
                                { count: visitedDocumentsCount - taggedDocumentsCount }),
                            size: visitedDocumentsCount - taggedDocumentsCount,
                            dontRotateLabel: true,
                        },
                    ],
                    clr: "#4894fe",
                    dontRotateLabel: true,
                },
                {
                    title: interpolate(strings.projectMetrics.nonVisitedAssets,
                        { count: sourceDocumentsCount - visitedDocumentsCount }),
                    bigness: 1,
                    children: [],
                    clr: "#e81123",
                    dontRotateLabel: true,
                    labelStyle: {
                        fontSize: 15,
                        fontWeight: "bold",
                    },
                    size: sourceDocumentsCount - visitedDocumentsCount,
                },
            ],
        };

        const tagChartData = [];
        this.getTagsCounts().forEach((value) => {
            tagChartData.push({
                x: value.tag.name,
                y: value.count,
                color: value.tag.color,
            });
        });

        const { hoveredCell } = this.state;

        const legend = [
            {
                title: interpolate(strings.projectMetrics.visitedAssets,
                    { count: visitedDocumentsCount }),
                color: "#4894fe",
            },
            {
                title: interpolate(strings.projectMetrics.nonVisitedAssets,
                    { count: sourceDocumentsCount - visitedDocumentsCount }),
                color: "#e81123",
            },
            {
                title: interpolate(strings.projectMetrics.taggedAssets, { count: taggedDocumentsCount }),
                color: "#70c400",
            },
            {
                title: interpolate(strings.projectMetrics.nonTaggedAssets,
                    { count: visitedDocumentsCount - taggedDocumentsCount }),
                color: "#ff8c00",
            }];

        return (
            <div className="m-3">
                <h4>{strings.projectMetrics.assetsSectionTitle}</h4>
                <p className="mb-1">
                    {strings.projectMetrics.totalAssetCount}:
                    <strong className="px-1">{sourceDocumentsCount}</strong><br />
                </p>
                <div className="asset-chart">
                    <Sunburst
                        data={assetChartData}
                        style={{ stroke: "#fff" }}
                        onValueMouseOver={(v) =>
                            this.setState({ hoveredCell: v.x && v.y ? v : null })
                        }
                        onValueMouseOut={(v) => this.setState({ hoveredCell: null })}
                        height={assetChartSize}
                        margin={{ top: 25, bottom: 25, left: 25, right: 25 }}
                        getLabel={(d) => d.name}
                        getSize={(d) => d.size}
                        getColor={(d) => d.clr}
                        width={assetChartSize}
                        padAngle={() => 0.05}
                        hideRootNode={true}>
                        {hoveredCell ? (
                            <Hint value={ProjectMetrics.buildValue(hoveredCell)}>
                                <div className="hint-content">
                                    <div className="hint-content-box" style={{ background: hoveredCell.clr }} />
                                    <span className="px-2">{hoveredCell.title}</span>
                                </div>
                            </Hint>
                        ) : null}
                    </Sunburst>
                    <DiscreteColorLegend items={legend} />
                </div>
                <div className="mt-4">
                    <h4>{strings.projectMetrics.tagsSectionTitle}</h4>
                    <p className="my-1">
                        {strings.projectMetrics.totalTagCount}:
                        <strong className="px-1 metric-total-tag-count">{this.props.project.tags.length}</strong>
                    </p>
                    {/*<p className="my-1">*/}
                    {/*    {strings.projectMetrics.totalRegionCount}:*/}
                    {/*    <strong className="px-1 metric-total-region-count">{this.getRegionsCount()}</strong>*/}
                    {/*</p>*/}
                    <p className="my-1">{strings.projectMetrics.totalAssignedTags}:
                        <strong className="px-1 metric-avg-tag-count">{this.getAllAssignedTags().length}</strong>
                    </p>
                    <p className="my-1">
                        {strings.projectMetrics.avgTagCountPerAsset}:
                        <strong className="px-1 metric-avg-tag-count">{this.getAverageTagCount()}</strong>
                    </p>
                    <h4 className="mt-4 mb-2">{strings.projectMetrics.tagOccurrence}</h4>
                    <XYPlot className="tag-chart"
                        margin={{ bottom: 300, left: 100 }}
                        xType="ordinal"
                        colorType="literal"
                        width={this.state.metricsContainerWidth ? this.state.metricsContainerWidth * 0.95 : 400}
                        height={500}
                    >
                        <HorizontalGridLines />
                        <XAxis tickLabelAngle={-30} />
                        <YAxis />
                        <VerticalBarSeries
                            data={tagChartData}
                            animation={{ noWobble: 10 }}
                        />
                        <LabelSeries
                            style={{ fontSize: "70%" }}
                            className="vertical-bars-labels"
                            data={tagChartData}
                            getLabel={d => d.y} />

                    </XYPlot>
                </div>
            </div>
        );
    }

    private async getAssetsAndMetadata() {
        this.setState({
            loading: false,
            projectAssetsMetadata: _.values(this.props.project.assets),
        });
    }

    /**
     * Count the number of tagged documents
     */
    private getTaggedDocumentsCount = () => {
        const metaData = this.state.projectAssetsMetadata;
        const taggedDocuments = metaData.filter((m) => m.state === AssetState.Tagged);
        return taggedDocuments.length;
    }

    /**
     * Count the avg number of assigned tags in document
     */
    private getAverageTagCount = () => {
        const taggedDocumentsCount = this.getTaggedDocumentsCount();

        if (taggedDocumentsCount === 0) {
            return 0;
        }

        const documentsCount = this.getSourceDocumentsCount()
        const tags = this.getAllAssignedTags();
        const totalAssignedTagsInProject = (tags) => {
            let total = 0;
            tags.forEach((tag) => total += tag.documentCount);
            return total;
        }
        return ((totalAssignedTagsInProject(tags) / documentsCount)).toFixed(2);
    }

    /**
     * The number of visited documents
     */
    private getVisitedDocumentsCount = () => {
        const metaData = this.state.projectAssetsMetadata;
        const visitedDocuments = metaData.filter((m) => m.state === AssetState.Visited || m.state === AssetState.Tagged);
        return visitedDocuments.length
    }

    /**
     * Total regions drawn on all documents
     */
    // private getRegionsCount = () => {
    //     const regions = this.getRegions();
    //     return regions.length;
    // }

    /**
     * Total number of source documents in the project
     */
    private getSourceDocumentsCount = () => {
        return Object.keys(this.props.project.assets).length;
    }

    /**
     * A map of assets count per tag
     */
    private getTagsCounts = (): Map<string, { tag: ITag, count: number }> => {
        const allAssignedTags = this.getAllAssignedTags();
        const map = new Map<string, { tag: ITag, count: number }>();

        allAssignedTags.forEach((tag: any) => {
            if (!map.get(tag.name)) {
                map.set(tag.name, { tag, count: tag.documentCount });
            }
        });

        return map;
    }

    private getAllTags = (): ITag[] => {
        return this.props.project.tags;
    }

    /**
     * Retrieve the list of tags assigned
     */
    private getAllAssignedTags = (): string[] => {
        const tags = this.getAllTags();
        const assignedTags = [];
        tags.forEach((tag) => {
            if (tag.documentCount) {
                assignedTags.push(tag)
            }
        });
        return assignedTags;
    }
}

