// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    DefaultButton, Dropdown, FontIcon, IconButton, IDropdownOption,
    PrimaryButton,
    Spinner, SpinnerSize, TextField
} from "@fluentui/react";
import _ from "lodash";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import pdfjsLib from "pdfjs-dist";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import url from "url";
import { constants } from "../../../../common/constants";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { interpolate, strings } from "../../../../common/strings";
import {
    getGreenWithWhiteBackgroundTheme, getPrimaryGreenTheme, getPrimaryGreyTheme, getPrimaryWhiteTheme
} from "../../../../common/themes";
import { loadImageToCanvas, parseTiffData, renderTiffToCanvas } from "../../../../common/utils";
import { ErrorCode, FieldFormat, FieldType, IApplicationState, ImageMapParent, ITag } from "../../../../models/applicationState";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import ServiceHelper from "../../../../services/serviceHelper";
import { getAppInsights } from "../../../../services/telemetryService";
import Alert from "../../common/alert/alert";
import { ImageMap } from "../../common/imageMap/imageMap";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import "./prebuiltPredictPage.scss";
import PrebuiltPredictResult from "./prebuiltPredictResult";

pdfjsLib.GlobalWorkerOptions.workerSrc = constants.pdfjsWorkerSrc(pdfjsLib.version);
const cMapUrl = constants.pdfjsCMapUrl(pdfjsLib.version);

export interface IPrebuiltPredictPageProps extends RouteComponentProps {

    appTitleActions: IAppTitleActions;
}

export interface IPrebuiltPredictPageState {
    tags?: ITag[];
    inputedAPIKey?: string;
    inputedServiceURI?: string;
    showInputedAPIKey: boolean;

    inputedLocalFile: string;
    sourceOption: string;
    isFetching: boolean;
    fetchedFileURL: string;
    inputedFileURL: string;
    analyzeResult: object;
    fileLabel: string;
    predictionLoaded: boolean;
    currPage: number;
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    shouldShowAlert: boolean;
    invalidFileFormat: boolean;
    alertTitle: string;
    alertMessage: string;
    fileChanged: boolean;
    predictRun: boolean;
    isPredicting: boolean;
    file?: File;
    highlightedField: string;
    imageAngle: number;
}
function mapStateToProps(state: IApplicationState) {
    return {
    };
}

