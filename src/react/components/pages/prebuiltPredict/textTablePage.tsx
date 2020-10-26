import {
    FontIcon,
    IconButton,
    PrimaryButton,
    Spinner,
    SpinnerSize
} from "@fluentui/react";
import {Feature} from "ol";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import React from "react";
import {connect} from "react-redux";
import {RouteComponentProps} from "react-router-dom";
import {bindActionCreators} from "redux";
import url from "url";
import {constants} from "../../../../common/constants";
import {interpolate, strings} from "../../../../common/strings";
import {
    getPrimaryWhiteTheme
} from "../../../../common/themes";
import {
    ErrorCode,
    IApplicationState,
    IPrebuiltSettings
} from "../../../../models/applicationState";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import IAppPrebuiltSettingsActions, * as appPrebuiltSettingsActions from "../../../../redux/actions/prebuiltSettingsActions";
import ServiceHelper from "../../../../services/serviceHelper";
import {ImageMap} from "../../common/imageMap/imageMap";
import {CanvasCommandBar} from "../editorPage/canvasCommandBar";
import {FilePicker} from "./filePicker";
import {ILoadFileHelper, LoadFileHelper} from "./LoadFileHelper";
import {IOcrHelper, OcrHelper} from "./ocrHelper";
import {PrebuiltSetting} from "./prebuiltSetting";
import {poll} from "./utils";

interface ITextTablePageProps extends RouteComponentProps {
    prebuiltSettings: IPrebuiltSettings;
    appTitleActions: IAppTitleActions;
    actions: IAppPrebuiltSettingsActions;
}

interface ITextTablePageState {
    layers: any;

    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    currentPage: number;
    pageCount: number;

    shouldShowAlert: boolean;
    alertTitle: string;
    alertMessage: string;
    invalidFileFormat?: boolean;

    fileLabel: string;
    fileChanged: boolean;
    file?: File;
    isFetching?: boolean;
    fileLoaded?: boolean;

    isAnalyzing: boolean;
    analyzationLoaded: boolean;
    fetchedFileURL: string;

    imageAngle: number;
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
export class TextTablePage extends React.Component<Partial<ITextTablePageProps>, ITextTablePageState>{
    private ocrHelper: IOcrHelper;

    state: ITextTablePageState = {
        imageUri: null,
        imageWidth: 0,
        imageHeight: 0,
        currentPage: 1,
        pageCount: 1,

        shouldShowAlert: false,
        alertTitle: "",
        alertMessage: "",

        fileLabel: "",
        fileChanged: false,

        isAnalyzing: false,
        analyzationLoaded: false,
        fetchedFileURL: "",
        imageAngle: 0,

        layers: {text: true, tables: true, checkboxes: true, label: true, drawnRegions: true},
    };

    private imageMap: ImageMap;
    private fileHelper: ILoadFileHelper = new LoadFileHelper();

    componentDidMount() {
        document.title = strings.prebuiltPredict.title + " - " + strings.appName;
        this.props.appTitleActions.setTitle(`OCR`);
    }
    componentDidUpdate(_prevProps: ITextTablePageProps, prevState: ITextTablePageState) {
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
        }
    }

    private loadFile = (file: File) => {
        this.setState({isFetching: true});
        this.fileHelper.loadFile(file)
            .then((res: any) => {
                if (res) {
                    this.setState({
                        ...res,
                        isFetching: false,
                        fileChanged: false
                    });
                }
            });
    }

