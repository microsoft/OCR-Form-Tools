// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import {
    FontIcon, Selection, PrimaryButton, Spinner, SpinnerSize, IconButton, TextField, IDropdownOption,
    Dropdown, DefaultButton, Separator, ISelection, SelectionMode
} from "@fluentui/react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import "./predictPage.scss";
import {
    IApplicationState, IConnection, IProject, IAppSettings, AppError, ErrorCode, IRecentModel,
} from "../../../../models/applicationState";
import { ImageMap } from "../../common/imageMap/imageMap";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import PredictResult from "./predictResult";
import _ from "lodash";
import pdfjsLib from "pdfjs-dist";
import Alert from "../../common/alert/alert";
import url from "url";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import { strings, interpolate } from "../../../../common/strings";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import ServiceHelper from "../../../../services/serviceHelper";
import { parseTiffData, renderTiffToCanvas, loadImageToCanvas } from "../../../../common/utils";
import { constants } from "../../../../common/constants";
import { getPrimaryGreenTheme, getPrimaryWhiteTheme,
         getGreenWithWhiteBackgroundTheme,
         getRightPaneDefaultButtonTheme} from "../../../../common/themes";
import axios from "axios";
import { IAnalyzeModelInfo } from './predictResult';
import RecentModelsView from "./recentModelsView";

pdfjsLib.GlobalWorkerOptions.workerSrc = constants.pdfjsWorkerSrc(pdfjsLib.version);
const cMapUrl = constants.pdfjsCMapUrl(pdfjsLib.version);

