// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    DefaultButton, FontIcon, IconButton,
    ISelection, ITooltipHostStyles, PrimaryButton, Selection,
    SelectionMode, Separator, Spinner, SpinnerSize, TooltipHost
} from "@fluentui/react";
import axios from "axios";
import _ from "lodash";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import url from "url";
import { constants } from "../../../../common/constants";
import { interpolate, strings } from "../../../../common/strings";
import { getPrimaryGreenTheme, getPrimaryGreyTheme, getPrimaryWhiteTheme, getRightPaneDefaultButtonTheme, } from "../../../../common/themes";
import { AppError, ErrorCode, IApplicationState, IAppSettings, IConnection, IProject, IRecentModel, AnalyzedTagsMode } from "../../../../models/applicationState";
import { getAPIVersion } from "../../../../common/utils";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import ServiceHelper from "../../../../services/serviceHelper";
import { getAppInsights } from '../../../../services/telemetryService';
import Alert from "../../common/alert/alert";
import Confirm from "../../common/confirm/confirm";
import { DocumentFilePicker } from "../../common/documentFilePicker/documentFilePicker";
import { ImageMap } from "../../common/imageMap/imageMap";
import { PageRange } from "../../common/pageRange/pageRange";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { CanvasCommandBar } from "../editorPage/canvasCommandBar";
import { TableView } from "../editorPage/tableView";
import { ILoadFileHelper, ILoadFileResult, LoadFileHelper } from "../prebuiltPredict/LoadFileHelper";
import { ITableHelper, ITableState, TableHelper } from "../prebuiltPredict/tableHelper";
import PredictModelInfo from './predictModelInfo';
import "./predictPage.scss";
import PredictResult, { IAnalyzeModelInfo, ITableResultItem } from "./predictResult";
import RecentModelsView from "./recentModelsView";
import { UploadToTrainingSetView } from "./uploadToTrainingSetView";
import RegionalTable from "../../common/regionalTable/regionalTable";

pdfjsLib.GlobalWorkerOptions.workerSrc = constants.pdfjsWorkerSrc(pdfjsLib.version);

export interface IPredictPageProps extends RouteComponentProps, React.Props<PredictPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IPredictPageState extends ILoadFileResult, ITableState {
    couldNotGetRecentModel: boolean;
    selectionIndexTracker: number;
    selectedRecentModelIndex: number;
    loadingRecentModel: boolean;
    showRecentModelsView: boolean;
    inputedLocalFile: string;
    sourceOption: string;
    isFetching: boolean;
    fetchedFileURL: string;
    inputedFileURL: string;
    predictionResult: any;
    analyzeResult: any;
    fileLabel: string;
    predictionLoaded: boolean;
    fileChanged: boolean;
    predictRun: boolean;
    isPredicting: boolean;
    file?: File;
    fileLoaded?: boolean;
    highlightedField: string;
    modelList: IModel[];
    modelOption: string;
    confirmDuplicatedAssetNameMessage?: string;
    imageAngle: number;
    viewTable?: boolean;
    viewRegionalTable?: boolean;
    regionalTableToView?: any;
    tableToView?: any;
    tableTagColor?: string;
    highlightedTableCellRowKey?: string;
    highlightedTableCellColumnKey?: string;

    withPageRange: boolean;
    pageRange: string;
    pageRangeIsValid?: boolean;
}

export interface IModel {
    modelId: string;
    createdDateTime: string;
    lastUpdatedDateTime: string;
    status: string;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        connections: state.connections,
        appSettings: state.appSettings,
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
        appTitleActions: bindActionCreators(appTitleActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class PredictPage extends React.Component<IPredictPageProps, IPredictPageState> {
    private appInsights: any = null;
    private tableHelper: ITableHelper = new TableHelper(this);
    private fileHelper: ILoadFileHelper = new LoadFileHelper();

    public state: IPredictPageState = {
        couldNotGetRecentModel: false,
        selectionIndexTracker: -1,
        selectedRecentModelIndex: -1,
        loadingRecentModel: true,
        showRecentModelsView: false,
        sourceOption: "localFile",
        isFetching: false,
        fetchedFileURL: "",
        inputedFileURL: strings.predict.defaultURLInput,
        inputedLocalFile: strings.predict.defaultLocalFileInput,
        predictionResult: {},
        analyzeResult: {},
        fileLabel: "",
        predictionLoaded: true,
        currentPage: 1,
        numPages: 1,
        imageUri: null,
        imageWidth: 0,
        imageHeight: 0,
        shouldShowAlert: false,
        alertTitle: "",
        alertMessage: "",
        fileChanged: false,
        predictRun: false,
        isPredicting: false,
        highlightedField: "",
        modelList: [],
        modelOption: "",
        imageAngle: 0,
        viewTable: false,
        viewRegionalTable: false,
        regionalTableToView: null,
        tableTagColor: null,
        highlightedTableCellRowKey: null,
        highlightedTableCellColumnKey: null,

        tableIconTooltip: { display: "none", width: 0, height: 0, top: 0, left: 0 },
        hoveringFeature: null,
        tableToView: null,
        tableToViewId: null,

        withPageRange: false,
        pageRange: ""
    };

    private analyzeResults: any;
    private selectionHandler: ISelection;
    private imageMap: ImageMap;
    private uploadToTrainingSetView: React.RefObject<UploadToTrainingSetView> = React.createRef();
    private duplicateAssetNameConfirm: React.RefObject<Confirm> = React.createRef();

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            await this.loadProject(projectId);
        }
        this.appInsights = getAppInsights();
        document.title = strings.predict.title + " - " + strings.appName;
    }