    render() {
        const analyzeDisabled: boolean = this.state.isFetching || !this.state.file
            || this.state.invalidFileFormat ||
            !this.state.fileLoaded ||
            this.state.isAnalyzing ||
            !this.props.prebuiltSettings.apiKey ||
            !this.props.prebuiltSettings.serviceURI;

        const showPage: boolean = this.props.match.path.includes("text-and-tables");

        return (
            <>
                <div
                    className={`predict skipToMainContent ${showPage ? "" : "hidden"} `}
                    id="pagePredict"
                    style={{display: `${showPage ? "flex" : "none"}`}} >
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
                                disabled={this.state.isFetching || this.state.isAnalyzing}
                                actions={this.props.actions}
                            />
                            <div className="p-3" style={{marginTop: "8px"}}>
                                <h5>Upload file and run analysis</h5>
                                <FilePicker
                                    disabled={this.state.isFetching || this.state.isAnalyzing}
                                    onFileChange={(data) => this.onFileChange(data)}
                                    onSelectSourceChange={() => this.onSelectSourceChange()}
                                    onError={(err) => this.onFileLoadError(err)} />
                                <div className="container-items-end predict-button">
                                    <PrimaryButton
                                        theme={getPrimaryWhiteTheme()}
                                        iconProps={{iconName: "Insights"}}
                                        text="Run analysis"
                                        aria-label={!this.state.analyzationLoaded ? strings.prebuiltPredict.inProgress : ""}
                                        allowDisabledFocus
                                        disabled={analyzeDisabled}
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
                                {this.state.isAnalyzing &&
                                    <div className="loading-container">
                                        <Spinner
                                            label={strings.prebuiltPredict.inProgress}
                                            ariaLive="assertive"
                                            labelPosition="right"
                                            size={SpinnerSize.large}
                                        />
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                </div>
            </>
        )
    }
    onFileChange(data: {
        file: File,
        fileLabel: string,
        fetchedFileURL: string
    }): void {
        this.setState({
            currentPage: 1,
            // ocr: null,
            fileChanged: true,
            ...data,
            analyzationLoaded: false,
            fileLoaded: false,
        }, () => {
            this.ocrHelper?.reset();
        });
    }

    onSelectSourceChange(): void {
        this.setState({
            file: undefined,
            // ocr: {},
            analyzationLoaded: false,
        });
        // if (this.imageMap) {
        //     this.imageMap.removeAllFeatures();
        // }
    }

    onFileLoadError(err: {alertTitle: string; alertMessage: string;}): void {
        this.setState({
            ...err,
            shouldShowAlert: true,
            analyzationLoaded: false,
        });
    }

    private renderImageMap = () => {
        return (
            <div style={{width: "100%", height: "100%"}}>
                <CanvasCommandBar
                    handleZoomIn={this.handleCanvasZoomIn}
                    handleZoomOut={this.handleCanvasZoomOut}
                    handleRotateImage={this.handleRotateCanvas}
                    handleLayerChange={this.handleLayerChange}
                    showLayerMenu={true}
                    layers={this.state.layers}
                />
                <ImageMap
                    ref={(ref) => this.imageMap = ref}
                    imageUri={this.state.imageUri || ""}
                    imageWidth={this.state.imageWidth}
                    imageHeight={this.state.imageHeight}
                    imageAngle={this.state.imageAngle}
                    initOcrMap={true}
                    handleIsSnapped={this.handleIsSnapped}
                    handleIsPointerOnImage={this.handleIsPointerOnImage}
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

    private handleRotateCanvas = (degrees: number) => {
        this.setState({imageAngle: this.state.imageAngle + degrees});
    }
    private handleLayerChange = (layer: string) => {
        switch (layer) {
            case "text":
                this.imageMap.toggleTextFeatureVisibility();
                break;
            case "tables":
                this.imageMap.toggleTableFeatureVisibility();
                break;
            case "checkboxes":
                this.imageMap.toggleCheckboxFeatureVisibility();
                break;
            case "label":
                this.imageMap.toggleLabelFeatureVisibility();
                break;
            case "drawnRegions":
                this.imageMap.toggleDrawnRegionsFeatureVisibility();
                break;
        }
        const newLayers = Object.assign({}, this.state.layers);
        newLayers[layer] = !newLayers[layer];
        this.setState({
            layers: newLayers,
        });
    }
    private handleIsSnapped = (snapped: boolean) => {
        // if (this.state.isSnapped !== snapped) {
        //     this.setState({
        //         isSnapped: snapped,
        //     })
        // }
    }
    private handleIsPointerOnImage = (isPointerOnImage: boolean) => {
        // if (this.state.isPointerOnImage !== isPointerOnImage) {
        //     this.setState({
        //         isPointerOnImage,
        //     });
        // }
    }
    private noOp = () => {
        // no operation
    }

    private renderPrevPageButton = () => {
        const prevPage = () => {
            this.goToPage(Math.max(1, this.state.currentPage - 1));
        };

        if (this.state.currentPage > 1) {
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
        const numPages = this.getPageCount();
        const nextPage = () => {
            this.goToPage(Math.min(this.state.currentPage + 1, numPages));
        };

        if (this.state.currentPage < numPages) {
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

    private renderPageIndicator = () => {
        const pageCount = this.getPageCount();
        return pageCount > 1 ?
            <p className="page-number">
                Page {this.state.currentPage} of {pageCount}
            </p> : <div></div>;
    }

    private getPageCount = () => {
        return this.fileHelper.getPageCount();
    }

    private goToPage = async (targetPage: number) => {
        if (targetPage <= 0 || targetPage > this.getPageCount()) {
            return;
        }
        this.setState({
            currentPage: targetPage,
            // ocrForCurrentPage: this.getOcrResultForPage(this.state.ocr, targetPage),
        }, () => {
            this.ocrHelper?.drawOcr(targetPage);
        });
    }

    private handleClick = () => {
        this.setState({analyzationLoaded: false, isAnalyzing: true});
        this.getAnalzation()
            .then((ocr) => {
                this.setState({
                    isAnalyzing: false,
                    analyzationLoaded: true,
                }, () => {
                    this.ocrHelper = new OcrHelper(ocr, this.imageMap);
                    this.ocrHelper.buildRegionOrders();
                    this.ocrHelper.drawOcr(this.state.currentPage);
                })
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
                    isAnalyzing: false,
                });
            });
    }


    private async getAnalzation(): Promise<any> {
        const endpointURL = url.resolve(
            this.props.prebuiltSettings.serviceURI,
            `/formrecognizer/${constants.prebuiltServiceVersion}/layout/analyze`,
        );
        const apiKey = this.props.prebuiltSettings.apiKey;

        const headers = {
            "Content-Type": this.state.file ? this.state.file.type : "application/json",
            "cache-control": "no-cache"
        };
        const body = this.state.file ?? ({source: this.state.fetchedFileURL});

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
}
