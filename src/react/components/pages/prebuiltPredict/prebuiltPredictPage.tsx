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
import { getPrimaryWhiteTheme, getLightGreyTheme } from "../../../../common/themes";
import { getNextColor, poll } from "../../../../common/utils";
import { ErrorCode, FieldFormat, FieldType, IApplicationState, IPrebuiltSettings, ITag } from "../../../../models/applicationState";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import IAppPrebuiltSettingsActions, * as appPrebuiltSettingsActions from "../../../../redux/actions/prebuiltSettingsActions";
import ServiceHelper from "../../../../services/serviceHelper";
import { getAppInsights } from "../../../../services/telemetryService";
import Alert from "../../common/alert/alert";
import { DocumentFilePicker } from "../../common/documentFilePicker/documentFilePicker";
import { PredictionFilePicker } from "../../common/predictionFilePicker/predictionFilePicker";
import { ImageMap } from "../../common/imageMap/imageMap";
import { PageRange } from "../../common/pageRange/pageRange";
import { PrebuiltSetting } from "../../common/prebuiltSetting/prebuiltSetting";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { CanvasCommandBar } from "../editorPage/canvasCommandBar";
import { TableView } from "../editorPage/tableView";
import "../predict/predictPage.scss";
import PredictResult, { ITableResultItem } from "../predict/predictResult";
import { ILoadFileHelper, ILoadFileResult, LoadFileHelper } from "./LoadFileHelper";
import "./prebuiltPredictPage.scss";
import { ITableHelper, ITableState, TableHelper } from "./tableHelper";
import { Toggle } from "office-ui-fabric-react/lib/Toggle";
import { ILayoutHelper, LayoutHelper } from "./layoutHelper";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { URIUtils } from "../../../../common/utils";

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

    liveMode: boolean;

    viewRegionalTable?: boolean;
    regionalTableToView?: any;
    tableTagColor?: string;
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
    private layoutHelper: ILayoutHelper = new LayoutHelper();
    prebuiltTypes: IPrebuiltTypes[] = [
        {
            name: "Invoice",
            servicePath: "invoice",
        },
        {
            name: "Receipt",
            servicePath: "receipt",
            useLocale: true,
        },
        {
            name: "Business card",
            servicePath: "businessCard",
            useLocale: true,
        },
        {
            name: "ID",
            servicePath: "idDocument",
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
        predictionEndpointUrl: "/formrecognizer/v2.1/prebuilt/invoice/analyze?includeTextDetails=true",

        liveMode: true,

        viewRegionalTable: false,
        regionalTableToView: null,
        tableTagColor: null,
    };

    private analyzeResults: any;
    private fileHelper: ILoadFileHelper = new LoadFileHelper();

    private tableHelper: ITableHelper = new TableHelper(this);

    private imageMap: ImageMap;

    public async componentDidMount() {
        const { appTitleActions, prebuiltSettings } = this.props;
        this.appInsights = getAppInsights();
        document.title = strings.prebuiltPredict.title + " - " + strings.appName;
        appTitleActions.setTitle(`${strings.prebuiltPredict.title}`);
        if (prebuiltSettings && prebuiltSettings.serviceURI) {
            this.setState({
                predictionEndpointUrl: `/formrecognizer/${constants.prebuiltServiceVersion}/prebuilt/${this.state.currentPrebuiltType.servicePath}/analyze?includeTextDetails=true`
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
                this.layoutHelper.drawLayout(this.state.currentPage);
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

    getPredictDisabled = (needEndPoint: boolean = true): boolean => {
        return this.state.isPredicting || !this.state.file
            || this.state.invalidFileFormat ||
            !this.state.fileLoaded ||
            (this.state.withPageRange && !this.state.pageRangeIsValid) ||
            (needEndPoint && (!this.props.prebuiltSettings?.apiKey ||
                !this.props.prebuiltSettings?.serviceURI));
    }

    public render() {
        const predictDisabled: boolean = this.getPredictDisabled();

        const predictions = this.flatFields(this.getPredictionsFromAnalyzeResult(this.state.analyzeResult));

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
                        <Separator className="separator-right-pane-main">1. Choose file for analysis.</Separator>
                        <div className="p-3">
                            {/* <h5>{strings.prebuiltPredict.selectFileAndRunAnalysis}</h5> */}
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
                        <Separator className="separator-right-pane-main">2. Get prediction.</Separator>
                        {constants.enablePredictionResultUpload &&
                            <div className="p-3" style={{ marginTop: "8px" }}>
                                <Toggle theme={getLightGreyTheme()}
                                    className="predict-mode-toggle"
                                    defaultChecked
                                    onText="Call live service"
                                    offText="Use predicted file"
                                    onChange={this.handleLiveModeToggleChange} />
                            </div>
                        }
                        {!this.state.liveMode &&
                            <div className="p-3" style={{ marginTop: "-2rem" }}>
                                <PredictionFilePicker
                                    disabled={this.getPredictDisabled(false)}
                                    onFileChange={this.onPredictionFileChange}
                                    onSelectSourceChange={this.onPredictionSelectSourceChange}
                                    onError={this.onFileLoadError} />
                            </div>
                        }
                        {this.state.liveMode &&
                            <>
                                <PrebuiltSetting prebuiltSettings={this.props.prebuiltSettings}
                                    disabled={this.state.isPredicting}
                                    actions={this.props.actions}
                                />
                                <div className="p-3" style={{ marginTop: "-28px" }}>
                                    <div className="formtype-section">
                                        <div style={{ marginBottom: "3px" }}>{strings.prebuiltPredict.formTypeTitle}</div>
                                        <Dropdown
                                            disabled={this.state.isPredicting}
                                            className="prebuilt-type-dropdown"
                                            options={this.prebuiltTypes.map(type => ({ key: type.name, text: type.name }))}
                                            defaultSelectedKey={this.state.currentPrebuiltType.name}
                                            onChange={this.onPrebuiltTypeChange}></Dropdown>
                                    </div>
                                    <div className="locales-section" style={{ visibility: this.state.currentPrebuiltType.useLocale ? "visible" : "hidden" }}>
                                        <div style={{ marginBottom: "3px" }}>{strings.prebuiltPredict.locale}</div>
                                        <Dropdown
                                            disabled={this.state.isPredicting}
                                            className="prebuilt-type-dropdown"
                                            options={this.locales.map(type => ({ key: type, text: type }))}
                                            defaultSelectedKey={this.state.currentLocale}
                                            onChange={this.onLocaleChange}></Dropdown>
                                    </div>
                                    <div style={{ marginBottom: "3px" }}>{"The composed API request is"}</div>
                                    <TextField
                                        className="mb-1 request-uri-textfield"
                                        name="endpointUrl"
                                        theme={getLightGreyTheme()}
                                        value={this.state.predictionEndpointUrl}
                                        onChange={this.setRequestURI}
                                        disabled={this.state.isPredicting}
                                        multiline={true}
                                        autoAdjustHeight={true}
                                    />
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
                                </div>
                            </>}
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
                                onTablePredictionClick={this.onTablePredictionClick}
                            />
                        }
                        {
                            (Object.keys(predictions).length === 0 && this.state.predictionLoaded) &&
                            <div>{strings.prebuiltPredict.noFieldCanBeExtracted}</div>
                        }
                        {this.state.viewRegionalTable &&
                            <TableView
                                handleTableViewClose={this.onTablePredictionClose}
                                tableToView={this.state.regionalTableToView}
                                showToolTips={true}
                            />
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
            </div>
        );
    }

    onPageRangeChange = (withPageRange: boolean, pageRange: string, pageRangeIsValid: boolean) => {
        this.setState({ withPageRange, pageRange, pageRangeIsValid }, () => {
            this.handleUpdateRequestURI(false);
        });
    }

    onSelectSourceChange = (): void => {
        this.setState({
            file: undefined,
            analyzeResult: {},
            predictionLoaded: false,
        });
        if (this.imageMap) {
            this.imageMap.removeAllFeatures();
        }
    }

    onFileLoadError = (err: { alertTitle: string; alertMessage: string; }): void => {
        this.setState({
            ...err,
            shouldShowAlert: true,
            isPredicting: false,
        });
    }
    onFileChange = (data: {
        file: File,
        fileLabel: string,
        fetchedFileURL: string
    }): void => {
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

    onPredictionSelectSourceChange = (): void => {
        this.setState({
            analyzeResult: {},
            predictionLoaded: false,
        });
        if (this.imageMap) {
            this.imageMap.removeAllFeatures();
        }
    }

    onPredictionFileChange = (data: {
        file: File,
        fileLabel: string,
        fetchedFileURL: string
    }): void => {
        if (this.imageMap) {
            this.imageMap.removeAllFeatures();
        }
        if (data.file) {
            HtmlFileReader.readAsText(data.file)
                .then(({ content }) => JSON.parse(content as string))
                .then(result => this.setState({
                    currentPage: 1,
                    analyzeResult: null,
                    predictionLoaded: false,
                    fileLoaded: false,
                }, () => new Promise(() => this.handlePredictionResult(result))
                    .catch(this.handlePredictionError)))
        }
    }

    handleLiveModeToggleChange = (event, checked: boolean) => {
        this.setState({ liveMode: checked });
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
                this.handleUpdateRequestURI(false);
            });
        }
    }
    private onLocaleChange = (_e, option: IDropdownOption) => {
        const currentLocale: string = option.key as string;
        this.setState({ currentLocale }, () => {
            this.handleUpdateRequestURI(false);
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
                        this.layoutHelper.setImageMap(ref);
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

    private handlePredictionResult = (result) => {
        this.analyzeResults = _.cloneDeep(result);
        this.tableHelper.setAnalyzeResult(result?.analyzeResult);
        const tags = this.getTagsForPredictResults(this.getPredictionsFromAnalyzeResult(result?.analyzeResult));
        this.setState({
            tags,
            analyzeResult: result.analyzeResult,
            predictionLoaded: true,
            isPredicting: false,
            fileLoaded: true
        }, () => {
            this.layoutHelper.setLayoutData(result);
            this.layoutHelper.drawLayout(this.state.currentPage);
            this.drawPredictionResult();
            this.displayFreeResourceWarningIfNecessary()
        });
    }

    private handlePredictionError = (error) => {
        let alertMessage = "";
        if (error?.errorCode === ErrorCode.PredictWithoutTrainForbidden) {
            alertMessage = strings.errors.predictWithoutTrainForbidden.message;
        } else if (error?.errorCode === ErrorCode.ModelNotFound) {
            alertMessage = error.message;
        } else if (error?.message) {
            alertMessage = error.message;
        } else if (error?.response) {
            alertMessage = error.response.data;
        } else {
            alertMessage = interpolate(strings.errors.endpointConnectionError.message, { endpoint: "form recognizer backend URL" });
        }
        this.setState({
            shouldShowAlert: true,
            alertTitle: "Prediction Failed",
            alertMessage,
            isPredicting: false,
        });
    }

    private handleClick = () => {
        this.setState({ predictionLoaded: false, isPredicting: true });
        this.getPrediction()
            .then(this.handlePredictionResult)
            .catch(this.handlePredictionError);
        if (this.appInsights) {
            this.appInsights.trackEvent({ name: "ANALYZE_EVENT" });
        }
    }

    private getTagsForPredictResults(predictions) {
        const tags: ITag[] = [];
        Object.keys(predictions).forEach((key, index) => {
            const color = getNextColor(tags);
            tags.push({
                name: key,
                color,
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
        const endpointURL = this.getComposedURL();
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
        const tag = this.state.tags.find((tag) => text.toLocaleLowerCase().startsWith(tag.name.toLocaleLowerCase()));
        const isHighlighted = (text.toLocaleLowerCase() === this.state.highlightedField?.toLocaleLowerCase());
        feature.setProperties({
            color: _.get(tag, "color", "#333333"),
            fieldName: text,
            isHighlighted,
        });
        return feature;
    }

    private featureStyler = (feature) => {
        if (feature.get("fieldName")) {
            return new Style({
                stroke: new Stroke({
                    color: feature.get("color"),
                    width: feature.get("isHighlighted") ? 4 : 2,
                }),
                fill: new Fill({
                    color: "rgba(255, 255, 255, 0)",
                }),
            });
        } else {
            return new Style({
                stroke: new Stroke({
                    color: "#fffc7f",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(255, 252, 127, 0.2)",
                }),
            });
        }
    }

    private drawPredictionResult = (): void => {
        // Comment this line to prevent clear OCR boundary boxes.
        // this.imageMap.removeAllFeatures();
        const features = [];
        const imageExtent = [0, 0, this.state.imageWidth, this.state.imageHeight];
        this.tableHelper.drawTables(this.state.currentPage);
        const isCurrentPage = result => result.page === this.state.currentPage;
        const ocrForCurrentPage: any = this.getOcrFromAnalyzeResult(this.state.analyzeResult).find(isCurrentPage);
        if (ocrForCurrentPage) {
            const ocrExtent = [0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height];
            const createFeature = (fieldName, field) => {
                if (field && field.type === "array") {
                    field.valueArray?.forEach(row => createFeature(fieldName, row))
                } else {
                    if (_.get(field, "page", null) === this.state.currentPage) {
                        const text = fieldName;
                        const boundingbox = _.get(field, "boundingBox", []);
                        const feature = this.createBoundingBoxVectorFeature(text, boundingbox, imageExtent, ocrExtent);
                        features.push(feature);
                    }
                }
            }
            const predictions = this.flatFields(this.getPredictionsFromAnalyzeResult(this.state.analyzeResult));
            for (const [fieldName, field] of Object.entries(predictions)) {
                createFeature(fieldName, field);
            }
            this.imageMap.addFeatures(features);
        }
    }

    private flatFields = (fields: object = {}): { [key: string]: (object[] | object) } => {
        /**
         * @param fields: primitive types, object types likes array, object, and root level field
         * @return flattenfields, a field props or an array of field props
         */
        const flattedFields = {};
        const isSupportField = fieldName => {
            // Define list of unsupported field names.
            const blockedFieldNames = ["ReceiptType"];
            return blockedFieldNames.indexOf(fieldName) === -1;
        }
        const isRootItemObject = obj => obj.hasOwnProperty("text");
        const docType = _.get(this.state.analyzeResult, "documentResults[0].docType", "");

        // flat fieldProps of type "array" and "object", and extract root level field props in "object" type
        const flatFieldProps = (displayName, fieldProps) => {
            if (isSupportField(displayName)) {
                switch (_.get(fieldProps, "type", "")) {
                    case "array": {
                        if (docType === "prebuilt:invoice" && displayName === "Items") {
                            flattedFields[displayName] = fieldProps;
                        } else {
                            const valueArray = _.get(fieldProps, "valueArray", []);
                            for (const [index, valueArrayItem] of valueArray.entries()) {
                                flatFieldProps(`${displayName} ${index + 1}`, valueArrayItem);
                            }
                        }
                        break;
                    }
                    case "object": {
                        // root level field props
                        const { type, valueObject, ...restProps } = fieldProps;
                        if (isRootItemObject(restProps)) {
                            flatFieldProps(displayName, restProps);
                        }
                        for (const [fieldName, objFieldProps] of Object.entries(valueObject || {})) {
                            flatFieldProps(`${displayName}: ${fieldName}`, objFieldProps);
                        }
                        break;
                    }
                    default: {
                        flattedFields[displayName] = fieldProps;
                    }
                }
            }
        }
        for (const [fieldName, fieldProps] of Object.entries(fields)) {
            flatFieldProps(fieldName, fieldProps);
        }
        return flattedFields;
    }

    private getPredictionsFromAnalyzeResult(analyzeResult: any) {
        if (analyzeResult) {
            const documentResults = _.get(analyzeResult, "documentResults", []);
            return documentResults.reduce((accFields, documentResult) => ({ ...accFields, ...documentResult.fields }), {});
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
    private displayFreeResourceWarningIfNecessary = () => {
        if (this.getOcrFromAnalyzeResult(this.state.analyzeResult).length === 2 && this.state.numPages > 2) {
            this.setState({
                alertMessage: strings.prebuiltPredict.pdfPageNumberLimit,
                shouldShowAlert: true,
            });
        }
    }
    private setPredictedFieldHighlightStatus = (highlightedField: string) => {
        const features = this.imageMap.getAllFeatures();
        for (const feature of features) {
            const fieldName = feature.get("fieldName");
            if (fieldName && fieldName.toLocaleLowerCase() === highlightedField.toLocaleLowerCase()) {
                feature.set("isHighlighted", true);
            } else {
                feature.set("isHighlighted", false);
            }
        }
    }

    private handleUpdateRequestURI = (updateEmptyQuery: boolean = true) => {
        this.setState({ predictionEndpointUrl: this.getUpdatedRequestURI(false, updateEmptyQuery) });
    }

    private getUpdatedRequestURI = (fromTextArea: boolean = false, updateEmptyQuery: boolean = true) => {
        const { predictionEndpointUrl } = this.state;
        const [path, queryString] = predictionEndpointUrl.split("?");
        const newPath = this.getUpdatedPath(path, fromTextArea);
        const newQueryString = this.getUpdatedQueryString(queryString, updateEmptyQuery);
        return `${newPath}?${newQueryString}`;
    }

    private getUpdatedPath(path: string, fromTextArea: boolean): string {
        const pathTemplate = "/formrecognizer/:prebuiltServiceVersion/prebuilt/:prebuiltType/analyze";
        const normalizedPath = URIUtils.normalizePath(path);
        const pathParams = URIUtils.matchPath(pathTemplate, normalizedPath);
        if (fromTextArea) {
            const prebuiltType = _.get(pathParams, "prebuiltType", "");
            if (prebuiltType && prebuiltType !== this.state.currentPrebuiltType.servicePath) {
                const ret = this.prebuiltTypes.filter(item => item.servicePath === prebuiltType);
                if (ret.length === 1) {
                    this.setState({ currentPrebuiltType: ret[0] });
                }
            }
        } else {
            pathParams["prebuiltType"] = this.state.currentPrebuiltType.servicePath;
        }
        const defaultPathParams = {
            prebuiltServiceVersion: constants.apiVersion,
            prebuiltType: this.state.currentPrebuiltType.servicePath
        };

        return URIUtils.compilePath(pathTemplate, pathParams, defaultPathParams);
    }

    private getUpdatedQueryString(queryString: string, updateEmptyQuery: boolean): string {
        let newQueryString = "";
        if (queryString) {
            const parameterArray = queryString.includes("&") ? queryString.split("&") : [queryString];
            let connector = "";
            for (const parameter of parameterArray) {
                const name = parameter.split("=")[0];
                if (name !== "locale" && name !== constants.pages) {
                    newQueryString += `${connector}${parameter}`;
                    connector = "&";
                }
            }
            if (this.state.withPageRange && this.state.pageRangeIsValid) {
                newQueryString += `${connector}${constants.pages}=${this.state.pageRange}`;
                connector = "&";
            }
            if (this.state.currentPrebuiltType.useLocale) {
                newQueryString += `${connector}locale=${this.state.currentLocale}`;
            }
        } else if (!updateEmptyQuery) {
            let connector = "";
            if (this.state.withPageRange && this.state.pageRangeIsValid) {
                newQueryString += `${constants.pages}=${this.state.pageRange}`;
                connector = "&";
            }
            newQueryString += this.state.currentPrebuiltType.useLocale ? `${connector}locale=${this.state.currentLocale}` : "";
        }
        return newQueryString;
    }

    private getComposedURL = () => {
        const uri = this.getUpdatedRequestURI(true);
        return this.props.prebuiltSettings.serviceURI.replace(/\/+$/, "") + "/" + uri.replace(/(\r\n|\n|\r)/gm, "").replace(/^\/+/, "");
    }

    private setRequestURI = (e, newValue?) => {
        this.setState({
            predictionEndpointUrl: newValue
        });
    }

    private onTablePredictionClick = (predictedItem: ITableResultItem, tagColor: string) => {
        const makeTable = (clickedFieldName) => {
            function Cell(rowIndex, columnIndex, text = null, confidence = null, isHeader = false) {
                this.rowIndex = rowIndex;
                this.columnIndex = columnIndex;
                this.text = text;
                this.confidence = confidence;
                this.isHeader = isHeader;
            }

            const valueArray = clickedFieldName.valueArray || [];
            const reOrderColumnHeaders = columnHeaders => {
                const headers = Array.from(columnHeaders);
                const fixedColumns = [];
                const fixedColumnHeaders = ["Date", "ProductCode", "Description", "UnitPrice", "Quantity", "Unit", "Tax", "Amount"];
                for (const expectColumn of fixedColumnHeaders) {
                    const index = headers.indexOf(expectColumn);
                    if (index >= 0) {
                        fixedColumns.push(expectColumn);
                        headers.splice(index, 1);
                    }
                }
                return [...fixedColumns, ...headers];
            }
            const collectHeaders = valueArray => {
                const headers = new Set();
                valueArray.map(item => Object.keys(_.get(item, "valueObject", [])).map(column => headers.add(column)));
                return headers;
            }
            const columnNames = reOrderColumnHeaders(collectHeaders(valueArray));
            const columnHeaders = function makeColumnHeaders() {
                const indexColumn = new Cell(0, 0, "");
                const contentColumns = columnNames.map((columnName, columnIndex) => new Cell(0, columnIndex + 1, columnName, null, true));
                return [indexColumn, ...contentColumns];
            }()
            const matrix: any[] = [columnHeaders];
            for (let i = 0; i < valueArray.length; i++) {
                const valueObject = valueArray[i].valueObject || {};
                const indexColumn = new Cell(i + 1, 0, `#${i + 1}`, null, true);
                const contentColumns = columnNames.map((columnName, columnIndex) => {
                    const { text, confidence } = valueObject[columnName] || {};
                    return new Cell(i + 1, columnIndex + 1, text, confidence);
                });
                matrix.push([indexColumn, ...contentColumns]);
            }
            const flattenCells = matrix.reduce((cells, row) => cells = [...cells, ...row], []);
            return { cells: flattenCells, columns: matrix[0].length, rows: matrix.length, fieldName: clickedField, tagColor };
        }

        const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);
        const clickedFieldName = predictedItem?.fieldName;
        const clickedField = predictions[clickedFieldName];
        const regionalTableToView = makeTable(clickedField);
        this.setState({ viewRegionalTable: true, regionalTableToView });
    }

    private onTablePredictionClose = () => {
        this.setState({ viewRegionalTable: false, regionalTableToView: null })
    }
}
