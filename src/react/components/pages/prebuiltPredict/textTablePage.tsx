import {
    FontIcon,
    IconButton,
    PrimaryButton,
    Spinner,
    SpinnerSize
} from "@fluentui/react";
import _ from "lodash";
import {Feature} from "ol";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import React, {RefObject} from "react";
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
import {PrebuiltSetting} from "./prebuiltSetting";

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
    ocr: any;
    ocrForCurrentPage: any;

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
    private regionOrders: Record<string, number>[] = [];

    private regionOrderById: string[][] = [];
    private tableIDToIndexMap: object;

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
        ocr: null,
        ocrForCurrentPage: {},
        imageAngle: 0,

        layers: {text: true, tables: true, checkboxes: true, label: true, drawnRegions: true},
    };
    private imageMap: ImageMap;
    private fileInput: RefObject<HTMLInputElement> = React.createRef();
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

    private getOcrResultForPage = (ocr: any, targetPage: number): any => {
        if (!ocr || !this.state.imageUri) {
            return {};
        }
        if (ocr.analyzeResult && ocr.analyzeResult.readResults) {
            // OCR schema with analyzeResult/readResults property
            const ocrResultsForCurrentPage = {};
            if (ocr.analyzeResult.pageResults) {
                ocrResultsForCurrentPage["pageResults"] = ocr.analyzeResult.pageResults[targetPage - 1];
            }
            ocrResultsForCurrentPage["readResults"] = ocr.analyzeResult.readResults[targetPage - 1];
            return ocrResultsForCurrentPage;
        }
        return {};
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

    private createBoundingBoxVectorFeature = (text, boundingBox, imageExtent, ocrExtent, page) => {
        const coordinates: any[] = [];
        const polygonPoints: number[] = [];
        const imageWidth = imageExtent[2] - imageExtent[0];
        const imageHeight = imageExtent[3] - imageExtent[1];
        const ocrWidth = ocrExtent[2] - ocrExtent[0];
        const ocrHeight = ocrExtent[3] - ocrExtent[1];

        for (let i = 0; i < boundingBox.length; i += 2) {
            // An array of numbers representing an extent: [minx, miny, maxx, maxy]
            coordinates.push([
                Math.round((boundingBox[i] / ocrWidth) * imageWidth),
                Math.round((1 - (boundingBox[i + 1] / ocrHeight)) * imageHeight),
            ]);
            polygonPoints.push(boundingBox[i] / ocrWidth);
            polygonPoints.push(boundingBox[i + 1] / ocrHeight);
        }

        const featureId = this.createRegionIdFromBoundingBox(polygonPoints, page);
        const feature = new Feature({
            geometry: new Polygon([coordinates]),
        });
        feature.setProperties({
            id: featureId,
            text,
            boundingbox: boundingBox,
            highlighted: false,
            isOcrProposal: true,
        });
        feature.setId(featureId);

        return feature;
    }
    private createRegionIdFromBoundingBox = (boundingBox: number[], page: number): string => {
        return boundingBox.join(",") + ":" + page;
    }

    render() {
        const analyzeDisabled: boolean = this.state.isFetching || !this.state.file
            || this.state.invalidFileFormat ||
            !this.state.fileLoaded ||
            this.state.isAnalyzing ||
            !this.props.prebuiltSettings.apiKey ||
            !this.props.prebuiltSettings.serviceURI;

        // const predictions = this.getPredictionsFromAnalyzeResult(this.state.ocr);
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
            ocr: null,
            fileChanged: true,
            ...data,
            analyzationLoaded: false,
            fileLoaded: false,
        }, () => {
            if (this.imageMap) {
                this.imageMap.removeAllFeatures();
            }
        });
    }

    onSelectSourceChange(): void {
        this.setState({
            file: undefined,
            ocr: {},
            analyzationLoaded: false,
        });
        if (this.imageMap) {
            this.imageMap.removeAllFeatures();
        }
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
            ocrForCurrentPage: this.getOcrResultForPage(this.state.ocr, targetPage),
        }, () => {
            this.imageMap.removeAllFeatures();
            this.drawOcr();
        });
    }

    private handleClick = () => {
        this.setState({analyzationLoaded: false, isAnalyzing: true});
        this.getAnalzation()
            .then((ocr) => {
                this.setState({
                    isAnalyzing: false,
                    ocr,
                    ocrForCurrentPage: this.getOcrResultForPage(ocr, this.state.currentPage),
                    analyzationLoaded: true,
                }, () => {
                    this.buildRegionOrders();
                    this.drawOcr();
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
    private buildRegionOrders = () => {
        // Build order index here instead of building it during 'drawOcr' for two reasons.
        // 1. Build order index for all pages at once. This allow us to support cross page
        //    tagging if it's supported by FR service.
        // 2. Avoid rebuilding order index when users switch back and forth between pages.
        const ocrs = this.state.ocr;
        const ocrReadResults = (ocrs.recognitionResults || (ocrs.analyzeResult && ocrs.analyzeResult.readResults));
        const ocrPageResults = (ocrs.recognitionResults || (ocrs.analyzeResult && ocrs.analyzeResult.pageResults));
        const imageExtent = this.imageMap.getImageExtent();
        ocrReadResults.forEach((ocr) => {
            const ocrExtent = [0, 0, ocr.width, ocr.height];
            const pageIndex = ocr.page - 1;
            this.regionOrders[pageIndex] = {};
            this.regionOrderById[pageIndex] = [];
            let order = 0;
            if (ocr.lines) {
                ocr.lines.forEach((line) => {
                    if (line.words) {
                        line.words.forEach((word) => {
                            if (this.shouldDisplayOcrWord(word.text)) {
                                const feature = this.createBoundingBoxVectorFeature(
                                    word.text, word.boundingBox, imageExtent, ocrExtent, ocr.page);
                                this.regionOrders[pageIndex][feature.getId()] = order++;
                                this.regionOrderById[pageIndex].push(feature.getId());
                            }
                        });
                    }
                });
            }
            const checkboxes = ocr.selectionMarks
                || (ocrPageResults && ocrPageResults[pageIndex] && ocrPageResults[pageIndex].checkboxes);
            if (checkboxes) {
                this.addCheckboxToRegionOrder(checkboxes, pageIndex, order, imageExtent, ocrExtent);
            }
        });
    }

    private shouldDisplayOcrWord = (text: string) => {
        const regex = new RegExp(/^[_]+$/);
        return !text.match(regex);
    }

    private addCheckboxToRegionOrder = (
        checkboxes: any[],
        pageIndex: number,
        order: number,
        imageExtent: number[],
        ocrExtent: any[]) => {
        checkboxes.forEach((checkbox) => {
            const checkboxFeature = this.createBoundingBoxVectorFeature(
                checkbox.state, checkbox.boundingBox, imageExtent, ocrExtent, this.state.currentPage);
            this.regionOrders[pageIndex][checkboxFeature.getId()] = order++;
            this.regionOrderById[pageIndex].push(checkboxFeature.getId());
        });
    }

    private drawOcr = () => {
        const textFeatures = [];
        const tableBorderFeatures = [];
        const tableIconFeatures = [];
        const tableIconBorderFeatures = [];
        const checkboxFeatures = [];
        const ocrReadResults = this.state.ocrForCurrentPage["readResults"];
        const ocrPageResults = this.state.ocrForCurrentPage["pageResults"];
        const imageExtent = this.imageMap.getImageExtent();
        if (ocrReadResults) {
            const ocrExtent = [0, 0, ocrReadResults.width, ocrReadResults.height];
            if (ocrReadResults.lines) {
                ocrReadResults.lines.forEach((line) => {
                    if (line.words) {
                        line.words.forEach((word) => {
                            if (this.shouldDisplayOcrWord(word.text)) {
                                textFeatures.push(this.createBoundingBoxVectorFeature(
                                    word.text, word.boundingBox, imageExtent, ocrExtent, ocrReadResults.page));
                            }
                        });
                    }
                });
            }
            this.tableIDToIndexMap = {};
            if (ocrPageResults && ocrPageResults.tables) {
                ocrPageResults.tables.forEach((table, index) => {
                    if (table.cells && table.columns && table.rows) {
                        const tableBoundingBox = this.getTableBoundingBox(table.cells.map((cell) => cell.boundingBox));
                        const createdTableFeatures = this.createBoundingBoxVectorTable(
                            tableBoundingBox,
                            imageExtent,
                            ocrExtent,
                            ocrPageResults.page,
                            table.rows,
                            table.columns,
                            index);
                        tableBorderFeatures.push(createdTableFeatures["border"]);
                        tableIconFeatures.push(createdTableFeatures["icon"]);
                        tableIconBorderFeatures.push(createdTableFeatures["iconBorder"]);
                    }
                });
            }

            if (ocrReadResults && ocrReadResults.selectionMarks) {
                ocrReadResults.selectionMarks.forEach((checkbox) => {
                    checkboxFeatures.push(this.createBoundingBoxVectorFeature(
                        checkbox.state, checkbox.boundingBox, imageExtent, ocrExtent, ocrReadResults.page));
                });
            } else if (ocrPageResults && ocrPageResults.checkboxes) {
                ocrPageResults.checkboxes.forEach((checkbox) => {
                    checkboxFeatures.push(this.createBoundingBoxVectorFeature(
                        checkbox.state, checkbox.boundingBox, imageExtent, ocrExtent, ocrPageResults.page));
                });
            }

            if (tableBorderFeatures.length > 0 && tableBorderFeatures.length === tableIconFeatures.length
                && tableBorderFeatures.length === tableIconBorderFeatures.length) {
                this.imageMap.addTableBorderFeatures(tableBorderFeatures);
                this.imageMap.addTableIconFeatures(tableIconFeatures);
                this.imageMap.addTableIconBorderFeatures(tableIconBorderFeatures);
            }
            if (textFeatures.length > 0) {
                this.imageMap.addFeatures(textFeatures);
            }
            if (checkboxFeatures.length > 0) {
                this.imageMap.addCheckboxFeatures(checkboxFeatures);
            }
        }
    }
    private getTableBoundingBox = (lines: []) => {
        const flattenedLines = [].concat(...lines);
        const xAxisValues = flattenedLines.filter((value, index) => index % 2 === 0);
        const yAxisValues = flattenedLines.filter((value, index) => index % 2 === 1);
        const left = Math.min(...xAxisValues);
        const top = Math.min(...yAxisValues);
        const right = Math.max(...xAxisValues);
        const bottom = Math.max(...yAxisValues);
        return ([left, top, right, top, right, bottom, left, bottom]);
    }

    private createBoundingBoxVectorTable = (boundingBox, imageExtent, ocrExtent, page, rows, columns, index) => {
        const coordinates: any[] = [];
        const polygonPoints: number[] = [];
        const imageWidth = imageExtent[2] - imageExtent[0];
        const imageHeight = imageExtent[3] - imageExtent[1];
        const ocrWidth = ocrExtent[2] - ocrExtent[0];
        const ocrHeight = ocrExtent[3] - ocrExtent[1];

        for (let i = 0; i < boundingBox.length; i += 2) {
            // An array of numbers representing an extent: [minx, miny, maxx, maxy]
            coordinates.push([
                Math.round((boundingBox[i] / ocrWidth) * imageWidth),
                Math.round((1 - (boundingBox[i + 1] / ocrHeight)) * imageHeight),
            ]);

            polygonPoints.push(boundingBox[i] / ocrWidth);
            polygonPoints.push(boundingBox[i + 1] / ocrHeight);
        }
        const tableID = this.createRegionIdFromBoundingBox(polygonPoints, page);
        this.tableIDToIndexMap[tableID] = index;
        const tableFeatures = {};
        tableFeatures["border"] = new Feature({
            geometry: new Polygon([coordinates]),
            id: tableID,
            state: "rest",
            boundingbox: boundingBox,
        });
        tableFeatures["icon"] = new Feature({
            geometry: new Point([coordinates[0][0] - 6.5, coordinates[0][1] - 4.5]),
            id: tableID,
            state: "rest",
        });

        const iconTR = [coordinates[0][0] - 5, coordinates[0][1]];
        const iconTL = [iconTR[0] - 31.5, iconTR[1]];
        const iconBL = [iconTR[0], iconTR[1] - 29.5];
        const iconBR = [iconTR[0] - 31.5, iconTR[1] - 29.5];

        tableFeatures["iconBorder"] = new Feature({
            geometry: new Polygon([[iconTR, iconTL, iconBR, iconBL]]),
            id: tableID,
            rows,
            columns,
        });

        tableFeatures["border"].setId(tableID);
        tableFeatures["icon"].setId(tableID);
        tableFeatures["iconBorder"].setId(tableID);
        return tableFeatures;
    }

    private async getAnalzation(): Promise<any> {
        const endpointURL = url.resolve(
            this.props.prebuiltSettings.serviceURI,
            `/formrecognizer/${constants.prebuiltServiceVersion}/layout/analyze`,
        );
        const apiKey = this.props.prebuiltSettings.apiKey;

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
        return this.poll(() =>
            ServiceHelper.getWithAutoRetry(
                operationLocation, {headers}, apiKey as string), 120000, 500);
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