export interface IPredictPageProps extends RouteComponentProps, React.Props<PredictPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IPredictPageState {
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
    analyzeResult: {};
    fileLabel: string;
    predictionLoaded: boolean;
    currPage: number;
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    shouldShowAlert: boolean;
    alertTitle: string;
    alertMessage: string;
    fileChanged: boolean;
    predictRun: boolean;
    isPredicting: boolean;
    file?: File;
    highlightedField: string;
    modelList: IModel[];
    modelOption: string;
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
        analyzeResult: {},
        fileLabel: "",
        predictionLoaded: true,
        currPage: undefined,
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
    };

    private selectionHandler: ISelection;
    private fileInput: React.RefObject<HTMLInputElement> = React.createRef();
    private currPdf: any;
    private tiffImages: any[];
    private imageMap: ImageMap;

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            await this.loadProject(projectId);
        }
        document.title = strings.predict.title + " - " + strings.appName;
    }

    public async componentDidUpdate(prevProps, prevState) {
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
            this.setState({loadingRecentModel: false});
        }

        if (this.state.file) {
            if (this.state.fileChanged) {
                this.currPdf = null;
                this.tiffImages = [];
                this.loadFile(this.state.file);
                this.setState({ fileChanged: false });
            } else if (prevState.currPage !== this.state.currPage) {
                if (this.currPdf !== null) {
                    this.loadPdfPage(this.currPdf, this.state.currPage);
                } else if (this.tiffImages.length !== 0) {
                    this.loadTiffPage(this.tiffImages, this.state.currPage);
                }
            } else if (this.getOcrFromAnalyzeResult(this.state.analyzeResult).length > 0 &&
                prevState.imageUri !== this.state.imageUri) {
                this.imageMap.removeAllFeatures();
                this.drawPredictionResult();
            }

            if (prevState.highlightedField !== this.state.highlightedField) {
                this.setPredictedFieldHighlightStatus(this.state.highlightedField);
            }
        }
    }

    public render() {
        const mostRecentModel = this.props.project?.recentModelRecords?.[this.state.selectedRecentModelIndex];
        const browseFileDisabled: boolean = !this.state.predictionLoaded;
        const urlInputDisabled: boolean = !this.state.predictionLoaded || this.state.isFetching;
        const predictDisabled: boolean = !this.state.predictionLoaded || !this.state.file;
        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);
        const modelInfo: IAnalyzeModelInfo = this.getAnalyzeModelInfo(this.state.analyzeResult);
        const fetchDisabled: boolean =
            !this.state.predictionLoaded ||
            this.state.isFetching ||
            this.state.inputedFileURL.length === 0 ||
            this.state.inputedFileURL === strings.predict.defaultURLInput;

        const sourceOptions: IDropdownOption[] = [
            { key: "localFile", text: "Local file" },
            { key: "url", text: "URL" },
        ];

        const onPredictionPath: boolean = this.props.match.path.includes("predict");

        return (
            <div
                className={`predict skipToMainContent ${onPredictionPath ? "" : "hidden"} `}
                id="pagePredict"
                style={{ display: `${onPredictionPath ? "flex" : "none"}` }} >
                <div className="predict-main">
                    {this.state.file && this.state.imageUri && this.renderImageMap()}
                    {this.renderPrevPageButton()}
                    {this.renderNextPageButton()}
                </div>
                <div className="predict-sidebar bg-lighter-1">
                    <div className="condensed-list">
                        <h6 className="condensed-list-header bg-darker-2 p-2 flex-center">
                            <FontIcon className="mr-1" iconName="Insights" />
                            <span>Analyze</span>
                        </h6>
                        {!this.state.loadingRecentModel ?
                            <>
                                {!mostRecentModel ?
                                    <div className="bg-darker-2 pl-3 pr-3 flex-center" >
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
                                                <tr>
                                                    <h6 className="model-selection-info-header" >
                                                        <span className="model-selection-info-key">
                                                            {strings.predict.modelIDPrefix}
                                                        </span>
                                                        <span title={mostRecentModel.modelInfo.modelId} className="model-selection-info-value">
                                                            {mostRecentModel.modelInfo.modelId}
                                                        </span>
                                                    </h6>
                                                </tr>
                                                <tr>
                                                    {mostRecentModel.modelInfo.modelName &&
                                                        <h6 className="model-selection-info-header" >
                                                            <span className="model-selection-info-key">
                                                                {strings.predict.modelNamePrefix}
                                                            </span>
                                                            <span title={mostRecentModel.modelInfo.modelName} className="model-selection-info-value">
                                                                {mostRecentModel.modelInfo.modelName}
                                                            </span>
                                                        </h6>
                                                    }
                                                </tr>
                                            </div>
                                            <DefaultButton
                                                className="keep-button-80px"
                                                theme={getRightPaneDefaultButtonTheme()}
                                                text="Change"
                                                onClick={() => {this.setState({showRecentModelsView: true})}}
                                                disabled={!mostRecentModel || browseFileDisabled}
                                            />
                                        </div>
                                        <div className="p-3" style={{marginTop: "8px"}}>
                                            <div style={{display: "flex", justifyContent: "space-between"}}>
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
                                            <div style={{marginBottom: "3px"}}>Image source</div>
                                            <div className="container-space-between">
                                                <Dropdown
                                                    className="sourceDropdown"
                                                    selectedKey={this.state.sourceOption}
                                                    options={sourceOptions}
                                                    disabled={this.state.isPredicting || this.state.isFetching}
                                                    onChange={this.selectSource}
                                                />
                                                { this.state.sourceOption === "localFile" &&
                                                    <input
                                                        aria-hidden="true"
                                                        type="file"
                                                        accept="application/pdf, image/jpeg, image/png, image/tiff"
                                                        id="hiddenInputFile"
                                                        ref={this.fileInput}
                                                        onChange={this.handleFileChange}
                                                        disabled={browseFileDisabled}
                                                    />
                                                }
                                                { this.state.sourceOption === "localFile" &&
                                                    <TextField
                                                        className="mr-2 ml-2"
                                                        theme={getGreenWithWhiteBackgroundTheme()}
                                                        style={{cursor: (browseFileDisabled ? "default" : "pointer")}}
                                                        onClick={this.handleDummyInputClick}
                                                        readOnly={true}
                                                        aria-label={strings.predict.uploadFile}
                                                        value={this.state.inputedLocalFile}
                                                        disabled={browseFileDisabled}
                                                    />
                                                }
                                                { this.state.sourceOption === "localFile" &&
                                                    <PrimaryButton
                                                        className="keep-button-80px"
                                                        theme={getPrimaryGreenTheme()}
                                                        text="Browse"
                                                        allowDisabledFocus
                                                        disabled={browseFileDisabled}
                                                        autoFocus={true}
                                                        onClick={this.handleDummyInputClick}
                                                    />
                                                }
                                                { this.state.sourceOption === "url" &&
                                                    <TextField
                                                        className="mr-2 ml-2"
                                                        theme={getGreenWithWhiteBackgroundTheme()}
                                                        onFocus={this.removeDefaultInputedFileURL}
                                                        onChange={this.setInputedFileURL}
                                                        aria-label={strings.predict.uploadFile}
                                                        value={this.state.inputedFileURL}
                                                        disabled={urlInputDisabled}
                                                    />
                                                }
                                                { this.state.sourceOption === "url" &&
                                                    <PrimaryButton
                                                        theme={getPrimaryGreenTheme()}
                                                        className="keep-button-80px"
                                                        text="Fetch"
                                                        allowDisabledFocus
                                                        disabled={fetchDisabled}
                                                        autoFocus={true}
                                                        onClick={this.getFileFromURL}
                                                    />
                                                }
                                            </div>
                                            <div className="container-items-end predict-button">
                                                    <PrimaryButton
                                                        theme={getPrimaryWhiteTheme()}
                                                        iconProps={{ iconName: "Insights" }}
                                                        text="Run analysis"
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
                                            {!this.state.predictionLoaded &&
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
                                                    predictions={predictions}
                                                    analyzeResult={this.state.analyzeResult}
                                                    analyzeModelInfo={modelInfo}
                                                    page={this.state.currPage}
                                                    tags={this.props.project.tags}
                                                    downloadResultLabel={this.state.fileLabel}
                                                    onPredictionClick={this.onPredictionClick}
                                                    onPredictionMouseEnter={this.onPredictionMouseEnter}
                                                    onPredictionMouseLeave={this.onPredictionMouseLeave}
                                                />
                                            }
                                            {
                                                (Object.keys(predictions).length === 0 && this.state.predictRun) &&
                                                <div>
                                                    No field can be extracted.
                                                </div>
                                            }
                                        </div>
                                    </>
                                }
                            </> : <Spinner className="loading-tag" size={SpinnerSize.large}/>
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

    private handleDummyInputClick = () => {
        document.getElementById("hiddenInputFile").click();
    }

    private removeDefaultInputedFileURL = () => {
        if (this.state.inputedFileURL === strings.predict.defaultURLInput) {
            this.setState({inputedFileURL: ""});
        }
    }

    private setInputedFileURL = (event) => {
        this.setState({inputedFileURL: event.target.value});
    }

    private getFileFromURL = () => {
        this.setState({isFetching: true});
        fetch(this.state.inputedFileURL, { headers: {Accept: "application/pdf, image/jpeg, image/png, image/tiff"}})
         .then((response) => {
            if (!response.ok) {
                this.setState({
                    isFetching: false,
                    shouldShowAlert: true,
                    alertTitle: "Failed to fetch",
                    alertMessage: response.status.toString() + " " + response.statusText,
                    isPredicting: false,
                });
                return;
            }
            const contentType = response.headers.get("Content-Type");
            if (![ "application/pdf", "image/jpeg", "image/png", "image/tiff"].includes(contentType)) {
                this.setState({
                    isFetching: false,
                    shouldShowAlert: true,
                    alertTitle: "Content-Type not supported",
                    alertMessage: "Content-Type " + contentType + " not supported",
                    isPredicting: false,
                });
                return;
            }
            response.blob().then((blob) => {
                const fileAsURL = new URL(this.state.inputedFileURL);
                const fileName = fileAsURL.pathname.split("/").pop();
                const file = new File([blob], fileName, {type: contentType});
                this.setState({
                    fetchedFileURL: this.state.inputedFileURL,
                    isFetching: false,
                    fileLabel: fileName,
                    currPage: 1,
                    analyzeResult: {},
                    fileChanged: true,
                    file,
                    predictRun: false,
                }, () => {
                    if (this.imageMap) {
                        this.imageMap.removeAllFeatures();
                    }
                });
            }).catch((error) => {
                this.setState({
                    isFetching: false,
                    shouldShowAlert: true,
                    alertTitle: "Invalid data",
                    alertMessage: error,
                    isPredicting: false,
                });
                return;
            });
        }).catch(() => {
            this.setState({
                isFetching: false,
                shouldShowAlert: true,
                alertTitle: "Fetch failed",
                alertMessage: "Network error or Cross-Origin Resource Sharing (CORS) is not configured server-side",
            });
            return;
        });
    }

    private selectSource = (event, option) => {
        if (option.key !== this.state.sourceOption) {
            this.setState({
                sourceOption: option.key,
                inputedFileURL: strings.predict.defaultURLInput,
                inputedLocalFile: strings.predict.defaultLocalFileInput,
                fileLabel: "",
                currPage: undefined,
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
                if (this.imageMap) {
                    this.imageMap.removeAllFeatures();
                }
            });
        }
    }

    private renderPrevPageButton = () => {
        if (!_.get(this, "fileInput.current.files[0]", null)) {
            return <div></div>;
        }
        const prevPage = () => {
            this.setState((prevState) => ({
                currPage: Math.max(1, prevState.currPage - 1),
            }));
        };

        if (this.state.currPage > 1) {
            return (
                <IconButton
                    className="toolbar-btn prev"
                    title="Previous"
                    iconProps={{iconName: "ChevronLeft"}}
                    onClick={prevPage}
                />
            );
        } else {
            return <div></div>;
        }
    }

    private renderNextPageButton = () => {
        if (!_.get(this, "fileInput.current.files[0]", null)) {
            return <div></div>;
        }

        const numPages = this.getPageCount();
        const nextPage = () => {
            this.setState((prevState) => ({
                currPage: Math.min(prevState.currPage + 1, numPages),
            }));
        };

        if (this.state.currPage < numPages) {
            return (
                <IconButton
                    className="toolbar-btn next"
                    title="Next"
                    onClick={nextPage}
                    iconProps={{iconName: "ChevronRight"}}
                />
            );
        } else {
            return <div></div>;
        }
    }

    private renderImageMap = () => {
        return (
            <ImageMap
                ref={(ref) => this.imageMap = ref}
                imageUri={this.state.imageUri || ""}
                imageWidth={this.state.imageWidth}
                imageHeight={this.state.imageHeight}

                featureStyler={this.featureStyler}
                onMapReady={this.noOp}
            />
        );
    }

    private handleFileChange = () => {
        if (this.fileInput.current.value !== "") {
            const fileName = this.fileInput.current.value.split("\\").pop();
            if (fileName !== "") {
                this.setState({
                    inputedLocalFile: fileName,
                    fileLabel: fileName,
                    currPage: 1,
                    analyzeResult: {},
                    fileChanged: true,
                    file: this.fileInput.current.files[0],
                    predictRun: false,
                }, () => {
                    if (this.imageMap) {
                        this.imageMap.removeAllFeatures();
                    }
                });
            }
        }
    }

    private handleClick = () => {
        this.setState({ predictionLoaded: false, isPredicting: true });
        this.getPrediction()
            .then((result) => {
                this.setState({
                    analyzeResult: result,
                    predictionLoaded: true,
                    predictRun: true,
                    isPredicting: false,
                }, () => {
                    this.drawPredictionResult();
                });
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
                    alertTitle: "Prediction Failed",
                    alertMessage,
                    isPredicting: false,
                });
            });
    }

    private getPageCount() {
        if (this.currPdf !== null) {
            return _.get(this.currPdf, "numPages", 1);
        } else if (this.tiffImages.length !== 0) {
            return this.tiffImages.length;
        }

        return 1;
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
                        return constants.apiVersion;
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
        const endpointURL = url.resolve(
            this.props.project.apiUriBase,
            `${constants.apiModelsPath}/${modelID}/analyze?includeTextDetails=true`,
        );
        let headers;
        let body;
        if (this.state.sourceOption === "localFile") {
            headers = { "Content-Type": this.state.file.type, "cache-control": "no-cache" };
            body = this.state.file;
        } else {
            headers = { "Content-Type": "application/json", "cache-control": "no-cache" };
            body = { source: this.state.fetchedFileURL };
        }
        let response;
        try {
            response = await ServiceHelper.postWithAutoRetry(
                endpointURL, body, { headers }, this.props.project.apiKey as string);
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        }

        const operationLocation = response.headers["operation-location"];

        // Make the second REST API call and get the response.
        return this.poll(() =>
            ServiceHelper.getWithAutoRetry(
                operationLocation, { headers }, this.props.project.apiKey as string), 120000, 500);
    }

    private loadFile = (file: File) => {
        if (!file) {
            // no file
            return;
        }

        // determine how to load file based on MIME type of the file
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
        switch (file.type) {
            case "image/jpeg":
            case "image/png":
                this.loadImageFile(file);
                break;

            case "image/tiff":
                this.loadTiffFile(file);
                break;

            case "application/pdf":
                this.loadPdfFile(file);
                break;

            default:
                // un-supported file type
                this.setState({
                    imageUri: "",
                    shouldShowAlert: true,
                    alertTitle: "Not supported file type",
                    alertMessage: "Sorry, we currently only support JPG/PNG/PDF files.",
                });
                break;
        }
    }

    private loadImageFile = async (file: File) => {
        const imageUri = this.createObjectURL(file);
        const canvas = await loadImageToCanvas(imageUri);
        this.setState({
            currPage: 1,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: canvas.width,
            imageHeight: canvas.height,
        });
    }

    private loadTiffFile = async (file) => {
        const fileArrayBuffer = await HtmlFileReader.readFileAsArrayBuffer(file);
        this.tiffImages = parseTiffData(fileArrayBuffer);
        this.loadTiffPage(this.tiffImages, this.state.currPage);
    }

    private loadTiffPage = (tiffImages: any[], pageNumber: number) => {
        const tiffImage = tiffImages[pageNumber - 1];
        const canvas = renderTiffToCanvas(tiffImage);
        this.setState({
            currPage: pageNumber,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: tiffImage.width,
            imageHeight: tiffImage.height,
        });
    }

    private loadPdfFile = (file) => {
        const fileReader: FileReader = new FileReader();

        fileReader.onload = (e: any) => {
            const typedArray = new Uint8Array(e.target.result);
            const loadingTask = pdfjsLib.getDocument({data: typedArray, cMapUrl, cMapPacked: true});
            loadingTask.promise.then((pdf) => {
                this.currPdf = pdf;
                this.loadPdfPage(pdf, this.state.currPage);
            }, (reason) => {
                this.setState({
                    shouldShowAlert: true,
                    alertTitle: "Failed loading PDF",
                    alertMessage: reason.toString(),
                });
            });
        };

        fileReader.readAsArrayBuffer(file);
    }

    private loadPdfPage = async (pdf, pageNumber) => {
        const page = await pdf.getPage(pageNumber);
        const defaultScale = 2;
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
        await renderTask.promise;
        this.setState({
            currPage: pageNumber,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: canvas.width,
            imageHeight: canvas.height,
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

    private drawPredictionResult = (): void => {
        const features = [];
        const imageExtent = [0, 0, this.state.imageWidth, this.state.imageHeight];
        const ocrForCurrentPage: any = this.getOcrFromAnalyzeResult(this.state.analyzeResult)[this.state.currPage - 1];
        const ocrExtent = [0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height];
        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);

        for (const fieldName of Object.keys(predictions)) {
            const field = predictions[fieldName];
            if (_.get(field, "page", null) === this.state.currPage) {
                const text = fieldName;
                const boundingbox = _.get(field, "boundingBox", []);
                const feature = this.createBoundingBoxVectorFeature(text, boundingbox, imageExtent, ocrExtent);
                features.push(feature);
            }
        }
        this.imageMap.addFeatures(features);
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
                    console.log("raw data", JSON.parse(response.request.response));
                } else if (response.data.status.toLowerCase() === constants.statusCodeFailed) {
                    reject(_.get(
                        response,
                        "data.analyzeResult.errors[0].errorMessage",
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
        return _.get(analyzeResult, "analyzeResult.documentResults[0].fields", {});
    }

    private getAnalyzeModelInfo(analyzeResult) {
        const { modelId, docType, docTypeConfidence } = _.get(analyzeResult, "analyzeResult.documentResults[0]", {})
        return { modelId, docType, docTypeConfidence };
    }

    private getOcrFromAnalyzeResult(analyzeResult: any) {
        return _.get(analyzeResult, "analyzeResult.readResults", []);
    }

    private createObjectURL = (object: File) => {
        // generate a URL for the object
        return (window.URL) ? window.URL.createObjectURL(object) : "";
    }

    private noOp = () => {
        // no operation
    }

    private onPredictionClick = (predictedItem: any) => {
        const targetPage = predictedItem.page;
        if (Number.isInteger(targetPage) && targetPage !== this.state.currPage) {
            this.setState({
                currPage: targetPage,
                highlightedField: predictedItem.fieldName ?? "",
            });
        }
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
    private handleModelSelection = () => {
        const selectedIndex = this.getSelectedIndex();
        if (selectedIndex !== this.state.selectionIndexTracker) {
            this.setState({selectionIndexTracker: selectedIndex})
        }
    }

    private handleRecentModelsViewClose = () => {
        this.setState({showRecentModelsView: false});
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
        const endpointURL = url.resolve(
            this.props.project.apiUriBase,
            `${constants.apiModelsPath}/${modelID}`,
        );
        let response;
        try {
            response = await axios.get(endpointURL,
                {headers: { [constants.apiKeyHeader]: this.props.project.apiKey as string}})
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
            recentModelRecordsWithKey[index] = Object.assign({key: index}, model);
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
        await this.props.actions.loadProject(project);
        this.props.appTitleActions.setTitle(project.name);
    }
}