    public async componentDidUpdate(_prevProps: IPredictPageProps, prevState: IPredictPageState) {
        const onPredictPage = (new RegExp("predict$")).test(this.props.match.url)
        if (!onPredictPage) {
            return; // don't update if not on the predict page
        }

        if (!this.props.project) {
            const projectId = this.props.match.params["projectId"];
            if (projectId) {
                await this.loadProject(projectId);
            }
        }

        if (this.props.project?.predictModelId && !this.props.project?.recentModelRecords &&
            !this.state.couldNotGetRecentModel) {
            await this.updateRecentModels(this.props.project)
        }
        if (this.props.project?.recentModelRecords && this.props.project?.predictModelId &&
            this.state.selectedRecentModelIndex === -1) {
            this.updateRecentModelsViewer(this.props.project);
        } else if (this.state.loadingRecentModel) {
            this.setState({ loadingRecentModel: false });
        }

        if (this.state.file) {
            if (this.state.fileChanged && !this.state.isFetching) {
                this.loadFile(this.state.file);
                this.analyzeResults = undefined;
            } else if (prevState.currentPage !== this.state.currentPage) {

                this.fileHelper.loadPage(this.state.currentPage).then((res: any) => {
                    if (res) {
                        this.setState({ ...res });
                    }
                });
            }
            if (this.getOcrFromAnalyzeResult(this.state.analyzeResult).length > 0 &&
                prevState.imageUri !== this.state.imageUri) {
                this.drawPredictionResult();
            }

            if (prevState.highlightedField !== this.state.highlightedField) {
                this.setPredictedFieldHighlightStatus(this.state.highlightedField);
            }

            if (prevState.highlightedTableCellColumnKey !== this.state.highlightedTableCellColumnKey ||
                prevState.highlightedTableCellRowKey !== this.state.highlightedTableCellRowKey) {
                this.setPredictedFieldTableCellHighlightStatus(this.state.highlightedTableCellRowKey, this.state.highlightedTableCellColumnKey)
            }
        }
    }

    getPredictDisabled = () => {
        return this.state.isPredicting || !this.state.file ||
            this.state.invalidFileFormat ||
            !this.state.fileLoaded ||
            (this.state.withPageRange && !this.state.pageRangeIsValid);
    }

    public render() {
        const mostRecentModel = this.props.project?.recentModelRecords?.[this.state.selectedRecentModelIndex];
        const browseFileDisabled: boolean = !this.state.predictionLoaded;
        const predictDisabled: boolean = this.getPredictDisabled();

        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);
        const modelInfo: IAnalyzeModelInfo = this.getAnalyzeModelInfo(this.state.analyzeResult);

        const onPredictionPath: boolean = this.props.match.path.includes("predict");
        const sidebarWidth = this.state.viewRegionalTable ? 650 : 400;

        let tagViewMode: AnalyzedTagsMode;
        if (this.state.loadingRecentModel) {
            tagViewMode = AnalyzedTagsMode.LoadingRecentModel;
        } else if (this.state.viewRegionalTable) {
            tagViewMode = AnalyzedTagsMode.ViewTable;
        } else {
            tagViewMode = AnalyzedTagsMode.default;
        }

