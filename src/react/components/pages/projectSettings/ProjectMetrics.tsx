import React, {Component} from "react";
import _ from "lodash";
import {
    AssetState, IAsset, IAssetMetadata,
    IProject, IRegion, ITag, IPoint, AssetType,
} from "../../../../models/applicationState";
import { AssetService } from "../../../../services/assetService";
import { strings, interpolate } from "../../../../common/strings";
import {
    RadialChart, XYPlot, ArcSeries, Sunburst, Hint, DiscreteColorLegend,
    HorizontalGridLines, XAxis, YAxis, VerticalBarSeries, LabelSeries
} from "react-vis";
import "react-vis/dist/styles/radial-chart.scss";
import "react-vis/dist/styles/plot.scss";
import "./projectSettingsPage.scss";

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
    sourceDocuments: IAsset[];
    projectAssetsMetadata: IAssetMetadata[];
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
    };

    public async componentDidMount() {
        this.setState({
            loading: true,
        });

        await this.getAssetsAndMetadata();
        window.addEventListener("resize", this.refresh);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.refresh);
    }

    public render() {
        return (
            <div className="condensed-list bg-darker-2">
                <h6 className="condensed-list-header bg-darker-4 p-2">
                    <i className="fas fa-chart-bar mr-1" />
                    <span>{strings.projectMetrics.title}</span>
                </h6>
                <div className="condensed-list-body">
                    {this.state.loading &&
                    <div className="loading">
                        <i className="fas fa-circle-notch fa-spin fa-2x" />
                    </div>
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
    }

    private buildValue(hoveredCell) {
        const { radius, angle, angle0 } = hoveredCell;
        const truedAngle = (angle + angle0) / 2;
        return {
            x: radius * Math.cos(truedAngle),
            y: radius * Math.sin(truedAngle),
        };
    }

    private renderMetrics() {
        const sourceDocumentsCount = this.getSourceAssetCount();
        const taggedDocumentsCount = this.getTaggedAssetCount();
        const visitedDocumentsCount = this.getVisitedAssetsCount();
        // console.log("# sourceDocumentsCount:", sourceDocumentsCount)
        // console.log("# taggedDocumentsCount:",taggedDocumentsCount)
        // console.log("# visitedDocumentsCount:",visitedDocumentsCount)

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
                <p className="my-1">
                    {strings.projectMetrics.totalAssetCount}:
                    <strong className="px-1 project-settings-page-metrics-total-asset-count">{sourceDocumentsCount}</strong><br />
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
                        hideRootNode={true}
                    >
                        {hoveredCell ? (
                            <Hint value={this.buildValue(hoveredCell)}>
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
                    <p className="my-1">
                        {strings.projectMetrics.avgTagCountPerAsset}:
                        <strong className="px-1 metric-avg-tag-count">{this.getAverageTagCount()}</strong>
                    </p>
                    <h4 className="mt-4 mb-2">Tags occurrence in project</h4>
                    <XYPlot className="tag-chart"
                            margin={{ bottom: 200 }}
                            xType="ordinal"
                            colorType="literal"
                            width={500}
                            height={400}>
                        <HorizontalGridLines />
                        <XAxis tickLabelAngle={-30} />
                        <YAxis />
                        <VerticalBarSeries
                            data={tagChartData}
                        />
                        <LabelSeries
                            className="vertical-bars-labels"
                            data={tagChartData}
                            getLabel={d => d.y}/>

                    </XYPlot>
                </div>
            </div>
        );
    }

    private async getAssetsAndMetadata() {
        const assetService = new AssetService(this.props.project);
        const sourceDocuments = await assetService.getAssets();

        const assetsMap = this.props.project.assets;
        const assets = _.values(assetsMap);
        const projectAssetsMetadata = await assets.mapAsync((asset) => assetService.getAssetMetadata(asset));

        this.setState({
            loading: false,
            sourceDocuments,
            projectAssetsMetadata,
        });
    }

    /**
     * Count the number of tagged documents
     */
    private getTaggedAssetCount = () => {
        const metaData = this.state.projectAssetsMetadata;
        const taggedDocuments = metaData.filter((m) => m.asset.state === AssetState.Tagged);
        return taggedDocuments.length;
    }

    /**
     * Count the avg number of assigned tags in document
     */
    private getAverageTagCount = () => {
        const taggedDocumentsCount = this.getTaggedAssetCount();

        if (taggedDocumentsCount === 0) {
            return 0;
        }

        const documentCount = this.getSourceAssetCount()
        const tags = this.getAllTagReferences();
        const totalAssignedTagsInProject = (tags) => {
            let total = 0;
            tags.forEach((tag)=> total += tag.documentCount)
            return total;
        }
        return (totalAssignedTagsInProject(tags)/tags.length).toFixed(2);
    }

    /**
     * The number of visited documents
     */
    private getVisitedAssetsCount = () => {
        const metaData = this.state.projectAssetsMetadata;
        const visitedDocuments = metaData.filter((m) => m.asset.state === AssetState.Visited || m.asset.state === AssetState.Tagged);
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
     * Total number of source assets in the project
     */
    private getSourceAssetCount = () => {
        const assets = this.state.projectAssetsMetadata.map((e) => e.asset.name);
        const projectAssetSet = new Set(this.state.sourceDocuments.map((e) => e.name).concat(assets));

        return projectAssetSet.size;
    }

    /**
     * A map of asset count per tag
     */
    private getTagsCounts = (): Map<string, { tag: ITag, count: number }> => {
        const tagReferences = this.getAllTagReferences();
        const map = new Map<string, { tag: ITag, count: number }>();

        this.props.project.tags.forEach((tag) => {
            if (!map.get(tag.name)) {
                map.set(tag.name, { tag, count: tag.documentCount });
            }
        });

        return map;
    }

    private getAllTags = (): ITag[] => {
        const tags = [];
        this.props.project.tags.forEach((tag) => {
            tags.push(tag)
        });
        return _.flatten<string>(tags)
    }

    /**
     * Retrieve the list of tags assigned
     */
    private getAllTagReferences = (): string[] => {
        const tags = this.getAllTags();
        const assignedTags = [];
        tags.forEach((tag) => {
            if (tag.documentCount) {
                assignedTags.push(tag)
            }
        });
        return _.flatten<string>(assignedTags);
    }
}