function mapDispatchToProps(dispatch) {
    return {
        appTitleActions: bindActionCreators(appTitleActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class PrebuiltPredictPage extends React.Component<IPrebuiltPredictPageProps, IPrebuiltPredictPageState> {
    private appInsights: any = null;

    public state: IPrebuiltPredictPageState = {
        inputedAPIKey: "3f1523d3ece8448eb0d16c583ce3e2a9",
        inputedServiceURI: "https://cognitiveusw2ppe.azure-api.net/",
        showInputedAPIKey: false,

        sourceOption: "localFile",
        isFetching: false,
        fetchedFileURL: "",
        inputedFileURL: strings.predict.defaultURLInput,
        inputedLocalFile: strings.predict.defaultLocalFileInput,
        analyzeResult: null,
        fileLabel: "",
        predictionLoaded: true,
        currPage: undefined,
        imageUri: null,
        imageWidth: 0,
        imageHeight: 0,
        shouldShowAlert: false,
        invalidFileFormat: false,
        alertTitle: "",
        alertMessage: "",
        fileChanged: false,
        predictRun: false,
        isPredicting: false,
        highlightedField: "",
        imageAngle: 0,
    };

    private fileInput: React.RefObject<HTMLInputElement> = React.createRef();
    private currPdf: any;
    private tiffImages: any[];
    private imageMap: ImageMap;
    private tagColors = require("../../common/tagColors.json");

    public async componentDidMount() {
        this.appInsights = getAppInsights();
        document.title = strings.predict.title + " - " + strings.appName;
        this.props.appTitleActions.setTitle(`${strings.predict.title}`);
    }

    componentDidUpdate(prevProps, prevState) {
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
        const browseFileDisabled: boolean = !this.state.predictionLoaded;
        const urlInputDisabled: boolean = !this.state.predictionLoaded || this.state.isFetching;
        const predictDisabled: boolean = !this.state.predictionLoaded || !this.state.file || this.state.invalidFileFormat;
        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);
        // const modelInfo: IAnalyzeModelInfo = this.getAnalyzeModelInfo(this.state.analyzeResult);
        const fetchDisabled: boolean =
            !this.state.predictionLoaded ||
            this.state.isFetching ||
            this.state.inputedFileURL.length === 0 ||
            this.state.inputedFileURL === strings.predict.defaultURLInput;

        const sourceOptions: IDropdownOption[] = [
            { key: "localFile", text: "Local file" },
            { key: "url", text: "URL" },
        ];

        const onPrebuiltsPath: boolean = this.props.match.path.includes("prebuilts");

        return (
            <div
                className={`predict skipToMainContent ${onPrebuiltsPath ? "" : "hidden"} `}
                id="pagePredict"
                style={{ display: `${onPrebuiltsPath ? "flex" : "none"}` }} >
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

                        <>
                            {
                                <>
                                    <div className="p-3" style={{ marginTop: "8px" }}>
                                        <h5>Service configuration</h5>
                                        <div style={{ marginBottom: "3px" }}>Form recognizer service endpoint</div>
                                        <TextField
                                            className="mb-1"
                                            theme={getGreenWithWhiteBackgroundTheme()}
                                            value={this.state.inputedServiceURI}
                                            onChange={this.setInputedServiceURI}
                                            disabled={this.state.isPredicting}
                                        />
                                        <div style={{ marginBottom: "3px" }}>API key</div>
                                        <div className="apikeyContainer">
                                            <TextField
                                                className="apikey"
                                                theme={getGreenWithWhiteBackgroundTheme()}
                                                type={this.state.showInputedAPIKey ? "text" : "password"}
                                                value={this.state.inputedAPIKey}
                                                onChange={this.setInputedAPIKey}
                                                disabled={this.state.isPredicting}
                                            />
                                            <DefaultButton
                                                className="portected-input-margin"
                                                theme={getPrimaryGreyTheme()}
                                                title={this.state.showInputedAPIKey ? "Hide" : "Show"}
                                                onClick={this.toggleAPIKeyVisibility}
                                            >
                                                <FontIcon iconName={this.state.showInputedAPIKey ? "Hide3" : "View"} />
                                            </DefaultButton>
                                            <DefaultButton
                                                theme={getPrimaryGreyTheme()}
                                                type="button"
                                                title="Copy"
                                                onClick={() => this.copyKey()}
                                            >
                                                <FontIcon iconName="Copy" />
                                            </DefaultButton>
                                        </div>
                                    </div>
                                    <div className="p-3" style={{ marginTop: "8px" }}>
                                        <h5>
                                            Upload file and run analysis
                                        </h5>
                                        <div style={{ marginBottom: "3px" }}>Image source</div>
                                        <div className="container-space-between">
                                            <Dropdown
                                                className="sourceDropdown"
                                                selectedKey={this.state.sourceOption}
                                                options={sourceOptions}
                                                disabled={this.state.isPredicting || this.state.isFetching}
                                                onChange={this.selectSource}
                                            />
                                            {this.state.sourceOption === "localFile" &&
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
                                            {this.state.sourceOption === "localFile" &&
                                                <TextField
                                                    className="mr-2 ml-2"
                                                    theme={getGreenWithWhiteBackgroundTheme()}
                                                    style={{ cursor: (browseFileDisabled ? "default" : "pointer") }}
                                                    onClick={this.handleDummyInputClick}
                                                    readOnly={true}
                                                    aria-label={strings.predict.uploadFile}
                                                    value={this.state.inputedLocalFile}
                                                    disabled={browseFileDisabled}
                                                />
                                            }
                                            {this.state.sourceOption === "localFile" &&
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
                                            {this.state.sourceOption === "url" &&
                                                <>
                                                    <TextField
                                                        className="mr-2 ml-2"
                                                        theme={getGreenWithWhiteBackgroundTheme()}
                                                        onFocus={this.removeDefaultInputedFileURL}
                                                        onChange={this.setInputedFileURL}
                                                        aria-label={strings.predict.uploadFile}
                                                        value={this.state.inputedFileURL}
                                                        disabled={urlInputDisabled}
                                                    />
                                                    <PrimaryButton
                                                        theme={getPrimaryGreenTheme()}
                                                        className="keep-button-80px"
                                                        text="Fetch"
                                                        allowDisabledFocus
                                                        disabled={fetchDisabled}
                                                        autoFocus={true}
                                                        onClick={this.getFileFromURL}
                                                    />
                                                </>
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
                                        {Object.keys(predictions).length > 0 &&
                                            <PrebuiltPredictResult
                                                predictions={predictions}
                                                analyzeResult={this.state.analyzeResult}
                                                // analyzeModelInfo={modelInfo}
                                                page={this.state.currPage}
                                                tags={this.state.tags}
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
                        </>

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
            </div>
        );
    }

    private setInputedServiceURI = (event) => {
        this.setState({ inputedServiceURI: event.target.value });
    }

    private setInputedAPIKey = (event) => {
        this.setState({ inputedAPIKey: event.target.value });
    }
    private toggleAPIKeyVisibility = () => {
        this.setState({
            showInputedAPIKey: !this.state.showInputedAPIKey,
        });
    }
    private async copyKey() {
        const clipboard = (navigator as any).clipboard;
        if (clipboard && clipboard.writeText && typeof clipboard.writeText === "function") {
            await clipboard.writeText(this.state.inputedAPIKey);
        }
    }
    private handleDummyInputClick = () => {
        document.getElementById("hiddenInputFile").click();
    }

    private removeDefaultInputedFileURL = () => {
        if (this.state.inputedFileURL === strings.predict.defaultURLInput) {
            this.setState({ inputedFileURL: "" });
        }
    }

    private setInputedFileURL = (event) => {
        this.setState({ inputedFileURL: event.target.value });
    }

    private getFileFromURL = () => {
        this.setState({ isFetching: true });
        fetch(this.state.inputedFileURL, { headers: { Accept: "application/pdf, image/jpeg, image/png, image/tiff" } })
            .then(async (response) => {
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
                if (![ "application/pdf", "image/jpeg", "image/png", "image/tiff" ].includes(contentType)) {
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
                    const file = new File([ blob ], fileName, { type: contentType });
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
                analyzeResult: null,
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
            }), () => {
                this.imageMap.removeAllFeatures();
            });
        };

        if (this.state.currPage > 1) {
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
        if (!_.get(this, "fileInput.current.files[0]", null)) {
            return <div></div>;
        }

        const numPages = this.getPageCount();
        const nextPage = () => {
            this.setState((prevState) => ({
                currPage: Math.min(prevState.currPage + 1, numPages),
            }), () => {
                this.imageMap.removeAllFeatures();
            });
        };

        if (this.state.currPage < numPages) {
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

    private renderImageMap = () => {
        return (
            <div style={{ width: "100%", height: "100%" }}>
                <ImageMap
                    parentPage={ImageMapParent.Predict}
                    ref={(ref) => this.imageMap = ref}
                    imageUri={this.state.imageUri || ""}
                    imageWidth={this.state.imageWidth}
                    imageHeight={this.state.imageHeight}
                    imageAngle={this.state.imageAngle}
                    featureStyler={this.featureStyler}
                    onMapReady={this.noOp}
                />
            </div>
        );
    }

    private handleFileChange = () => {
        if (this.fileInput.current.value !== "") {
            this.setState({ invalidFileFormat: false });
            const fileName = this.fileInput.current.value.split("\\").pop();
            if (fileName !== "") {
                this.setState({
                    inputedLocalFile: fileName,
                    fileLabel: fileName,
                    currPage: 1,
                    analyzeResult: null,
                    fileChanged: true,
                    file: this.fileInput.current.files[ 0 ],
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
                const tags = this.getTagsForPredictResults(
                    this.getPredictionsFromAnalyzeResult(result),
                );
                this.setState({
                    tags,
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
        if (this.appInsights) {
            this.appInsights.trackEvent({ name: "ANALYZE_EVENT" });
        }
    }

    private getPageCount() {
        if (this.currPdf !== null) {
            return _.get(this.currPdf, "numPages", 1);
        } else if (this.tiffImages.length !== 0) {
            return this.tiffImages.length;
        }

        return 1;
    }

    private getTagsForPredictResults(predictions) {
        const tags: ITag[] = [];
        Object.keys(predictions).forEach((key, index) => {
            tags.push({
                name: key,
                color: this.tagColors[ index ],
                // use default type
                type: FieldType.String,
                format: FieldFormat.NotSpecified,
            } as ITag);
        });
        this.setState({
            tags,
        });
        return tags;
    }

    private async getPrediction(): Promise<any> {
        let endpointURL;
        let apiKey;

        endpointURL = url.resolve(
            this.state.inputedServiceURI,
            `${"/formrecognizer/v2.0-preview/prebuilt"}/receipt/analyze?includeTextDetails=true`,
        );
        apiKey = this.state.inputedAPIKey;

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
                endpointURL, body, { headers }, apiKey as string);
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        }

        const operationLocation = response.headers[ "operation-location" ];

        // Make the second REST API call and get the response.
        return this.poll(() =>
            ServiceHelper.getWithAutoRetry(
                operationLocation, { headers }, apiKey as string), 120000, 500);
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
                    invalidFileFormat: true,
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
        const tiffImage = tiffImages[ pageNumber - 1 ];
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
            const loadingTask = pdfjsLib.getDocument({ data: typedArray, cMapUrl, cMapPacked: true });
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
        const imageWidth = imageExtent[ 2 ] - imageExtent[ 0 ];
        const imageHeight = imageExtent[ 3 ] - imageExtent[ 1 ];
        const ocrWidth = ocrExtent[ 2 ] - ocrExtent[ 0 ];
        const ocrHeight = ocrExtent[ 3 ] - ocrExtent[ 1 ];

        for (let i = 0; i < boundingBox.length; i += 2) {
            coordinates.push([
                Math.round((boundingBox[ i ] / ocrWidth) * imageWidth),
                Math.round((1 - (boundingBox[ i + 1 ] / ocrHeight)) * imageHeight),
            ]);
        }

        const feature = new Feature({
            geometry: new Polygon([ coordinates ]),
        });
        const tag = this.state.tags.find((tag) => tag.name.toLocaleLowerCase() === text.toLocaleLowerCase());
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
        this.imageMap.removeAllFeatures();
        const features = [];
        const imageExtent = [ 0, 0, this.state.imageWidth, this.state.imageHeight ];
        const ocrForCurrentPage: any = this.getOcrFromAnalyzeResult(this.state.analyzeResult)[ this.state.currPage - 1 ];
        const ocrExtent = [ 0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height ];
        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);

        for (const fieldName of Object.keys(predictions)) {
            const field = predictions[ fieldName ];
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
        if (analyzeResult) {
            const predictions = _.get(analyzeResult, "analyzeResult.documentResults[0].fields", {});
            const predictionsCopy = Object.assign({}, predictions);
            delete predictionsCopy.ReceiptType;
            if (!predictionsCopy.Items) {
                return predictionsCopy;
            }
            if (!predictionsCopy.Items.valueArray || Object.keys(predictionsCopy.Items).length === 0) {
                delete predictionsCopy.Items;
                return predictionsCopy;
            }
            predictionsCopy.Items.valueArray.forEach((item, index) => {
                const itemName = "Item " + (index + 1);
                predictionsCopy[ itemName ] = item.valueObject.Name;
                if (item.valueObject.TotalPrice) {
                    predictionsCopy[ itemName + " price" ] = item.valueObject.TotalPrice;
                }
            });
            delete predictionsCopy.Items;
            return predictionsCopy;

        } else {
            return _.get(analyzeResult, "analyzeResult.documentResults[0].fields", {});
        }
    }
    // private getAnalyzeModelInfo(analyzeResult) {
    //     const { modelId, docType, docTypeConfidence } = _.get(analyzeResult, "analyzeResult.documentResults[0]", {})
    //     return { modelId, docType, docTypeConfidence };
    // }

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
}
