import {
    DefaultButton,
    Dropdown,
    FontIcon,
    IconButton,
    IDropdownOption,
    PrimaryButton,
    TextField
} from "@fluentui/react";
import _ from "lodash";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import React, {RefObject} from "react";
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import url from "url";
import {constants} from "../../../../common/constants";
import {strings} from "../../../../common/strings";
import {
    getGreenWithWhiteBackgroundTheme,
    getPrimaryGreenTheme,
    getPrimaryGreyTheme,
    getPrimaryWhiteTheme
} from "../../../../common/themes";
import {
    IApplicationState,
    ImageMapParent,
    IPrebuiltSettings
} from "../../../../models/applicationState";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import IAppPrebuiltSettingsActions, * as appPrebuiltSettingsActions from "../../../../redux/actions/prebuiltSettingsActions";
import ServiceHelper from "../../../../services/serviceHelper";
import {ImageMap} from "../../common/imageMap/imageMap";
import {CanvasCommandBar} from "../editorPage/canvasCommandBar";
import {ILoadFileHelper, LoadFileHelper} from "./LoadFileHelper";

interface ITextTablePageProps {
    prebuiltSettings: IPrebuiltSettings;
    appTitleActions: IAppTitleActions;
    actions: IAppPrebuiltSettingsActions;
}
interface ITextTablePageState {
    file?: File;
    currPage: number;
    fileLoaded: boolean;
    sourceOption: string;
    inputedFileURL: string;
    inputedLocalFile: string;
    fileLabel: string;
    analyzeResult: object;
    fileChanged: boolean;
    analyzeRun: boolean;
    isAnalyzing: boolean;
    fetchedFileURL: string;
    analyzationLoaded: boolean;
    shouldShowAlert: boolean;
    alertTitle: string;
    alertMessage: string;
    highlightedField: string;
    invalidFileFormat: boolean;

    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    imageAngle: number;

    showInputedAPIKey: boolean;

    isFetching: boolean;
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
    state: ITextTablePageState = {
        showInputedAPIKey: false,
        sourceOption: "localFile",
        fileLoaded: false,
        isFetching: false,
        fetchedFileURL: "",
        inputedFileURL: strings.prebuiltPredict.defaultURLInput,
        inputedLocalFile: strings.prebuiltPredict.defaultLocalFileInput,
        analyzeResult: null,
        fileLabel: "",
        analyzationLoaded: true,
        currPage: undefined,
        imageUri: null,
        imageWidth: 0,
        imageHeight: 0,
        shouldShowAlert: false,
        invalidFileFormat: false,
        alertTitle: "",
        alertMessage: "",
        fileChanged: false,
        analyzeRun: false,
        isAnalyzing: false,
        highlightedField: "",
        imageAngle: 0,
    };
    private imageMap: ImageMap;
    // private currPdf: any;
    private tiffImages: any[];
    private fileInput: RefObject<HTMLInputElement> = React.createRef();
    private fileHelper: ILoadFileHelper = new LoadFileHelper();

    componentDidMount() {
        document.title = strings.prebuiltPredict.title + " - " + strings.appName;
        this.props.appTitleActions.setTitle(`${strings.prebuiltPredict.title}`);
    }
    async componentDidUpdate(prevProps, prevState) {
        if (this.state.file) {
            if (this.state.fileChanged) {
                this.fileHelper.reset();
                this.loadFile(this.state.file).then(() => {
                    this.setState({
                        fileChanged: false,
                        fileLoaded: true
                    });
                });

            }
            else if (prevState.currPage !== this.state.currPage) {
                if (this.fileHelper.currPdf) {
                    this.fileHelper.loadPdfPage(this.state.currPage)
                        .then((res: any) => {
                            this.setState({
                                ...res
                            });
                        });
                }
                else if (this.tiffImages.length > 0) {
                    this.fileHelper.loadTiffPage(this.state.currPage)
                        .then((res: any) => {
                            this.setState({...res});
                        });
                }
            }
        }
    }