        return (
            <div
                className={`predict skipToMainContent ${onPredictionPath ? "" : "hidden"} `}
                id="pagePredict"
                style={{ display: `${onPredictionPath ? "flex" : "none"}` }} >
                <div className="predict-main">
                    {this.state.file && this.state.imageUri && this.renderImageMap()}
                    {this.renderPrevPageButton()}
                    {this.renderNextPageButton()}
                    {this.renderPageIndicator()}
                </div>
                <div className={"predict-sidebar bg-lighter-1"} style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
                    <div className="condensed-list">
                        <h6 className="condensed-list-header bg-darker-2 p-2 flex-center">
                            <FontIcon className="mr-1" iconName="Insights" />
                            <span>{strings.predict.title}</span>
                        </h6>
                        {tagViewMode === AnalyzedTagsMode.default &&
                            <>
                                {!mostRecentModel ?
                                    <div className="bg-darker-2 pl-3 pr-3 flex-center ">
                                        <div className="alert alert-warning warning no-models-warning" role="alert">
                                            {strings.predict.noRecentModels}
                                        </div>
                                    </div> :
                                    <>
                                        <div className="bg-darker-2 pl-3 pr-3 flex-center model-selection-container">
                                            <div>
                                                <h5 className="model-selection-header">
                                                    {strings.predict.selectModelHeader}
                                                </h5>
                                                <table>
                                                    <tbody>
                                                        <tr>
                                                            <td className="model-selection-info-header p-0" >
                                                                <span className="model-selection-info-key">
                                                                    {strings.predict.modelIDPrefix}
                                                                </span>
                                                                <span title={mostRecentModel.modelInfo.modelId} className="model-selection-info-value">
                                                                    {mostRecentModel.modelInfo.modelId}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            {mostRecentModel.modelInfo.modelName &&
                                                                <td className="model-selection-info-header p-0" >
                                                                    <span className="model-selection-info-key">
                                                                        {strings.predict.modelNamePrefix}
                                                                    </span>
                                                                    <span title={mostRecentModel.modelInfo.modelName} className="model-selection-info-value">
                                                                        {mostRecentModel.modelInfo.modelName}
                                                                    </span>
                                                                </td>
                                                            }
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <DefaultButton
                                                className="keep-button-80px"
                                                theme={getRightPaneDefaultButtonTheme()}
                                                text="Change"
                                                onClick={() => { this.setState({ showRecentModelsView: true }) }}
                                                disabled={!mostRecentModel || browseFileDisabled}
                                            />
                                        </div>
                                        <div className="p-3" style={{ marginTop: "8px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <h5>
                                                    {strings.predict.downloadScript}
                                                </h5>
                                                <PrimaryButton
                                                    className="keep-button-80px"
                                                    theme={getPrimaryGreenTheme()}
                                                    text="Download"
                                                    allowDisabledFocus
                                                    autoFocus={true}
                                                    onClick={this.handleDownloadClick}
                                                />
                                            </div>
                                            <Separator className="separator-right-pane-main">or</Separator>
                                            <h5>
                                                {strings.predict.uploadFile}
                                            </h5>
                                            <DocumentFilePicker
                                                disabled={this.state.isFetching || this.state.isPredicting}
                                                onFileChange={(data) => this.onFileChange(data)}
                                                onSelectSourceChange={() => this.onSelectSourceChange()}
                                                onError={(err) => this.onFileLoadError(err)} />
                                            {this.props.project.apiVersion === constants.prebuiltServiceVersion && this.props.match.path !== "/projects/:projectId/predict" &&
                                                <div className="page-range-section">
                                                    <PageRange
                                                        disabled={this.state.isFetching || this.state.isPredicting}
                                                        withPageRange={this.state.withPageRange}
                                                        pageRange={this.state.pageRange}
                                                        onPageRangeChange={this.onPageRangeChange} />
                                                </div>}
                                        </div>
                                        <Separator className="separator-right-pane-main">{strings.predict.analysis}</Separator>
                                        <div className="p-3" style={{ marginTop: "8px" }}>
                                            <div className="container-items-end predict-button">
                                                <PrimaryButton
                                                    theme={getPrimaryWhiteTheme()}
                                                    iconProps={{ iconName: "Insights" }}
                                                    text={strings.predict.runAnalysis}
                                                    aria-label={!this.state.predictionLoaded ? strings.predict.inProgress : ""}
                                                    allowDisabledFocus
                                                    disabled={predictDisabled}
                                                    onClick={this.handleClick}
                                                />
                                            </div>
                                            {this.state.isFetching &&
                                                <div className="loading-container">
                                                    <Spinner
                                                        label="Fetching..."
                                                        ariaLive="assertive"
                                                        labelPosition="right"
                                                        size={SpinnerSize.large}
                                                    />
                                                </div>
                                            }
                                            {this.state.isPredicting &&
                                                <div className="loading-container">
                                                    <Spinner
                                                        label={strings.predict.inProgress}
                                                        ariaLive="assertive"
                                                        labelPosition="right"
                                                        size={SpinnerSize.large}
                                                    />
                                                </div>
                                            }
                                            {Object.keys(predictions).length > 0 && this.props.project &&
                                                <PredictResult
                                                    downloadPrefix="Analyze"
                                                    predictions={predictions}
                                                    analyzeResult={this.analyzeResults}
                                                    page={this.state.currentPage}
                                                    tags={this.props.project.tags}
                                                    downloadResultLabel={this.state.fileLabel}
                                                    onAddAssetToProject={this.onAddAssetToProjectClick}
                                                    onPredictionClick={this.onPredictionClick}
                                                    onPredictionMouseEnter={this.onPredictionMouseEnter}
                                                    onPredictionMouseLeave={this.onPredictionMouseLeave}
                                                    onTablePredictionClick={this.onTablePredictionClick}
                                                >
                                                    <PredictModelInfo modelInfo={modelInfo} />
                                                </PredictResult>
                                            }
                                            <UploadToTrainingSetView
                                                showOption={!this.props.appSettings.hideUploadingOption}
                                                ref={this.uploadToTrainingSetView}
                                                onConfirm={this.onAddAssetToProject} />
                                            {
                                                (Object.keys(predictions).length === 0 && this.state.predictRun) &&
                                                <div>
                                                    No field can be extracted.
                                                </div>
                                            }
                                            <Confirm
                                                ref={this.duplicateAssetNameConfirm}
                                                title={strings.predict.confirmDuplicatedAssetName.title}
                                                message={this.state.confirmDuplicatedAssetNameMessage}
                                                onConfirm={this.onAddAssetToProjectConfirm}
                                                confirmButtonTheme={getPrimaryGreenTheme()}
                                            />
                                        </div>
                                    </>
                                }
                            </>
                        }
                        {tagViewMode === AnalyzedTagsMode.LoadingRecentModel &&
                            <Spinner className="loading-tag" size={SpinnerSize.large} />
                        }
                        {this.state.viewRegionalTable &&
                            <div className="m-2">
                                <h4 className="ml-1 mb-4">View analyzed Table</h4>
                                <RegionalTable
                                    regionalTableToView={this.state.regionalTableToView}
                                    tableTagColor={this.state.tableTagColor}
                                    onMouseEnter={this.onMouseEnter}
                                    onMouseLeave={this.onMouseLeave}
                                />
                                <PrimaryButton
                                    className="mt-4 ml-2"
                                    theme={getPrimaryGreyTheme()}
                                    onClick={() => this.setState({ viewRegionalTable: false })}>Back</PrimaryButton>
                            </div>
                        }
                    </div>
                </div>
                <Alert
                    show={this.state.shouldShowAlert}
                    title={this.state.alertTitle}
                    message={this.state.alertMessage}
                    onClose={() => this.setState({
                        shouldShowAlert: false,
                        alertTitle: "",
                        alertMessage: "",
                        predictionLoaded: true,
                    })}
                />
                <PreventLeaving
                    when={this.state.isPredicting}
                    message={"A prediction operation is currently in progress, are you sure you want to leave?"}
                />
                {mostRecentModel && this.state.showRecentModelsView &&
                    <RecentModelsView
                        selectedIndex={this.state.selectionIndexTracker}
                        selectionHandler={this.selectionHandler}
                        onCancel={this.handleRecentModelsViewClose}
                        onApply={this.handleRecentModelsApply}
                        recentModels={this.props.project.recentModelRecords}
                    />
                }
            </div>
        );
    }

    onPageRangeChange = (withPageRange: boolean, pageRange: string) => {
        this.setState({ withPageRange, pageRange });
    }

    onFileChange(data: {
        file: File,
        fileLabel: string,
        fetchedFileURL: string
    }): void {
        this.setState({
            currentPage: 1,
            ...data,
            analyzeResult: null,
            predictionLoaded: false,
            fileLoaded: false,
            fileChanged: true,
        }, () => {
            this.imageMap?.removeAllFeatures();
        });
    }


    onSelectSourceChange(): void {
        this.setState({
            inputedFileURL: strings.predict.defaultURLInput,
            inputedLocalFile: strings.predict.defaultLocalFileInput,
            fileLabel: "",
            currentPage: undefined,
            analyzeResult: {},
            fileChanged: true,
            file: undefined,
            predictRun: false,
            isFetching: false,
            fetchedFileURL: "",
            predictionLoaded: true,
            imageUri: null,
            imageWidth: 0,
            imageHeight: 0,
            shouldShowAlert: false,
            alertTitle: "",
            alertMessage: "",
            isPredicting: false,
            highlightedField: "",
        }, () => {
            this.imageMap?.removeAllFeatures();
        });

    }

    onFileLoadError(err: { alertTitle: string; alertMessage: string; }): void {
        this.setState({
            ...err,
            shouldShowAlert: true,
            predictionLoaded: false,
        });
    }

    private renderPrevPageButton = () => {
        const prevPage = () => {
            this.setState((prevState) => ({
                currentPage: Math.max(1, prevState.currentPage - 1),
            }), () => {
                this.imageMap?.removeAllFeatures();
            });
        };

        if (this.state.currentPage > 1) {
            return (
                <IconButton
                    className="toolbar-btn prev"
                    title="Previous"
                    iconProps={{ iconName: "ChevronLeft" }}
                    onClick={prevPage}
                />
            );
        } else {
            return <div></div>;
        }
    }

    private renderNextPageButton = () => {
        const { currentPage, numPages } = this.state;
        const nextPage = () => {
            this.setState((prevState) => ({
                currentPage: Math.min(prevState.currentPage + 1, numPages),
            }), () => {
                this.imageMap?.removeAllFeatures();
            });
        };

        if (currentPage < numPages) {
            return (
                <IconButton
                    className="toolbar-btn next"
                    title="Next"
                    onClick={nextPage}
                    iconProps={{ iconName: "ChevronRight" }}
                />
            );
        } else {
            return <div></div>;
        }
    }
    private renderPageIndicator = () => {
        const { numPages } = this.state;
        return numPages > 1 ?
            <p className="page-number">
                Page {this.state.currentPage} of {numPages}
            </p> : <div></div>;
    }

    private renderImageMap = () => {
        const hostStyles: Partial<ITooltipHostStyles> = {
            root: {
                position: "absolute",
                top: this.state.tableIconTooltip.top,
                left: this.state.tableIconTooltip.left,
                width: this.state.tableIconTooltip.width,
                height: this.state.tableIconTooltip.height,
                display: this.state.tableIconTooltip.display,
            },
        };
        return (
            <div style={{ width: "100%", height: "100%" }}>
                <CanvasCommandBar
                    handleZoomIn={this.handleCanvasZoomIn}
                    handleZoomOut={this.handleCanvasZoomOut}
                    handleRotateImage={this.handleRotateCanvas}
                    project={this.props.project}
                    showActionMenu={false}
                    layers={{}}
                />
                <ImageMap
                    initEditorMap={true}
                    ref={(ref) => {
                        this.imageMap = ref;
                        this.tableHelper.setImageMap(ref);
                    }}
                    imageUri={this.state.imageUri || ""}
                    imageWidth={this.state.imageWidth}
                    imageHeight={this.state.imageHeight}
                    imageAngle={this.state.imageAngle}
                    featureStyler={this.featureStyler}
                    onMapReady={this.noOp}
                    tableBorderFeatureStyler={this.tableHelper.tableBorderFeatureStyler}
                    tableIconFeatureStyler={this.tableHelper.tableIconFeatureStyler}
                    tableIconBorderFeatureStyler={this.tableHelper.tableIconBorderFeatureStyler}
                    handleTableToolTipChange={this.tableHelper.handleTableToolTipChange}
                />
                <TooltipHost
                    content={"rows: " + this.state.tableIconTooltip.rows +
                        " columns: " + this.state.tableIconTooltip.columns}
                    id="tableInfo"
                    styles={hostStyles}
                >
                    <div
                        aria-describedby="tableInfo"
                        className="tooltip-container"
                        onClick={this.handleTableIconFeatureSelect}
                    />
                </TooltipHost>
                {this.state.tableToView !== null &&
                    <TableView
                        handleTableViewClose={this.handleTableViewClose}
                        tableToView={this.state.tableToView}
                    />
                }
            </div>
        );
    }

    private handleTableIconFeatureSelect = () => {
        if (this.state.hoveringFeature != null) {
            const tableState = this.imageMap.getTableBorderFeatureByID(this.state.hoveringFeature).get("state");
            if (tableState === "hovering" || tableState === "rest") {
                this.tableHelper.setTableToView(this.tableHelper.getTable(this.state.currentPage, this.state.hoveringFeature),
                    this.state.hoveringFeature);
            } else {
                this.closeTableView("hovering");
            }
        }
    }

    private handleTableViewClose = () => {
        this.closeTableView("rest");
    }

    private closeTableView = (state: string) => {
        if (this.state.tableToView) {
            this.tableHelper.setTableState(this.state.tableToViewId, state);
            this.setState({
                tableToView: null,
                tableToViewId: null,
            });
        }
    }

    private handleCanvasZoomIn = () => {
        this.imageMap.zoomIn();
    }

    private handleCanvasZoomOut = () => {
        this.imageMap.zoomOut();
    }

    private handleRotateCanvas = (degrees: number) => {
        this.setState({ imageAngle: this.state.imageAngle + degrees });
    }

    private handleClick = () => {
        this.setState({ predictionLoaded: false, isPredicting: true });
        this.getPrediction()
            .then((result) => {
                this.analyzeResults = _.cloneDeep(result);
                this.tableHelper.setAnalyzeResult(result?.analyzeResult);
                this.setState({
                    predictionResult: result,
                    analyzeResult: result?.analyzeResult,
                    predictionLoaded: true,
                    predictRun: true,
                    isPredicting: false,
                }, () => {
                    this.drawPredictionResult();
                });
            })
            .catch((error) => {
                let alertMessage = "";
                if (error.response) {
                    alertMessage = error.response.data;
                } else if (error.errorCode === ErrorCode.PredictWithoutTrainForbidden) {
                    alertMessage = strings.errors.predictWithoutTrainForbidden.message;
                } else if (error.errorCode === ErrorCode.ModelNotFound) {
                    alertMessage = error.message;
                } else if (error.code) {
                    alertMessage = `${error.message}, code ${error.code}`;
                } else {
                    alertMessage = interpolate(strings.errors.endpointConnectionError.message, { endpoint: "form recognizer backend URL" });
                }
                this.setState({
                    shouldShowAlert: true,
                    alertTitle: "Prediction Failed",
                    alertMessage,
                    isPredicting: false,
                });
            });
        if (this.appInsights) {
            this.appInsights.trackEvent({ name: "ANALYZE_EVENT" });
        }
    }

    private handleDownloadClick = () => {
        this.triggerDownload();
    }

    private async triggerDownload(): Promise<any> {
        axios.get("/analyze.py").then((response) => {
            const modelID = this.props.project?.recentModelRecords?.[this.state.selectedRecentModelIndex].modelInfo.modelId;
            if (!modelID) {
                throw new AppError(
                    ErrorCode.PredictWithoutTrainForbidden,
                    strings.errors.predictWithoutTrainForbidden.message,
                    strings.errors.predictWithoutTrainForbidden.title);
            }
            const endpointURL = this.props.project.apiUriBase as string;
            const apiKey = this.props.project.apiKey as string;
            const analyzeScript = response.data.replace(/<endpoint>|<subscription_key>|<model_id>|<API_version>/gi,
                (matched: string) => {
                    switch (matched) {
                        case "<endpoint>":
                            return endpointURL;
                        case "<subscription_key>":
                            return apiKey;
                        case "<model_id>":
                            return modelID;
                        case "<API_version>":
                            return getAPIVersion(this.props.project?.apiVersion);

                    }
                });
            const fileURL = window.URL.createObjectURL(
                new Blob([analyzeScript]));
            const fileLink = document.createElement("a");
            const fileBaseName = "analyze";
            const downloadFileName = fileBaseName + "-" + modelID.substring(0, 4) + ".py";

            fileLink.href = fileURL;
            fileLink.setAttribute("download", downloadFileName);
            document.body.appendChild(fileLink);
            fileLink.click();

        }).catch((error) => {
            let alertMessage = "";
            if (error.response) {
                alertMessage = error.response.data;
            } else if (error.errorCode === ErrorCode.PredictWithoutTrainForbidden) {
                alertMessage = strings.errors.predictWithoutTrainForbidden.message;
            } else if (error.errorCode === ErrorCode.ModelNotFound) {
                alertMessage = error.message;
            } else {
                alertMessage = interpolate(strings.errors.endpointConnectionError.message, { endpoint: "form recognizer backend URL" });
            }
            this.setState({
                shouldShowAlert: true,
                alertTitle: "Download failed",
                alertMessage,
                isPredicting: false,
            });
        });
    }

    private async getPrediction(): Promise<any> {
        const modelID = this.props.project?.recentModelRecords?.[this.state.selectedRecentModelIndex].modelInfo.modelId;
        if (!modelID) {
            throw new AppError(
                ErrorCode.PredictWithoutTrainForbidden,
                strings.errors.predictWithoutTrainForbidden.message,
                strings.errors.predictWithoutTrainForbidden.title);
        }
        const apiVersion = getAPIVersion(this.props.project?.apiVersion);
        let endpointURL = url.resolve(
            this.props.project.apiUriBase,
            `${interpolate(constants.apiModelsPath, { apiVersion })}/${modelID}/analyze?includeTextDetails=true`,
        );
        if (this.state.withPageRange && this.state.pageRangeIsValid) {
            endpointURL += `&${constants.pages}=${this.state.pageRange}`;
        }
        const headers = { "Content-Type": this.state.file ? this.state.file.type : "application/json", "cache-control": "no-cache" };
        const body = this.state.file ?? { source: this.state.fetchedFileURL };
        let response;
        try {
            response = await ServiceHelper.postWithAutoRetry(
                endpointURL, body, { headers }, this.props.project.apiKey as string);
        } catch (err) {
            if (err.response?.status === 404) {
                throw new AppError(
                    ErrorCode.ModelNotFound,
                    interpolate(strings.errors.modelNotFound.message, { modelID })
                );
            } else {
                ServiceHelper.handleServiceError({ ...err, endpoint: endpointURL });
            }
        }

        const operationLocation = response.headers["operation-location"];

        // Make the second REST API call and get the response.
        return this.poll(() =>
            ServiceHelper.getWithAutoRetry(
                operationLocation, { headers }, this.props.project.apiKey as string), 120000, 500);
    }

    private loadFile = (file: File) => {
        this.setState({ isFetching: true });
        this.fileHelper.loadFile(file).then((res: ILoadFileResult) => {
            if (res) {
                this.setState({
                    ...res,
                    isFetching: false,
                    fileChanged: false
                });
            }
        });
    }

    private createBoundingBoxVectorFeature = (text, boundingBox, imageExtent, ocrExtent) => {
        const coordinates: number[][] = [];

        // extent is int[4] to represent image dimentions: [left, bottom, right, top]
        const imageWidth = imageExtent[2] - imageExtent[0];
        const imageHeight = imageExtent[3] - imageExtent[1];
        const ocrWidth = ocrExtent[2] - ocrExtent[0];
        const ocrHeight = ocrExtent[3] - ocrExtent[1];

        for (let i = 0; i < boundingBox.length; i += 2) {
            coordinates.push([
                Math.round((boundingBox[i] / ocrWidth) * imageWidth),
                Math.round((1 - (boundingBox[i + 1] / ocrHeight)) * imageHeight),
            ]);
        }

        const feature = new Feature({
            geometry: new Polygon([coordinates]),
        });
        const tag = this.props.project.tags.find((tag) => tag.name.toLocaleLowerCase() === text.toLocaleLowerCase());
        const isHighlighted = (text.toLocaleLowerCase() === this.state.highlightedField.toLocaleLowerCase());
        feature.setProperties({
            color: _.get(tag, "color", "#333333"),
            fieldName: text,
            isHighlighted,
        });

        return feature;
    }

    private createBoundingBoxVectorFeatureForTableCell = (text, boundingBox, imageExtent, ocrExtent, rowKey, columnKey) => {
        const coordinates: number[][] = [];

        // extent is int[4] to represent image dimentions: [left, bottom, right, top]
        const imageWidth = imageExtent[2] - imageExtent[0];
        const imageHeight = imageExtent[3] - imageExtent[1];
        const ocrWidth = ocrExtent[2] - ocrExtent[0];
        const ocrHeight = ocrExtent[3] - ocrExtent[1];

        for (let i = 0; i < boundingBox.length; i += 2) {
            coordinates.push([
                Math.round((boundingBox[i] / ocrWidth) * imageWidth),
                Math.round((1 - (boundingBox[i + 1] / ocrHeight)) * imageHeight),
            ]);
        }

        const feature = new Feature({
            geometry: new Polygon([coordinates]),
        });
        const tag = this.props.project.tags.find((tag) => tag.name.toLocaleLowerCase() === text.toLocaleLowerCase());
        const isHighlighted = (text.toLocaleLowerCase() === this.state.highlightedField.toLocaleLowerCase() ||
            (this.state.highlightedTableCellRowKey === rowKey && this.state.highlightedTableCellColumnKey === columnKey));
        feature.setProperties({
            color: _.get(tag, "color", "#333333"),
            fieldName: text,
            isHighlighted,
            rowKey,
            columnKey,
        });

        return feature;
    }

    private featureStyler = (feature) => {
        return new Style({
            stroke: new Stroke({
                color: feature.get("color"),
                width: feature.get("isHighlighted") ? 4 : 2,
            }),
            fill: new Fill({
                color: "rgba(255, 255, 255, 0)",
            }),
        });
    }

    // here
    private drawPredictionResult = (): void => {
        this.imageMap?.removeAllFeatures();
        const features = [];
        const imageExtent = [0, 0, this.state.imageWidth, this.state.imageHeight];
        const ocrForCurrentPage: any = this.getOcrFromAnalyzeResult(this.state.analyzeResult)[this.state.currentPage - 1];
        const ocrExtent = [0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height];
        const fields = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);

        Object.keys(fields).forEach((fieldName) => {
            const field = fields[fieldName];
            if (!field) {
                return;
            }
            if (field?.type === "object" && field.valueObject) {
                Object.keys(field?.valueObject).forEach((rowName, rowIndex) => {
                    if (field?.valueObject?.[rowName]) {
                        Object.keys(field?.valueObject?.[rowName]?.valueObject).forEach((columnName, colIndex) => {
                            const tableCell = field?.valueObject?.[rowName]?.valueObject?.[columnName];
                            if (tableCell?.page === this.state.currentPage) {
                                const text = fieldName;
                                const boundingbox = _.get(tableCell, "boundingBox", []);
                                const feature = this.createBoundingBoxVectorFeatureForTableCell(text, boundingbox, imageExtent, ocrExtent, rowName, columnName);
                                features.push(feature);
                            }
                        })
                    }
                })
            }
            else if (field.type === "array" && field.valueArray) {
                field?.valueArray.forEach((row, rowIndex) => {
                    Object.keys(row?.valueObject).forEach((columnName, colIndex) => {
                        const tableCell = field?.valueArray?.[rowIndex]?.valueObject?.[columnName];
                        if (tableCell?.page === this.state.currentPage) {
                            const text = fieldName;
                            const boundingbox = _.get(tableCell, "boundingBox", []);
                            const feature = this.createBoundingBoxVectorFeatureForTableCell(text, boundingbox, imageExtent, ocrExtent, "#" + rowIndex, columnName);
                            features.push(feature);
                        }
                    })
                })
            }
            else {
                if (_.get(field, "page", null) === this.state.currentPage) {
                    const text = fieldName;
                    const boundingbox = _.get(field, "boundingBox", []);
                    const feature = this.createBoundingBoxVectorFeature(text, boundingbox, imageExtent, ocrExtent);
                    features.push(feature);
                }
            }
        });
        this.imageMap?.addFeatures(features);
        this.tableHelper.drawTables(this.state.currentPage);
    }

