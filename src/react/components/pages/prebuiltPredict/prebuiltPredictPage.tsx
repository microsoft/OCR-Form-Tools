// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    Dropdown, FontIcon, IconButton, IDropdownOption,
    PrimaryButton,
    Spinner, SpinnerSize
} from "@fluentui/react";
import _ from "lodash";
import {Feature} from "ol";
import Polygon from "ol/geom/Polygon";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import React from "react";
import {connect} from "react-redux";
import {RouteComponentProps} from "react-router-dom";
import {bindActionCreators} from "redux";
import url from "url";
import {constants} from "../../../../common/constants";
import {interpolate, strings} from "../../../../common/strings";
import {getPrimaryWhiteTheme} from "../../../../common/themes";
import {poll} from "../../../../common/utils";
import {ErrorCode, FieldFormat, FieldType, IApplicationState, IPrebuiltSettings, ITag} from "../../../../models/applicationState";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import IAppPrebuiltSettingsActions, * as appPrebuiltSettingsActions from "../../../../redux/actions/prebuiltSettingsActions";
import ServiceHelper from "../../../../services/serviceHelper";
import {getAppInsights} from "../../../../services/telemetryService";
import Alert from "../../common/alert/alert";
import {ImageMap} from "../../common/imageMap/imageMap";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import {CanvasCommandBar} from "../editorPage/canvasCommandBar";
import {FilePicker} from "./filePicker";
import {ILoadFileHelper, LoadFileHelper} from "./LoadFileHelper";
import "./prebuiltPredictPage.scss";
import PrebuiltPredictResult from "./prebuiltPredictResult";
import {PrebuiltSetting} from "./prebuiltSetting";

interface IPrebuiltTypes {
    name: string;
    servicePath: string;
}

export interface IPrebuiltPredictPageProps extends RouteComponentProps {
    prebuiltSettings: IPrebuiltSettings;
    appTitleActions: IAppTitleActions;
    actions: IAppPrebuiltSettingsActions;
}

export interface IPrebuiltPredictPageState {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    currentPage: number;

    shouldShowAlert: boolean;
    alertTitle: string;
    alertMessage: string;
    invalidFileFormat?: boolean;

    fileLabel: string;
    fileChanged: boolean;
    file?: File;
    isFetching?: boolean;
    fileLoaded?: boolean;

    isPredicting: boolean;
    predictionLoaded: boolean;
    fetchedFileURL: string;
    analyzeResult: object;

    tags?: ITag[];
    highlightedField?: string;
    imageAngle: number;
    currentPrebuiltType: IPrebuiltTypes;
}

function mapStateToProps(state: IApplicationState) {
    return {
        prebuiltSettings: state.prebuiltSettings
    };
}

