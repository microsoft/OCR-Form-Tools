// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    Dropdown, FontIcon, IconButton, IDropdownOption,
    ITooltipHostStyles,
    PrimaryButton,
    Separator,
    Spinner, SpinnerSize, TooltipHost,
    TextField,
} from "@fluentui/react";
import _ from "lodash";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { constants } from "../../../../common/constants";
import { interpolate, strings } from "../../../../common/strings";
import { getPrimaryWhiteTheme, getGreenWithWhiteBackgroundTheme } from "../../../../common/themes";
import { poll } from "../../../../common/utils";
import { ErrorCode, FieldFormat, FieldType, IApplicationState, IPrebuiltSettings, ITag } from "../../../../models/applicationState";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import IAppPrebuiltSettingsActions, * as appPrebuiltSettingsActions from "../../../../redux/actions/prebuiltSettingsActions";
import ServiceHelper from "../../../../services/serviceHelper";
import { getAppInsights } from "../../../../services/telemetryService";
import Alert from "../../common/alert/alert";
import { DocumentFilePicker } from "../../common/documentFilePicker/documentFilePicker";
import { ImageMap } from "../../common/imageMap/imageMap";
import { PageRange } from "../../common/pageRange/pageRange";
import { PrebuiltSetting } from "../../common/prebuiltSetting/prebuiltSetting";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { CanvasCommandBar } from "../editorPage/canvasCommandBar";
import { TableView } from "../editorPage/tableView";
import "../predict/predictPage.scss";
import PredictResult from "../predict/predictResult";
import { ILoadFileHelper, ILoadFileResult, LoadFileHelper } from "./LoadFileHelper";
import "./prebuiltPredictPage.scss";
import { ITableHelper, ITableState, TableHelper } from "./tableHelper";

interface IPrebuiltTypes {
    name: string;
    servicePath: string;
    useLocale?: boolean;
}

export interface IPrebuiltPredictPageProps extends RouteComponentProps {
    prebuiltSettings: IPrebuiltSettings;
    appTitleActions: IAppTitleActions;
    actions: IAppPrebuiltSettingsActions;
}

export interface IPrebuiltPredictPageState extends ILoadFileResult, ITableState {
    fileLabel: string;
    fileChanged: boolean;
    file?: File;
    isFetching?: boolean;
    fileLoaded?: boolean;

    isPredicting: boolean;
    predictionLoaded: boolean;
    fetchedFileURL: string;
    analyzeResult: any;

    tags?: ITag[];
    highlightedField?: string;
    imageAngle: number;
    currentPrebuiltType: IPrebuiltTypes;
    currentLocale: string;

    withPageRange: boolean;
    pageRange: string;
    pageRangeIsValid?: boolean;
    predictionEndpointUrl: string;
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
export class PrebuiltPredictPage extends React.Component<IPrebuiltPredictPageProps, IPrebuiltPredictPageState> {
    private appInsights: any = null;
    prebuiltTypes: IPrebuiltTypes[] = [
        {
            name: "Invoice",
            servicePath: "/prebuilt/invoice/analyze"
        },
        {
            name: "Receipt",
            servicePath: "/prebuilt/receipt/analyze",
            useLocale: true,
        },
        {
            name: "Business card",
            servicePath: "/prebuilt/businessCard/analyze",
            useLocale: true,
        },
        {
            name: "ID",
            servicePath: "/prebuilt/idDocument/analyze"
        }
    ];

    locales: string[] = ["en-AU", "en-CA", "en-GB", "en-IN", "en-US"];

    state: IPrebuiltPredictPageState = {
        imageUri: null,
        imageWidth: 0,
        imageHeight: 0,
        currentPage: 1,
        numPages: 1,

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

        tableIconTooltip: { display: "none", width: 0, height: 0, top: 0, left: 0 },
        hoveringFeature: null,
        tableToView: null,
        tableToViewId: null,
        currentLocale: "en-US",

        withPageRange: false,
        pageRange: "",
        predictionEndpointUrl: "",
    };

    private analyzeResults: any;
    private fileHelper: ILoadFileHelper = new LoadFileHelper();

    private tableHelper: ITableHelper = new TableHelper(this);

    private imageMap: ImageMap;
    private tagColors = require("../../common/tagColors.json");

    public async componentDidMount() {
        const { appTitleActions, prebuiltSettings } = this.props;
        this.appInsights = getAppInsights();
        document.title = strings.prebuiltPredict.title + " - " + strings.appName;
        appTitleActions.setTitle(`${strings.prebuiltPredict.title}`);
        if (prebuiltSettings && prebuiltSettings.serviceURI) {
            this.setState({
                predictionEndpointUrl: prebuiltSettings.serviceURI
                    + `formrecognizer/${constants.prebuiltServiceVersion}${this.state.currentPrebuiltType.servicePath}?includeTextDetails=true`
            });
        }
    }