    /**
     * Poll function to repeatly check if request succeeded
     * @param func - function that will be called repeatly
     * @param timeout - timeout
     * @param interval - interval
     */
    private poll = (func, timeout, interval): Promise<any> => {
        const endTime = Number(new Date()) + (timeout || 10000);
        interval = interval || 100;

        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then((response) => {
                if (response.data.status.toLowerCase() === constants.statusCodeSucceeded) {
                    resolve(response.data);
                    // prediction response from API
                } else if (response.data.status.toLowerCase() === constants.statusCodeFailed) {
                    reject(_.get(
                        response,
                        "data.analyzeResult.errors[0]",
                        "Generic error during prediction"));
                } else if (Number(new Date()) < endTime) {
                    // If the request isn't succeeded and the timeout hasn't elapsed, go again
                    setTimeout(checkSucceeded, interval, resolve, reject);
                } else {
                    // Didn't succeeded after too much time, reject
                    reject("Timed out, please try other file.");
                }
            });
        };

        return new Promise(checkSucceeded);
    }

    private getPredictionsFromAnalyzeResult(analyzeResult: any) {
        const fields = _.get(analyzeResult?.analyzeResult ? analyzeResult?.analyzeResult : analyzeResult, "documentResults[0].fields", {});
        return fields;
    }

    private getAnalyzeModelInfo(analyzeResult) {
        const { modelId, docType, docTypeConfidence } = _.get(analyzeResult, "documentResults[0]", {})
        return { modelId, docType, docTypeConfidence };
    }

    private getOcrFromAnalyzeResult(analyzeResult: any) {
        return _.get(analyzeResult?.analyzeResult ? analyzeResult?.analyzeResult : analyzeResult, "readResults", []);
    }

    private noOp = () => {
        // no operation
    }
    private onAddAssetToProjectClick = async () => {
        if (this.state.file) {
            const fileName = `${this.props.project.folderPath}/${decodeURIComponent(this.state.file.name)}`;
            const asset = Object.values(this.props.project.assets).find(asset => asset.name === fileName);
            if (asset) {
                const confirmDuplicatedAssetNameMessage = interpolate(strings.predict.confirmDuplicatedAssetName.message, { name: decodeURI(this.state.file.name) });
                this.setState({
                    confirmDuplicatedAssetNameMessage
                });
                this.duplicateAssetNameConfirm.current.open();
            }
            else {
                this.onAddAssetToProjectConfirm();
            }
        }
    }

    private onAddAssetToProjectConfirm = async () => {
        if (this.props.appSettings.hideUploadingOption) {
            this.uploadToTrainingSetView.current.open();
            await this.onAddAssetToProject();
            this.uploadToTrainingSetView.current.close();
        } else {
            this.uploadToTrainingSetView.current.open();
        }
    }

    private onAddAssetToProject = async () => {
        if (this.state.file) {
            const fileData = Buffer.from(await this.state.file.arrayBuffer());
            const fileName = decodeURIComponent(this.state.file.name).split("/").pop();
            await this.props.actions.addAssetToProject(this.props.project, fileName, fileData, this.state.predictionResult);
            this.props.history.push(`/projects/${this.props.project.id}/edit`);
        }
    }

    private onPredictionClick = (predictedItem: any) => {
        const targetPage = predictedItem.page;
        if (Number.isInteger(targetPage) && targetPage !== this.state.currentPage) {
            this.setState({
                currentPage: targetPage,
                highlightedField: predictedItem.fieldName ?? "",
            });
        }
    }
    private onTablePredictionClick = (predictedItem: ITableResultItem, tagColor: string) => {
        this.setState({ viewRegionalTable: true, regionalTableToView: predictedItem, tableTagColor: tagColor });
    }

    private onPredictionMouseEnter = (predictedItem: any) => {
        this.setState({
            highlightedField: predictedItem.fieldName ?? "",
        });
    }

    private onPredictionMouseLeave = (predictedItem: any) => {
        this.setState({
            highlightedField: "",
        });
    }

    private setPredictedFieldHighlightStatus = (highlightedField: string) => {
        const features = this.imageMap.getAllFeatures();
        for (const feature of features) {
            if (feature.get("fieldName").toLocaleLowerCase() === highlightedField.toLocaleLowerCase()) {
                feature.set("isHighlighted", true);
            } else {
                feature.set("isHighlighted", false);
            }
        }
    }

    private setPredictedFieldTableCellHighlightStatus = (highlightedTableCellRowKey: string, highlightedTableCellColumnKey: string) => {
        const features = this.imageMap.getAllFeatures();
        for (const feature of features) {
            if (highlightedTableCellRowKey && highlightedTableCellColumnKey && feature.get("rowKey")?.toLocaleLowerCase() === highlightedTableCellRowKey?.toLocaleLowerCase() &&
                feature.get("columnKey")?.toLocaleLowerCase() === highlightedTableCellColumnKey?.toLocaleLowerCase()) {
                feature.set("isHighlighted", true);
            } else {
                feature.set("isHighlighted", false);
            }
        }
    }

    private handleModelSelection = () => {
        const selectedIndex = this.getSelectedIndex();
        if (selectedIndex !== this.state.selectionIndexTracker) {
            this.setState({ selectionIndexTracker: selectedIndex })
        }
    }

    private handleRecentModelsViewClose = () => {
        this.setState({ showRecentModelsView: false });
        const selectedIndex = this.getSelectedIndex();
        if (selectedIndex !== this.state.selectedRecentModelIndex) {
            this.selectionHandler.setIndexSelected(this.state.selectedRecentModelIndex, true, true);
        }
    }

    private handleRecentModelsApply = async () => {
        const selectedIndex = this.selectionHandler.getSelectedIndices()[0];
        this.setState({
            selectedRecentModelIndex: selectedIndex,
            showRecentModelsView: false,
        });
    }

    private async getRecentModelFromPredictModelId(): Promise<any> {
        const modelID = this.props.project.predictModelId;
        const apiVersion = getAPIVersion(this.props.project?.apiVersion);
        const endpointURL = url.resolve(
            this.props.project.apiUriBase,
            `${interpolate(constants.apiModelsPath, { apiVersion })}/${modelID}`,
        );
        let response;
        try {
            response = await axios.get(endpointURL,
                { headers: { [constants.apiKeyHeader]: this.props.project.apiKey as string } })
                .catch((err) => {
                    const status = err.response.status;
                    if (status === 401) {
                        this.setState({
                            couldNotGetRecentModel: true,
                            shouldShowAlert: true,
                            alertTitle: "Failed to get recent model",
                            alertMessage: "Permission denied. Check API key",
                        });
                    } else {
                        this.setState({
                            couldNotGetRecentModel: true,
                        });
                    }
                })
        } catch {
            this.setState({
                couldNotGetRecentModel: true,
                shouldShowAlert: true,
                alertTitle: "Failed to get recent model",
                alertMessage: "Check network and service URI in project settings",
            });
        }
        if (!response) {
            return;
        }
        response = response["data"];
        return {
            modelInfo: {
                createdDateTime: response["modelInfo"]["createdDateTime"],
                modelId: response["modelInfo"]["modelId"],
                modelName: response["modelInfo"]["modelName"],
                isComposed: response["modelInfo"]["attributes"]["isComposed"],
            }
        } as IRecentModel;
    }

    private getSelectedIndex(): number {
        const selectedIndexArray = this.selectionHandler.getSelectedIndices();
        return selectedIndexArray.length > 0 ? selectedIndexArray[0] : -1;
    }

    private async updateRecentModelsViewer(project) {
        this.selectionHandler = new Selection({
            selectionMode: SelectionMode.single,
            onSelectionChanged: this.handleModelSelection,
        })
        const recentModelRecordsWithKey = [];
        let predictModelIndex;
        project.recentModelRecords.forEach((model: IRecentModel, index) => {
            if (model.modelInfo.modelId === project.predictModelId) {
                predictModelIndex = index
            }
            recentModelRecordsWithKey[index] = Object.assign({ key: index }, model);
        })
        this.selectionHandler.setItems(recentModelRecordsWithKey, false);
        this.selectionHandler.setIndexSelected(predictModelIndex, true, false);
        this.setState({
            loadingRecentModel: false,
            selectedRecentModelIndex: predictModelIndex,
            selectionIndexTracker: predictModelIndex
        });
    }

    private async updateRecentModels(project) {
        const recentModel = await this.getRecentModelFromPredictModelId();
        if (!recentModel) {
            return;
        }
        const recentModelRecords: IRecentModel[] = [recentModel]
        project = await this.props.actions.saveProject({
            ...project,
            recentModelRecords,
        }, false, false);
    }

    private async loadProject(projectId: string) {
        const project = this.props.recentProjects.find((project) => project.id === projectId);
        if (project) {
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }
    }

    private onMouseEnter = (rowName: string, columnName: string) => {
        this.setState({ highlightedTableCellRowKey: rowName, highlightedTableCellColumnKey: columnName });
    }

    private onMouseLeave = () => {
        this.setState({ highlightedTableCellRowKey: null, highlightedTableCellColumnKey: null });
    }
}