function mapDispatchToProps(dispatch) {
    return {
        appTitleActions: bindActionCreators(appTitleActions, dispatch),
        actions: bindActionCreators(appPrebuiltSettingsActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class PrebuiltPredictPage extends React.Component<IPrebuiltPredictPageProps, IPrebuiltPredictPageState> {
    private appInsights: any = null;
    prebuiltTypes: IPrebuiltTypes[] = [
        {
            name: "Peceipt",
            servicePath: "/prebuilt/receipt/analyze"
        },
        {
            name: "Invoice",
            servicePath: "/prebuilt/invoice/analyze"
        },
        {
            name: "BusinessCard",
            servicePath: "/prebuilt/businessCard/analyze"
        },
    ];

    state: IPrebuiltPredictPageState = {
        imageUri: null,
        imageWidth: 0,
        imageHeight: 0,
        currentPage: 1,

        shouldShowAlert: false,
        alertTitle: "",
        alertMessage: "",

        fileLabel: "",
        fileChanged: false,

        isPredicting: false,
        predictionLoaded: false,
        fetchedFileURL: "",
        analyzeResult: null,

        imageAngle: 0,
        currentPrebuiltType: this.prebuiltTypes[0],
    };

    private fileHelper: ILoadFileHelper = new LoadFileHelper();
    private imageMap: ImageMap;
    private tagColors = require("../../common/tagColors.json");

    public async componentDidMount() {
        this.appInsights = getAppInsights();
        document.title = strings.prebuiltPredict.title + " - " + strings.appName;
        this.props.appTitleActions.setTitle(`${strings.prebuiltPredict.title}`);
    }

    componentDidUpdate(_prevProps: IPrebuiltPredictPageProps, prevState: IPrebuiltPredictPageState) {
        if (this.state.file) {
            if (this.state.fileChanged && !this.state.isFetching) {
                this.loadFile(this.state.file);
            } else if (prevState.currentPage !== this.state.currentPage) {
                this.fileHelper.loadPage(this.state.currentPage).then((res: any) => {
                    if (res) {
                        this.setState({...res});
                    }
                });
            }

            if (this.getOcrFromAnalyzeResult(this.state.analyzeResult).length > 0 &&
                prevState.imageUri !== this.state.imageUri) {
                this.imageMap.removeAllFeatures();
                this.drawPredictionResult();
            }

            if (prevState.highlightedField !== this.state.highlightedField) {
                this.setPredictedFieldHighlightStatus(this.state.highlightedField);
            }
        }
    }

    private loadFile = (file: File) => {
        this.setState({isFetching: true});
        this.fileHelper.loadFile(file).then((res: any) => {
            if (res) {
                this.setState({
                    ...res,
                    isFetching: false,
                    fileChanged: false
                });
            }
        });
    }

    public render() {
        const predictDisabled: boolean = this.state.isPredicting || !this.state.file
            || this.state.invalidFileFormat ||
            !this.props.prebuiltSettings.apiKey ||
            !this.state.fileLoaded ||
            !this.props.prebuiltSettings.serviceURI;

        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);

        const onPrebuiltsPath: boolean = this.props.match.path.includes("prebuilts");

        return (
            <div
                className={`predict skipToMainContent ${onPrebuiltsPath ? "" : "hidden"} `}
                id="pagePredict"
                style={{display: `${onPrebuiltsPath ? "flex" : "none"}`}} >
                <div className="predict-main">
                    {this.state.file && this.state.imageUri && this.renderImageMap()}
                    {this.renderPrevPageButton()}
                    {this.renderNextPageButton()}
                    {this.renderPageIndicator()}
                </div>
                <div className="predict-sidebar bg-lighter-1">
                    <div className="condensed-list">
                        <h6 className="condensed-list-header bg-darker-2 p-2 flex-center">
                            <FontIcon className="mr-1" iconName="Insights" />
                            <span>Analyze</span>
                        </h6>

                        <PrebuiltSetting prebuiltSettings={this.props.prebuiltSettings}
                            disabled={this.state.isPredicting}
                            actions={this.props.actions}
                        />
                        <div className="p-3" style={{marginTop: "-3rem"}}>
                            <div style={{marginBottom: "3px"}}>Pre-built</div>
                            <Dropdown
                                disabled={this.state.isPredicting}
                                className="prebuilt-type-dropdown"
                                options={this.prebuiltTypes.map(type => ({key: type.name, text: type.name}))}
                                defaultSelectedKey={this.state.currentPrebuiltType.name}
                                onChange={this.onPrebuiltTypeChange}></Dropdown>
                        </div>
                        <div className="p-3" style={{marginTop: "8px"}}>
                            <h5>Upload file and run analysis</h5>
                            <FilePicker
                                disabled={this.state.isPredicting || this.state.isFetching}
                                onFileChange={(data) => this.onFileChange(data)}
                                onSelectSourceChange={() => this.onSelectSourceChange()}
                                onError={(err) => this.onFileLoadError(err)} />
                            <div className="container-items-end predict-button">
                                <PrimaryButton
                                    theme={getPrimaryWhiteTheme()}
                                    iconProps={{iconName: "Insights"}}
                                    text="Run analysis"
                                    aria-label={!this.state.isPredicting ? strings.prebuiltPredict.inProgress : ""}
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
                                        label={strings.prebuiltPredict.inProgress}
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
                                    page={this.state.currentPage}
                                    tags={this.state.tags}
                                    resultType={this.state.currentPrebuiltType.name}
                                    downloadResultLabel={this.state.fileLabel}
                                    onPredictionClick={this.onPredictionClick}
                                    onPredictionMouseEnter={this.onPredictionMouseEnter}
                                    onPredictionMouseLeave={this.onPredictionMouseLeave}
                                />
                            }
                            {
                                (Object.keys(predictions).length === 0 && this.state.predictionLoaded) &&
                                <div>
                                    No field can be extracted.
                                                </div>
                            }
                        </div>


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
    onSelectSourceChange(): void {
        this.setState({
            file: undefined,
            analyzeResult: {},
            predictionLoaded: false,
        });
        if (this.imageMap) {
            this.imageMap.removeAllFeatures();
        }
    }

    onFileLoadError(err: {alertTitle: string; alertMessage: string;}): void {
        this.setState({
            ...err,
            shouldShowAlert: true,
            isPredicting: false,
        });
    }
    onFileChange(data: {
        file: File,
        fileLabel: string,
        fetchedFileURL: string
    }): void {
        this.setState({
            currentPage: 1,
            analyzeResult: null,
            fileChanged: true,
            ...data,
            predictionLoaded: false,
            fileLoaded: false,
        }, () => {
            if (this.imageMap) {
                this.imageMap.removeAllFeatures();
            }
        });
    }

    private onPrebuiltTypeChange = (e, option: IDropdownOption) => {
        const currentPrebuiltType = this.prebuiltTypes.find(type => type.name === option.key);
        if (currentPrebuiltType && this.state.currentPrebuiltType.name !== currentPrebuiltType.name) {
            this.setState({
                currentPrebuiltType,
                // predictRun: false,
                predictionLoaded: false,
                analyzeResult: {}
            }, () => {
                this.imageMap?.removeAllFeatures();
            });
        }
    }
    private prevPage = () => {
        this.setState((prevState) => ({
            currentPage: Math.max(1, prevState.currentPage - 1),
        }), () => {
            this.imageMap?.removeAllFeatures();
        });
    };
    private nextPage = () => {
        const numPages = this.getPageCount();
        this.setState((prevState) => ({
            currentPage: Math.min(prevState.currentPage + 1, numPages),
        }), () => {
            this.imageMap?.removeAllFeatures();
        });
    };
    private renderPrevPageButton = () => {
        return this.state.currentPage > 1 ?
            <IconButton
                className="toolbar-btn prev"
                title="Previous"
                iconProps={{iconName: "ChevronLeft"}}
                onClick={this.prevPage}
            /> : <div></div>;
    }

    private renderNextPageButton = () => {
        return this.state.currentPage < this.getPageCount() ?
            <IconButton
                className="toolbar-btn next"
                title="Next"
                onClick={this.nextPage}
                iconProps={{iconName: "ChevronRight"}}
            /> : <div></div>;
    }

    private renderPageIndicator = () => {
        const pageCount = this.getPageCount();
        return pageCount > 1 ?
            <p className="page-number">
                Page {this.state.currentPage} of {pageCount}
            </p> : <div></div>;
    }

    private renderImageMap = () => {
        return (
            <div style={{width: "100%", height: "100%"}}>
                <CanvasCommandBar
                    handleZoomIn={this.handleCanvasZoomIn}
                    handleZoomOut={this.handleCanvasZoomOut}
                    handleRotateImage={this.handleRotateCanvas}
                    layers={{}}
                />
                <ImageMap
                    // parentPage={ImageMapParent.Predict}
                    initPredictMap={true}
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
    private handleCanvasZoomIn = () => {
        this.imageMap.zoomIn();
    }

    private handleCanvasZoomOut = () => {
        this.imageMap.zoomOut();
    }
    private handleZoomReset = () => {
        this.imageMap.resetZoom();
    }

    private handleRotateCanvas = (degrees: number) => {
        this.setState({imageAngle: this.state.imageAngle + degrees});
    }


    private handleClick = () => {
        this.setState({predictionLoaded: false, isPredicting: true});
        this.getPrediction()
            .then((result) => {
                const tags = this.getTagsForPredictResults(this.getPredictionsFromAnalyzeResult(result));
                this.setState({
                    tags,
                    analyzeResult: result,
                    predictionLoaded: true,
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
                    alertMessage = interpolate(strings.errors.endpointConnectionError.message, {endpoint: "form recognizer backend URL"});
                }
                this.setState({
                    shouldShowAlert: true,
                    alertTitle: "Prediction Failed",
                    alertMessage,
                    isPredicting: false,
                });
            });
        if (this.appInsights) {
            this.appInsights.trackEvent({name: "ANALYZE_EVENT"});
        }
    }

    private getPageCount() {
        return this.fileHelper.getPageCount();
    }

    private getTagsForPredictResults(predictions) {
        const tags: ITag[] = [];
        Object.keys(predictions).forEach((key, index) => {
            tags.push({
                name: key,
                color: this.tagColors[index],
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
            this.props.prebuiltSettings.serviceURI,
            `/formrecognizer/${constants.prebuiltServiceVersion}${this.state.currentPrebuiltType.servicePath}`,
        );
        apiKey = this.props.prebuiltSettings.apiKey;

        let headers;
        let body;
        if (this.state.file) {
            headers = {"Content-Type": this.state.file.type, "cache-control": "no-cache"};
            body = this.state.file;
        } else {
            headers = {"Content-Type": "application/json", "cache-control": "no-cache"};
            body = {source: this.state.fetchedFileURL};
        }
        let response;
        try {
            response = await ServiceHelper.postWithAutoRetry(
                endpointURL, body, {headers}, apiKey as string);
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        }

        const operationLocation = response.headers["operation-location"];

        // Make the second REST API call and get the response.
        return poll(() => ServiceHelper.getWithAutoRetry(operationLocation, {headers}, apiKey as string), 120000, 500);
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
        const tag = this.state.tags.find((tag) => tag.name.toLocaleLowerCase() === text.toLocaleLowerCase());
        const isHighlighted = (text.toLocaleLowerCase() === this.state.highlightedField?.toLocaleLowerCase());
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
        const imageExtent = [0, 0, this.state.imageWidth, this.state.imageHeight];
        const ocrForCurrentPage: any = this.getOcrFromAnalyzeResult(this.state.analyzeResult)[this.state.currentPage - 1];
        const ocrExtent = [0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height];
        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);

        for (const fieldName of Object.keys(predictions)) {
            const field = predictions[fieldName];
            if (_.get(field, "page", null) === this.state.currentPage) {
                const text = fieldName;
                const boundingbox = _.get(field, "boundingBox", []);
                const feature = this.createBoundingBoxVectorFeature(text, boundingbox, imageExtent, ocrExtent);
                features.push(feature);
            }
        }
        this.imageMap.addFeatures(features);
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
                predictionsCopy[itemName] = item.valueObject.Name;
                if (item.valueObject.TotalPrice) {
                    predictionsCopy[itemName + " price"] = item.valueObject.TotalPrice;
                }
            });
            delete predictionsCopy.Items;
            return predictionsCopy;

        } else {
            return _.get(analyzeResult, "analyzeResult.documentResults[0].fields", {});
        }
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
        if (Number.isInteger(targetPage) && targetPage !== this.state.currentPage) {
            this.setState({
                currentPage: targetPage,
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