    componentDidUpdate(_prevProps: IPrebuiltPredictPageProps, prevState: IPrebuiltPredictPageState) {
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
                this.imageMap.removeAllFeatures();
                this.drawPredictionResult();

            }

            if (prevState.highlightedField !== this.state.highlightedField) {
                this.setPredictedFieldHighlightStatus(this.state.highlightedField);
            }
        }

        if (_prevProps.prebuiltSettings !== this.props.prebuiltSettings) {
            this.handleUpdateRequestURI();
        }
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

    getPredictDisabled = (): boolean => {
        return this.state.isPredicting || !this.state.file
            || this.state.invalidFileFormat ||
            !this.state.fileLoaded ||
            !this.props.prebuiltSettings?.apiKey ||
            !this.props.prebuiltSettings?.serviceURI ||
            (this.state.withPageRange && !this.state.pageRangeIsValid);
    }

    public render() {
        const predictDisabled: boolean = this.getPredictDisabled();

        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);

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
                    {this.renderPageIndicator()}
                </div>
                <div className="predict-sidebar bg-lighter-1">
                    <div className="condensed-list">
                        <h6 className="condensed-list-header bg-darker-2 p-2 flex-center">
                            <FontIcon className="mr-1" iconName="ContactCard" />
                            <span>{interpolate(strings.prebuiltPredict.anlayWithPrebuiltModels, this.state.currentPrebuiltType)}</span>
                        </h6>
                        <div className="p-3 prebuilt-setting" style={{ marginTop: "8px" }}>
                            <h5>{strings.prebuiltSetting.serviceConfigurationTitle}</h5>
                            <div style={{ marginBottom: "3px" }}>{"Request URI"}</div>
                            <TextField
                                className="mb-1"
                                name="endpointUrl"
                                theme={getGreenWithWhiteBackgroundTheme()}
                                value={this.state.predictionEndpointUrl}
                                onChange={this.setRequestURI}
                                disabled={this.state.isPredicting}
                            />
                        </div>
                        <PrebuiltSetting prebuiltSettings={this.props.prebuiltSettings}
                            disabled={this.state.isPredicting}
                            actions={this.props.actions}
                        />
                        <div className="p-3" style={{ marginTop: "-3rem" }}>
                            <div className="formtype-section">
                                <div style={{ marginBottom: "3px" }}>{strings.prebuiltPredict.formTypeTitle}</div>
                                <Dropdown
                                    disabled={this.state.isPredicting}
                                    className="prebuilt-type-dropdown"
                                    options={this.prebuiltTypes.map(type => ({ key: type.name, text: type.name }))}
                                    defaultSelectedKey={this.state.currentPrebuiltType.name}
                                    onChange={this.onPrebuiltTypeChange}></Dropdown>
                            </div>
                            <div className="locales-section" style={{ display: this.state.currentPrebuiltType.useLocale ? "block" : "none" }}>
                                <div style={{ marginBottom: "3px" }}>{strings.prebuiltPredict.locale}</div>
                                <Dropdown
                                    disabled={this.state.isPredicting}
                                    className="prebuilt-type-dropdown"
                                    options={this.locales.map(type => ({ key: type, text: type }))}
                                    defaultSelectedKey={this.state.currentLocale}
                                    onChange={this.onLocaleChange}></Dropdown>
                            </div>
                        </div>
                        <div className="p-3" style={{ marginTop: "8px" }}>
                            <h5>{strings.prebuiltPredict.selectFileAndRunAnalysis}</h5>
                            <DocumentFilePicker
                                disabled={this.state.isPredicting || this.state.isFetching}
                                onFileChange={(data) => this.onFileChange(data)}
                                onSelectSourceChange={() => this.onSelectSourceChange()}
                                onError={(err) => this.onFileLoadError(err)} />
                            <div className="page-range-section">
                                <PageRange
                                    disabled={this.state.isPredicting || this.state.isFetching}
                                    withPageRange={this.state.withPageRange}
                                    pageRange={this.state.pageRange}
                                    onPageRangeChange={this.onPageRangeChange} />
                            </div>
                        </div>
                        <Separator className="separator-right-pane-main">{strings.prebuiltPredict.analysis}</Separator>
                        <div className="p-3" style={{ marginTop: "8px" }}>
                            <div className="container-items-end predict-button">
                                <PrimaryButton
                                    theme={getPrimaryWhiteTheme()}
                                    iconProps={{ iconName: "ContactCard" }}
                                    text={strings.prebuiltPredict.runAnalysis}
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
                                <PredictResult
                                    predictions={predictions}
                                    analyzeResult={this.analyzeResults}
                                    page={this.state.currentPage}
                                    tags={this.state.tags}
                                    downloadPrefix={this.state.currentPrebuiltType.name}
                                    downloadResultLabel={this.state.fileLabel}
                                    onPredictionClick={this.onPredictionClick}
                                    onPredictionMouseEnter={this.onPredictionMouseEnter}
                                    onPredictionMouseLeave={this.onPredictionMouseLeave}
                                />
                            }
                            {
                                (Object.keys(predictions).length === 0 && this.state.predictionLoaded) &&
                                <div>{strings.prebuiltPredict.noFieldCanBeExtracted}</div>
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

    onPageRangeChange = (withPageRange: boolean, pageRange: string, pageRangeIsValid: boolean) => {
        this.setState({ withPageRange, pageRange, pageRangeIsValid }, () => {
            this.handleUpdateRequestURI();
        });
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

    onFileLoadError(err: { alertTitle: string; alertMessage: string; }): void {
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
                predictionLoaded: false,
                analyzeResult: {}
            }, () => {
                this.imageMap?.removeAllFeatures();
                this.handleUpdateRequestURI();
            });
        }
    }
    private onLocaleChange = (_e, option: IDropdownOption) => {
        const currentLocale: string = option.key as string;
        this.setState({ currentLocale }, () => {
            this.handleUpdateRequestURI();
        });
    }

    private prevPage = () => {
        this.setState((prevState) => ({
            currentPage: Math.max(1, prevState.currentPage - 1),
        }), () => {
            this.imageMap?.removeAllFeatures();
        });
    };
    private nextPage = () => {
        const { numPages } = this.state;
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
                iconProps={{ iconName: "ChevronLeft" }}
                onClick={this.prevPage}
            /> : <div></div>;
    }

    private renderNextPageButton = () => {
        return this.state.currentPage < this.state.numPages ?
            <IconButton
                className="toolbar-btn next"
                title="Next"
                onClick={this.nextPage}
                iconProps={{ iconName: "ChevronRight" }}
            /> : <div></div>;
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
                    layers={{}}
                />
                <ImageMap
                    initPredictMap={true}
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


    private handleTableToolTipChange = async (display: string, width: number, height: number, top: number,
        left: number, rows: number, columns: number, featureID: string) => {
        if (!this.imageMap) {
            return;
        }

        if (featureID !== null && this.imageMap.getTableBorderFeatureByID(featureID).get("state") !== "selected") {
            this.imageMap.getTableBorderFeatureByID(featureID).set("state", "hovering");
            this.imageMap.getTableIconFeatureByID(featureID).set("state", "hovering");
        } else if (featureID === null && this.state.hoveringFeature &&
            this.imageMap.getTableBorderFeatureByID(this.state.hoveringFeature).get("state") !== "selected") {
            this.imageMap.getTableBorderFeatureByID(this.state.hoveringFeature).set("state", "rest");
            this.imageMap.getTableIconFeatureByID(this.state.hoveringFeature).set("state", "rest");
        }
        const newTableIconTooltip = {
            display,
            width,
            height,
            top,
            left,
            rows,
            columns,
        };
        this.setState({
            tableIconTooltip: newTableIconTooltip,
            hoveringFeature: featureID,
        });
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
        this.setState({ imageAngle: this.state.imageAngle + degrees });
    }


    private handleClick = () => {
        this.setState({ predictionLoaded: false, isPredicting: true });
        this.getPrediction()
            .then((result) => {
                this.analyzeResults = _.cloneDeep(result);
                this.tableHelper.setAnalyzeResult(result?.analyzeResult);
                const tags = this.getTagsForPredictResults(this.getPredictionsFromAnalyzeResult(result?.analyzeResult));
                this.setState({
                    tags,
                    analyzeResult: result.analyzeResult,
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
        const endpointURL = this.state.predictionEndpointUrl;
        const apiKey = this.props.prebuiltSettings.apiKey;

        const headers = { "Content-Type": this.state.file ? this.state.file.type : "application/json", "cache-control": "no-cache" };
        const body = this.state.file ?? { source: this.state.fetchedFileURL };
        let response;
        try {
            response = await ServiceHelper.postWithAutoRetry(
                endpointURL, body, { headers }, apiKey as string);
        } catch (err) {
            ServiceHelper.handleServiceError({ ...err, endpoint: endpointURL });
        }

        const operationLocation = response.headers["operation-location"];

        // Make the second REST API call and get the response.
        return poll(() => ServiceHelper.getWithAutoRetry(operationLocation, { headers }, apiKey as string), 120000, 500);
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
        this.tableHelper.drawTables(this.state.currentPage);
    }

    private getPredictionsFromAnalyzeResult(analyzeResult: any) {
        if (analyzeResult) {
            const documentResults = _.get(analyzeResult, "documentResults", []);
            const notBlockField = fieldName => {
                // block field name that should not be a tag
                const blockedFieldNames = ["ReceiptType"];
                return blockedFieldNames.indexOf(fieldName) === -1;
            }
            const isRootItemObject = obj => obj.hasOwnProperty("text");
            // flat fieldProps of type "array" and "object", and extract root level field props in "object" type
            const allFields = {};
            const flatFields = (fields = {}) => {
                const flatFieldProps = (fieldName, fieldProps, prefixFiledName = "") => {
                    if (notBlockField(fieldName)) {
                        const fieldType = _.get(fieldProps, "type", "");
                        if (fieldType === "array") {
                            const valueArray = _.get(fieldProps, "valueArray", []);
                            for (const [index, valueArrayItem] of valueArray.entries()) {
                                const arrayItemPrefix = `${fieldName} ${index + 1}`;
                                flatFieldProps(fieldName, valueArrayItem, arrayItemPrefix);
                            }
                        } else if (fieldType === "object") {
                            // root level field props
                            const { type, valueObject, ...rootFieldProps } = fieldProps;
                            if (isRootItemObject(rootFieldProps)) {
                                flatFieldProps(prefixFiledName, rootFieldProps);
                            }
                            for (const [fieldName, objFieldProps] of Object.entries(fieldProps.valueObject)) {
                                flatFieldProps(fieldName, objFieldProps, `${prefixFiledName}: `);
                            }
                        } else {
                            if (prefixFiledName) {
                                fieldName = `${prefixFiledName}${fieldName}`;
                            }
                            allFields[fieldName] = fieldProps;
                        }
                    }
                }
                for (const [fieldName, fieldProps] of Object.entries(fields)) {
                    flatFieldProps(fieldName, fieldProps);
                }
            }
            for (const documentResult of documentResults) {
                const fields = documentResult["fields"];
                flatFields(fields);
            }
            return allFields;
        } else {
            return {};
        }
    }

    private getOcrFromAnalyzeResult(analyzeResult: any) {
        return _.get(analyzeResult, "readResults", []);
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

    private handleUpdateRequestURI = () => {
        const { prebuiltSettings } = this.props;
        const { currentPrebuiltType, predictionEndpointUrl } = this.state;
        if (predictionEndpointUrl.includes("?")) {
            const queryString = predictionEndpointUrl.split("?")[1];
            if (!prebuiltSettings || !prebuiltSettings.serviceURI) {
                this.setState({ predictionEndpointUrl: "" });
            } else {
                const parameterArray = queryString.includes("&") ? queryString.split("&") : [queryString];
                let newQueryString = "";
                let connector = "";
                for (const parameter of parameterArray) {
                    const name = parameter.split("=")[0];
                    if (name !== "locale" && name !== constants.pages) {
                        newQueryString += `${connector}${parameter}`;
                    }
                    connector = "&";
                }
                if (this.state.withPageRange && this.state.pageRangeIsValid) {
                    newQueryString += `${connector}${constants.pages}=${this.state.pageRange}`;
                    connector = "&";
                }
                if (this.state.currentPrebuiltType.useLocale) {
                    newQueryString += `${connector}locale=${this.state.currentLocale}`;
                }
                this.setState({
                    predictionEndpointUrl:
                        prebuiltSettings.serviceURI.replace(/\/+$/, "") +
                        `/formrecognizer/${constants.prebuiltServiceVersion}${currentPrebuiltType.servicePath}?`
                        + newQueryString
                });
            }
        } else {
            if (prebuiltSettings && prebuiltSettings.serviceURI) {
                let endpointUrl = prebuiltSettings.serviceURI +
                    `formrecognizer/${constants.prebuiltServiceVersion}${this.state.currentPrebuiltType.servicePath}?includeTextDetails=true`;
                if (this.state.withPageRange && this.state.pageRangeIsValid) {
                    endpointUrl += `&${constants.pages}=${this.state.pageRange}`;
                }
                this.setState({
                    predictionEndpointUrl: endpointUrl + (this.state.currentPrebuiltType.useLocale ? `&locale=${this.state.currentLocale}` : "")
                });
            }
        }
    }

    private setRequestURI = (e, newValue?) => {
        this.setState({
            predictionEndpointUrl: newValue
        });
    }
}
