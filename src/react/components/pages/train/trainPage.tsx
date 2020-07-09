// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize} from "@fluentui/react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import {
    IApplicationState, IConnection, IProject, IAppSettings, FieldType, IAssetMetadata, IGenerator, ITag
} from "../../../../models/applicationState";
import TrainChart from "./trainChart";
import TrainPanel from "./trainPanel";
import TrainTable from "./trainTable";
import { ITrainRecordProps } from "./trainRecord";
import "./trainPage.scss";
import { strings } from "../../../../common/strings";
import { constants } from "../../../../common/constants";
import _ from "lodash";
import Alert from "../../common/alert/alert";
import url from "url";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import ServiceHelper from "../../../../services/serviceHelper";
import { getPrimaryGreenTheme } from "../../../../common/themes";
import { SkipButton } from "../../shell/skipButton";
import { AssetService } from "../../../../services/assetService";
import ProjectService from "../../../../services/projectService";
import Guard from "../../../../common/guard";
import { generate, generatorInfoToLabel, generatorInfoToOCRLines, IGeneratedInfo, matchBboxToOcr, isBoxCenterInBbox, fuzzyScaledBboxEqual, unionBbox, padBbox, scaleBbox, expandBbox, fuzzyBboxEqual, flattenOne, selectSomeWhenMultiple, mergeLabels } from "../../common/generators/generateUtils";
import { OCRService } from "../../../../services/ocrService";

const shouldGenerate = true;
const shouldGenerateForLabels = true;
const shouldExpandLabelGenerators = true;

export interface ITrainPageProps extends RouteComponentProps, React.Props<TrainPage> {
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    recentProjects: IProject[];
    appTitleActions: IAppTitleActions;
}

export interface ITrainPageState {
    trainMessage: string;
    isTraining: boolean;
    currTrainRecord: ITrainRecordProps;
    viewType: "chartView" | "tableView";
    showTrainingFailedWarning: boolean;
    trainingFailedMessage: string;
    hasCheckbox: boolean;
}

interface ITrainApiResponse {
    modelId: string;
    createdDateTime: string;
    averageModelAccuracy: number;
    fields: object[];
}