    render() {
        const browseFileDisabled: boolean = !this.state.analyzationLoaded;
        const urlInputDisabled: boolean = !this.state.analyzationLoaded ||
            this.state.isFetching;

        const analyzeDisabled: boolean = !this.state.analyzationLoaded ||
            !this.state.file ||
            this.state.invalidFileFormat ||
            !this.props.prebuiltSettings.apiKey ||
            !this.props.prebuiltSettings.serviceURI ||
            !this.state.fileLoaded;

        const fetchDisabled: boolean = !this.state.analyzationLoaded ||
            this.state.isFetching ||
            this.state.inputedFileURL.length === 0 ||
            this.state.inputedFileURL === strings.prebuiltPredict.defaultURLInput;

        const sourceOptions: IDropdownOption[] = [
            {key: "localFile", text: "Local file"},
            {key: "url", text: "URL"},
        ];

        return (
            <>
                <div
                    className={`predict skipToMainContent`}
                    id="pagePredict"
                    style={{display: "flex"}} >
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
                            <div className="p-3" style={{marginTop: "8px"}}>
                                <h5>Service configuration</h5>
                                <div style={{marginBottom: "3px"}}>Form recognizer service endpoint</div>
                                <TextField
                                    className="mb-1"
                                    theme={getGreenWithWhiteBackgroundTheme()}
                                    value={this.props.prebuiltSettings?.serviceURI}
                                    onChange={this.setInputedServiceURI}
                                    disabled={this.state.isAnalyzing}
                                />
                                <div style={{marginBottom: "3px"}}>API key</div>
                                <div className="apikeyContainer">
                                    <TextField
                                        className="apikey"
                                        theme={getGreenWithWhiteBackgroundTheme()}
                                        type={this.state.showInputedAPIKey ? "text" : "password"}
                                        value={this.props.prebuiltSettings?.apiKey}
                                        onChange={this.setInputedAPIKey}
                                        disabled={this.state.isAnalyzing}
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
                            <div className="p-3" style={{marginTop: "8px"}}>
                                <h5>
                                    Upload file and run analysis
                                        </h5>
                                <div style={{marginBottom: "3px"}}>Image source</div>
                                <div className="container-space-between">
                                    <Dropdown
                                        className="sourceDropdown"
                                        selectedKey={this.state.sourceOption}
                                        options={sourceOptions}
                                        disabled={this.state.isAnalyzing || this.state.isFetching}
                                        onChange={this.onSelectSourceChanged}
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
                                            style={{cursor: (browseFileDisabled ? "default" : "pointer")}}
                                            onClick={this.handleDummyInputClick}
                                            readOnly={true}
                                            aria-label={strings.prebuiltPredict.uploadFile}
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
                                                aria-label={strings.prebuiltPredict.uploadFile}
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
                                        iconProps={{iconName: "Insights"}}
                                        text="Run analysis"
                                        aria-label={!this.state.analyzationLoaded ? strings.prebuiltPredict.inProgress : ""}
                                        allowDisabledFocus
                                        disabled={analyzeDisabled}
                                        onClick={this.handleClick}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </>
        )
    }