function mapStateToProps(state: IApplicationState) {
    return {
        appSettings: state.appSettings,
        project: state.currentProject,
        connections: state.connections,
        recentProjects: state.recentProjects,
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
export default class TrainPage extends React.Component<ITrainPageProps, ITrainPageState> {

    constructor(props) {
        super(props);

        this.state = {
            trainMessage: strings.train.notTrainedYet,
            isTraining: false,
            currTrainRecord: null,
            viewType: "tableView",
            showTrainingFailedWarning: false,
            trainingFailedMessage: "",
            hasCheckbox: false,
        };
    }

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);

            this.props.appTitleActions.setTitle(project.name);

            this.showCheckboxPreview(project);
            this.updateCurrTrainRecord(this.getProjectTrainRecord());
        }
        document.title = strings.train.title + " - " + strings.appName;
    }

    public render() {
        const currTrainRecord = this.state.currTrainRecord;

        return (
            <div className="train-page skipToMainContent" id="pageTrain">
                <main className="train-page-main">
                    {currTrainRecord &&
                        <div>
                            <h3> Train Result </h3>
                            <span> Model ID: {currTrainRecord.modelInfo.modelId} </span>
                        </div>
                    }
                    {this.state.viewType === "tableView" &&
                        <TrainTable
                            trainMessage={this.state.trainMessage}
                            accuracies={currTrainRecord && currTrainRecord.accuracies} />}

                    {this.state.viewType === "chartView" && currTrainRecord &&
                        <TrainChart
                            accuracies={currTrainRecord.accuracies}
                            modelId={currTrainRecord.modelInfo.modelId}
                            projectTags={this.props.project.tags} />
                    }
                </main>
                <div className="train-page-menu bg-lighter-1">
                    <div className="condensed-list">
                        <div className="condensed-list-body">
                            <div className="m-3">
                                <h4 className="text-shadow-none"> Train a new model </h4>
                                {this.state.hasCheckbox &&
                                    <div className="alert alert-warning warning train-notification">
                                        <FontIcon iconName="WarningSolid"></FontIcon>
                                        <span className="train-notification-text">
                                            {strings.train.backEndNotAvailable}
                                        </span>
                                    </div>}
                                {!this.state.isTraining ? (
                                    <PrimaryButton
                                        id="train_trainButton"
                                        theme={getPrimaryGreenTheme()}
                                        autoFocus={true}
                                        className="flex-center"
                                        onClick={this.handleTrainClick}>
                                        <FontIcon iconName="MachineLearning" />
                                        <h6 className="d-inline text-shadow-none ml-2 mb-0"> {strings.train.title} </h6>
                                    </PrimaryButton>
                                ) : (
                                    <div className="loading-container">
                                        <Spinner
                                            label="Training in progress..."
                                            ariaLive="assertive"
                                            labelPosition="right"
                                            size={SpinnerSize.large}
                                        />
                                    </div>
                                )
                                }
                            </div>
                            <div className={!this.state.isTraining ? "" : "greyOut"}>
                                {currTrainRecord &&
                                    <TrainPanel
                                        currTrainRecord={currTrainRecord}
                                        viewType={this.state.viewType}
                                        updateViewTypeCallback={this.handleViewTypeClick}
                                    />
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <Alert
                    show={this.state.showTrainingFailedWarning}
                    title="Training Failed"
                    message={this.state.trainingFailedMessage}
                    onClose={() => this.setState({ showTrainingFailedWarning: false })}
                />
                <PreventLeaving
                    when={this.state.isTraining}
                    message={"A training operation is currently in progress, are you sure you want to leave?"}
                />
            </div>
        );
    }

    private handleTrainClick = () => {
        this.setState({
            isTraining: true,
            trainMessage: strings.train.training,
        });

        this.trainProcess().then((trainResult) => {
            this.setState((prevState, props) => ({
                isTraining: false,
                trainMessage: this.getTrainMessage(trainResult),
                currTrainRecord: this.getProjectTrainRecord(),
            }));
        }).catch((err) => {
            this.setState({
                isTraining: false,
                trainMessage: err.message,
            });
        });
    }

    private handleViewTypeClick = (viewType: "tableView" | "chartView"): void => {
        this.setState({ viewType });
    }

    private async trainProcess(): Promise<any> {
        try {
            let sourcePrefix = this.props.project.folderPath ? this.props.project.folderPath : "";
            if (shouldGenerate) {
                sourcePrefix = await this.generateValues(sourcePrefix);
            }
            const trainRes = await this.train(sourcePrefix);
            console.log(trainRes.headers);
            const trainStatusRes =
                await this.getTrainStatus(trainRes.headers["location"]);
            const updatedProject = this.buildUpdatedProject(
                this.parseTrainResult(trainStatusRes),
            );
            await this.props.actions.saveProject(updatedProject, false, false);

            return trainStatusRes;
        } catch (errorMessage) {
            this.setState({
                showTrainingFailedWarning: true,
                trainingFailedMessage: (errorMessage !== undefined && errorMessage.message !== undefined
                    ? errorMessage.message : errorMessage),
            });
        }
    }

    private async generateValues(sourcePrefix: string): Promise<string> {
        // Generate values from project generators and create a new folder with the appropriate data
        /**
         * copy files over to folder
         * write new pdfs
         * call ocr service to regen
         * proper shouldGenerate clause
         */
        const assets = this.props.project.assets;
        Guard.null(assets);
        const generatePath = sourcePrefix.concat("/generated");
        // We need to iterate through the assets to get generator information
        // This will need an update if we refactor
        const assetService = new AssetService(this.props.project);
        const projectService = new ProjectService();
        const ocrService = new OCRService(this.props.project);
        const metadataDict: {[key: string]: IAssetMetadata} = {}
        // const metadatas = await Promise.all(Object.keys(assets).map(async (assetKey) => {
        await Promise.all(Object.keys(assets).map(async (assetKey) => {
            const asset = assets[assetKey];
            const metadata = await assetService.getAssetMetadata(asset);
            metadataDict[assetKey] = metadata;
            return metadata;
        }));

        const allFields = this.props.project.tags;
        // const allFields = [].concat.apply(this.props.project.tags, metadatas.map(m => m.generators));
        await projectService.deleteGeneratedFiles(generatePath, assetService.storageProvider);

        const fieldsPromise = projectService.saveFieldsFile(allFields, generatePath, assetService.storageProvider);

        const labelsAndOCRPromise = Promise.all(Object.keys(metadataDict).map(async (assetKey) => {
            const asset = assets[assetKey];
            const metadata = metadataDict[assetKey];

            const ocr = await ocrService.getRecognizedText(asset.path, asset.name); // this is the blob
            // somehow pages isn't tracked on the asset, so we find it here
            // just grab it from OCR since things are going to break if OCR isn't present anyway
            // TODO fix that attitude ^

            // Outer loop is for the generation count, inner loop is for the page
            // Generate data for each page
            const savePromises = [];
            const docbase = metadata.labelData.document;
            const pagesReadResults = ocr.analyzeResult.readResults;
            const labelData = metadata.labelData; // precisely JSON.parse of the file
            const baseLabels = [...labelData.labels]; // make a copy of the array, we don't need copies of objects
            const baseLines = {};
            const baseSelectionMarks = {};
            // Make a first pass to save OCR lines
            pagesReadResults.forEach( pageReadResults => {
                baseLines[pageReadResults.page] = [...pageReadResults.lines];
                if (pageReadResults.selectionMarks) {
                    baseSelectionMarks[pageReadResults.page] = [...pageReadResults.selectionMarks];
                }
            });

            if (metadata.generators.length === 0 && !shouldGenerateForLabels) {
                // port over the given labels if there's no generation
                const prefix = `${generatePath}/`;
                savePromises.push(assetService.saveLabels(asset, metadata.labelData, prefix));
                savePromises.push(assetService.saveOCR(asset, ocr, prefix));
                return savePromises;
            }

            // we need to support both modes
            // user draws one generator over multi-lines, or user draws multiple generators over individual lines? (or what, user draws multi-partial...)
            // how about let's do this simple case first - generator does NOT automatically fragment
            // instead, expect multiple generators as supervision if we want explicit multi-lines as in cc auth
            // and the label to gen shoudl reflect this
            let metadataGenerators = metadata.generators;
            if (shouldGenerateForLabels) {
                metadataGenerators = this.assetMetadataLabelsToGenerators(metadata, pagesReadResults, allFields);
            }
            for (let i = 0; i < metadata.generatorSettings.generateCount; i++) {
                // Generate info for the asset
                let assetGeneratorInfo: IGeneratedInfo[] = [];

                const generators = selectSomeWhenMultiple(metadataGenerators); // For labels with multiple generators, select some

                pagesReadResults.forEach( pageReadResults => {
                    assetGeneratorInfo = assetGeneratorInfo.concat(
                        generators.filter(
                            g => g.page === pageReadResults.page
                        ).map(
                            g => generate(g, pageReadResults)
                        )
                    );
                });

                // Generate label.json
                const prefix = `${generatePath}/${i}_`;
                const multiGenLabelData = assetGeneratorInfo.map(generatorInfoToLabel);
                // We may have multiple generators for a given label - in that event, we'll need to merge them
                const curLabelData = mergeLabels(multiGenLabelData);
                const docprefix = prefix.split('/').slice(-1)[0];
                metadata.labelData.document = `${docprefix}${docbase}`;

                // Merge in the generated label data
                // Any marked data under the label is wiped (intentionally)
                // TODO - how do we treat data we want to preserve? (i.e. empty form pieces people want as part of label?)
                const generatedLabelsStrings = curLabelData.map(l => l.label);
                const notGeneratedLabels = baseLabels.filter(l => !generatedLabelsStrings.includes(l.label));
                const overwrittenLabels = baseLabels.filter(l => generatedLabelsStrings.includes(l.label));
                metadata.labelData.labels = notGeneratedLabels.concat(curLabelData);
                savePromises.push(assetService.saveLabels(asset, metadata.labelData, prefix));

                // Generate ocr.json (direct editing instead of reusing API)
                const generatedReadResults = [];
                pagesReadResults.forEach( pageReadResults => {
                    const pageGeneratorInfo = assetGeneratorInfo.filter(
                        gi => gi.page === pageReadResults.page
                    );

                    // Process selection marks first
                    const selectionMarks = [];
                    if (pageReadResults.page in baseSelectionMarks) {

                        const selectionInfo = pageGeneratorInfo.filter(
                            gi => generators.find(g => g.tag.name === gi.name).tag.type === FieldType.SelectionMark
                        );

                        baseSelectionMarks[pageReadResults.page].forEach((mark) => {
                            // Find the corresponding label
                            const labelInfo = selectionInfo.find(
                                si => fuzzyBboxEqual(si.boundingBoxes.words[0].boundingBox, mark.boundingBox, 0.5) // extra threshold since benchmark data isn't matching up
                            );
                            selectionMarks.push({ ...mark, state: labelInfo ? labelInfo.text : mark.state });
                        });
                    }

                    const nestedOCRLines = pageGeneratorInfo.map(generatorInfoToOCRLines);
                    // we flatten out the lines of each generators
                    const flatOCRLines = [].concat.apply([], nestedOCRLines);

                    let lines = [ ...baseLines[pageReadResults.page], ...flatOCRLines];
                    if (overwrittenLabels.length > 0) {
                        // To erase the marked words in OCR, we need to map labels to ocr coordinates, and find the right entry
                        // To reduce search space, we'll narrow search to affected OCR lines
                        const affectedLines = baseLines[pageReadResults.page].filter(
                            l => generators.some(g =>
                                isBoxCenterInBbox(l.boundingBox, g.bbox) || isBoxCenterInBbox(g.bbox, l.boundingBox))
                        );

                        const unaffectedLines = baseLines[pageReadResults.page].filter(
                            l => !affectedLines.includes(l)
                        );

                        const modifiedAffectedLines = [];
                        // ! If you want to auto erase these words, alter this algo
                        // find the marked words in the lines and erase them (this breaks the lines)
                        // * Hopefully the line breakage doesn't affect the wordCombiner on the backend
                        affectedLines.forEach(l => {
                            // find the (unique) overlapping generator
                            const overlappingGenerator = generators.find(g =>
                                isBoxCenterInBbox(l.boundingBox, g.bbox) || isBoxCenterInBbox(g.bbox, l.boundingBox));

                            // Here are the potential overlaps. Match by bbox.
                            const labelCandidates = overwrittenLabels.filter(l => l.label === overlappingGenerator.tag.name);
                            let labelBboxes = [];
                            // Of course, this thing is ridiculously nested
                            labelCandidates.forEach(lc => {
                                labelBboxes = labelBboxes.concat(([].concat.apply([],lc.value.map(lcv => lcv.boundingBoxes))));
                            });

                            const newLineWords = l.words.filter(w =>
                                !labelBboxes.some(lbb => fuzzyScaledBboxEqual(pageReadResults, lbb, w.boundingBox))
                            );

                            if (newLineWords.length === 0) return;

                            // Next, reduce the line bbox
                            const newLineBbox = unionBbox(newLineWords.map(w => w.boundingBox));
                            // * And reduce the text - assumes only spaces
                            const text = newLineWords.map(w => w.text).join(" ");

                            const newLine = { ...l, text, boundingBox: newLineBbox, words: newLineWords };
                            modifiedAffectedLines.push(newLine);
                        });

                        lines = [...unaffectedLines, ...modifiedAffectedLines, ...flatOCRLines];
                    }
                    // contract - array of dicts
                    const generatedPageReadResults = {
                        ...pageReadResults,
                        lines,
                    };
                    if (pageReadResults.page in baseSelectionMarks) {
                        generatedPageReadResults.selectionMarks = selectionMarks;
                    }
                    generatedReadResults.push(generatedPageReadResults);
                });
                const generatedOcr = {
                    ...ocr,
                    lastUpdatedDateTime: new Date().toISOString(),
                    analyzeResult: {
                        ...ocr.analyzeResult,
                        readResults: generatedReadResults
                    }
                }
                savePromises.push(assetService.saveOCR(asset, generatedOcr, prefix)); // ! careful with race between multiple copies
            }
            return savePromises;
        }));

        await Promise.all([fieldsPromise, labelsAndOCRPromise]);
        return generatePath;
    }

    // Note - this only makes generators from one label, does not aggregate data across docs
    private assetMetadataLabelsToGenerators(metadata: IAssetMetadata, ocr: any, tags: ITag[]): IGenerator[] {
        const labelData = metadata.labelData; // precisely JSON.parse of the file
        const existingGeneratorKeys = metadata.generators.map(g => g.tag.name);
        // Will not convert labels with generators made
        const newGeneratorData = labelData.labels.filter(l => !existingGeneratorKeys.includes(l.label));

        const pagesBoxes = {};
        const newGenerators = newGeneratorData.map(d => {
            const tag = tags.find(t => t.name === d.label);
            const id = Math.random().toString(36).slice(8);
            const page = d.value[0].page;
            const pageOcr = ocr.find(doc => doc.page === page);
            if (!pageOcr) {
                throw new Error("No ocr page found for label");
            }
            // pagesBoxes[page] = pageOcr.lines.map(l => l.boundingBox);

            // use words instead of lines so boxes that are part of a line don't get messed up
            // (not optimized)
            const allBoxes = pageOcr.lines.map(l => l.words.map(lw => lw.boundingBox));
            pagesBoxes[page] = [].concat.apply([], allBoxes);

            // labels are in ratio
            const bboxes = d.value.map(v => v.boundingBoxes);
            const flatBboxes = [].concat.apply([], bboxes);
            // check ocr lines for each box in the label
            const ocrLines = flatBboxes.map(singleBox => {
                const scaledAndPaddedBox = padBbox(scaleBbox(singleBox, pageOcr.width, pageOcr.height), 0.1, 0.05);
                return matchBboxToOcr(scaledAndPaddedBox, pageOcr).ocrLines[0]; // max one hit
            });

            const boxesByOcrLine = {};
            flatBboxes.forEach((singleBox, i) => {
                if (ocrLines[i] in boxesByOcrLine) {
                    boxesByOcrLine[ocrLines[i]].push(singleBox);
                }
                boxesByOcrLine[ocrLines[i]] = [singleBox];
            });

            return Object.keys(boxesByOcrLine).map(ocrLine => {
                const boxes = boxesByOcrLine[ocrLine];
                // group the boxes by ocrlines and run the following procedure on them
                const union = unionBbox(boxes);
                const bbox = scaleBbox(union, pageOcr.width, pageOcr.height);

                const paddedBbox = shouldExpandLabelGenerators ? expandBbox(bbox, pagesBoxes[page]) : padBbox(bbox, 0.1, 0.05);
                pagesBoxes[page].push(paddedBbox);

                return {
                    tag,
                    tagProposal: tag,
                    containsText: true,
                    ocrLine,
                    bbox,
                    canvasBbox: [], // only used on canvas
                    points: [], // only used on canvas
                    id,
                    resolution: 1,
                    page,
                };
            });
        });

        return metadata.generators.concat(flattenOne(newGenerators));
    }

    private async train(sourcePrefix: string): Promise<any> {
        const baseURL = url.resolve(
            this.props.project.apiUriBase,
            constants.apiModelsPath,
        );
        const provider = this.props.project.sourceConnection.providerOptions as any;
        const trainSourceURL = provider.sas;

        const payload = {
            source: trainSourceURL,
            sourceFilter: {
                prefix: sourcePrefix,
                includeSubFolders: false,
            },
            useLabelFile: true,
        };
        try {
            return await ServiceHelper.postWithAutoRetry(
                baseURL,
                payload,
                {},
                this.props.project.apiKey as string,
            );
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        }
    }

    private async getTrainStatus(operationLocation: string): Promise<any> {
        const timeoutPerFileInMs = 10000;  // 10 second for each file
        const minimumTimeoutInMs = 300000;  // 5 minutes minimum waiting time  for each traingin process
        const extendedTimeoutInMs = timeoutPerFileInMs * Object.keys(this.props.project.assets || []).length;
        const res = this.poll(() => {
            return ServiceHelper.getWithAutoRetry(
                operationLocation,
                { headers: { "cache-control": "no-cache" } },
                this.props.project.apiKey as string);
        }, Math.max(extendedTimeoutInMs, minimumTimeoutInMs), 1000);

        return res;
    }

    private buildUpdatedProject = (newTrainRecord: ITrainRecordProps): IProject => {
        return {
            ...this.props.project,
            trainRecord: newTrainRecord,
        };
    }

    private getTrainMessage = (trainingResult): string => {
        if (trainingResult !== undefined && trainingResult.modelInfo !== undefined
            && trainingResult.modelInfo.status === "ready") {
            return "Trained successfully";
        }
        return "Training failed";
    }

    private getProjectTrainRecord = (): ITrainRecordProps => {
        return _.get(this, "props.project.trainRecord", null);
    }

    private updateCurrTrainRecord = (curr: ITrainRecordProps): void => {
        this.setState({ currTrainRecord: curr });
    }

    private parseTrainResult = (response: ITrainApiResponse): ITrainRecordProps => {
        return {
            modelInfo: {
                modelId: response["modelInfo"]["modelId"],
                createdDateTime: response["modelInfo"]["createdDateTime"],
            },
            averageAccuracy: response["trainResult"]["averageModelAccuracy"],
            accuracies: this.buildAccuracies(response["trainResult"]["fields"]),
        };
    }

    private buildAccuracies = (fields: object[]): object => {
        const accuracies = {};
        for (const field of fields) {
            accuracies[field["fieldName"]] = field["accuracy"];
        }
        return accuracies;
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
                if (response.data.modelInfo && response.data.modelInfo.status === "ready") {
                    resolve(response.data);
                } else if (response.data.modelInfo && response.data.modelInfo.status === "invalid") {
                    const message = _.get(
                        response,
                        "data.trainResult.errors[0].message",
                        "Sorry, we got errors while training the model.");
                    reject(message);
                } else if (Number(new Date()) < endTime) {
                    // If the request isn't succeeded and the timeout hasn't elapsed, go again
                    setTimeout(checkSucceeded, interval, resolve, reject);
                } else {
                    // Didn't succeeded after too much time, reject
                    reject(new Error("Timed out, sorry, it seems the training process took too long."));
                }
            });
        };

        return new Promise(checkSucceeded);
    }

    private showCheckboxPreview = (project: IProject) => {
        if (project.tags.find((t) => t.type === FieldType.SelectionMark)) {
            this.setState({
                hasCheckbox: true,
            });
        }
    }
}