    private setInputedServiceURI = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        this.props.actions.update({...this.props.prebuiltSettings, serviceURI: newValue});

    }

    private setInputedAPIKey = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        this.props.actions.update({...this.props.prebuiltSettings, apiKey: newValue});
    }

    private renderImageMap = () => {
        return (
            <div style={{width: "100%", height: "100%"}}>
                <CanvasCommandBar
                    handleZoomIn={this.handleCanvasZoomIn}
                    handleZoomOut={this.handleCanvasZoomOut}
                    handleRotateImage={this.handleRotateCanvas}
                    // parentPage={"predict"}
                    showLayerMenu={true}
                    layers={{}}
                />
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

    private handleCanvasZoomIn = () => {
        this.imageMap.zoomIn();
    }

    private handleCanvasZoomOut = () => {
        this.imageMap.zoomOut();
    }

    private handleRotateCanvas = (degrees: number) => {
        this.setState({ imageAngle: this.state.imageAngle + degrees });
    }

    private noOp = () => {
        // no operation
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
                    iconProps={{iconName: "ChevronRight"}}
                />
            );
        } else {
            return <div></div>;
        }
    }

    private getPageCount() {
        return this.fileHelper.getPageCount();
    }

    private toggleAPIKeyVisibility = () => {
        this.setState({
            showInputedAPIKey: !this.state.showInputedAPIKey,
        });
    }

    private async copyKey() {
        const clipboard = (navigator as any).clipboard;
        if (clipboard && clipboard.writeText && typeof clipboard.writeText === "function") {
            await clipboard.writeText(this.props.prebuiltSettings.apiKey);
        }
    }

    onSelectSourceChanged = (e: React.FormEvent<HTMLDivElement>, option) => {
        e.preventDefault();
        if (option.key !== this.state.sourceOption) {
            this.setState({
                sourceOption: option.key,
                inputedFileURL: strings.prebuiltPredict.defaultURLInput,
                inputedLocalFile: strings.prebuiltPredict.defaultLocalFileInput,
                fileLabel: "",
                currPage: undefined,
                analyzeResult: null,
                fileChanged: true,
                file: undefined,
                analyzeRun: false,
                isFetching: false,
                fetchedFileURL: "",
                analyzationLoaded: true,
                imageUri: null,
                imageWidth: 0,
                imageHeight: 0,
                shouldShowAlert: false,
                alertTitle: "",
                alertMessage: "",
                isAnalyzing: false,
                highlightedField: "",
            });
        }
    }

    private handleFileChange = () => {
        if (this.fileInput.current.value !== "") {
            this.setState({invalidFileFormat: false});
            const fileName = this.fileInput.current.value.split("\\").pop();
            if (fileName !== "") {
                this.setState({
                    inputedLocalFile: fileName,
                    fileLabel: fileName,
                    currPage: 1,
                    analyzeResult: null,
                    fileChanged: true,
                    file: this.fileInput.current.files[0],
                    analyzeRun: false,
                    fileLoaded: false,
                }, () => {
                    if (this.imageMap) {
                        this.imageMap.removeAllFeatures();
                    }
                });
            }
        }
    }

    private handleDummyInputClick = () => {
        document.getElementById("hiddenInputFile").click();
    }

    private removeDefaultInputedFileURL = () => {
        if (this.state.inputedFileURL === strings.prebuiltPredict.defaultURLInput) {
            this.setState({inputedFileURL: ""});
        }
    }

    private setInputedFileURL = (event) => {
        this.setState({inputedFileURL: event.target.value});
    }

    private getFileFromURL = () => {
        this.setState({isFetching: true});
        fetch(this.state.inputedFileURL, {headers: {Accept: "application/pdf, image/jpeg, image/png, image/tiff"}})
            .then(async (response) => {
                if (!response.ok) {
                    this.setState({
                        isFetching: false,
                        shouldShowAlert: true,
                        alertTitle: "Failed to fetch",
                        alertMessage: response.status.toString() + " " + response.statusText,
                        isAnalyzing: false,
                    });
                    return;
                }
                const contentType = response.headers.get("Content-Type");
                if (!["application/pdf", "image/jpeg", "image/png", "image/tiff"].includes(contentType)) {
                    this.setState({
                        isFetching: false,
                        shouldShowAlert: true,
                        alertTitle: "Content-Type not supported",
                        alertMessage: "Content-Type " + contentType + " not supported",
                        isAnalyzing: false,
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
                        analyzeRun: false,
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
                        isAnalyzing: false,
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
    private handleClick = () => {
        this.setState({analyzationLoaded: false, isAnalyzing: true});
        this.getAnalzation()
            .then((result) => {
                // const tags = this.getTagsForPredictResults(
                //     this.getPredictionsFromAnalyzeResult(result),
                // );
                // this.setState({
                //     tags,
                //     analyzeResult: result,
                //     predictionLoaded: true,
                //     predictRun: true,
                //     isPredicting: false,
                // }, () => {
                //     this.drawPredictionResult();
                // });
            }).catch((error) => {
                // let alertMessage = "";
                // if (error.response) {
                //     alertMessage = error.response.data;
                // } else if (error.errorCode === ErrorCode.PredictWithoutTrainForbidden) {
                //     alertMessage = strings.errors.predictWithoutTrainForbidden.message;
                // } else if (error.errorCode === ErrorCode.ModelNotFound) {
                //     alertMessage = error.message;
                // } else {
                //     alertMessage = interpolate(strings.errors.endpointConnectionError.message, {endpoint: "form recognizer backend URL"});
                // }
                // this.setState({
                //     shouldShowAlert: true,
                //     alertTitle: "Prediction Failed",
                //     alertMessage,
                //     isPredicting: false,
                // });
            });
        // if (this.appInsights) {
        //     this.appInsights.trackEvent({name: "ANALYZE_EVENT"});
        // }
    }

    private async getAnalzation(): Promise<any> {
        let endpointURL;
        let apiKey;

        endpointURL = url.resolve(
            this.props.prebuiltSettings.serviceURI,
            `/formrecognizer/${constants.prebuiltServiceVersion}`,
        );
        apiKey = this.props.prebuiltSettings.apiKey;

        let headers;
        let body;
        if (this.state.sourceOption === "localFile") {
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
        return this.poll(() =>
            ServiceHelper.getWithAutoRetry(
                operationLocation, {headers}, apiKey as string), 120000, 500);
    }

    private loadFile = async (file: File) => {

        const result: any = Object.assign({}, await this.fileHelper.loadFile(file));
        if (result) {
            this.setState({...result});
        }
    }

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
}
