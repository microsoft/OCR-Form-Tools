// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize, TextField} from "@fluentui/react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import {
    IApplicationState, IConnection, IProject, IAppSettings, FieldType, IRecentModel,
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
import { getPrimaryGreenTheme, getGreenWithWhiteBackgroundTheme } from "../../../../common/themes";
import { getAppInsights } from '../../../../services/telemetryService';

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
    inputtedLabelFolderURL: string;
    trainMessage: string;
    isTraining: boolean;
    currTrainRecord: ITrainRecordProps;
    viewType: "chartView" | "tableView";
    showTrainingFailedWarning: boolean;
    trainingFailedMessage: string;
    hasCheckbox: boolean;
    modelName: string;
    modelUrl: string;
    currModelId: string;
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
    private appInsights: any = null;

    constructor(props) {
        super(props);

        this.state = {
            inputtedLabelFolderURL: "",
            trainMessage: strings.train.notTrainedYet,
            isTraining: false,
            currTrainRecord: null,
            viewType: "tableView",
            showTrainingFailedWarning: false,
            trainingFailedMessage: "",
            hasCheckbox: false,
            modelName: "",
            modelUrl: "",
            currModelId: "",
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
        if (this.state.currTrainRecord) {
            this.setState({ currModelId: this.state.currTrainRecord.modelInfo.modelId });
        }
        this.appInsights = getAppInsights();
        document.title = strings.train.title + " - " + strings.appName;
    }

    public render() {
        const currTrainRecord = this.state.currTrainRecord;
        const localFileSystemProvider: boolean = this.props.project && this.props.project.sourceConnection &&
                                                 this.props.project.sourceConnection.providerType === "localFileSystemProxy";
        const trainDisabled: boolean = localFileSystemProvider && (this.state.inputtedLabelFolderURL.length === 0 ||
            this.state.inputtedLabelFolderURL === strings.train.defaultLabelFolderURL);

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
                                {localFileSystemProvider &&
                                    <div>
                                        <span>
                                            {strings.train.labelFolderTitle}
                                        </span>
                                        <TextField
                                            className="label-folder-url-input"
                                            theme={getGreenWithWhiteBackgroundTheme()}
                                            onFocus={this.removeDefaultInputtedLabelFolderURL}
                                            onChange={this.setInputtedLabelFolderURL}
                                            placeholder={strings.train.defaultLabelFolderURL}
                                            value={this.state.inputtedLabelFolderURL}
                                            disabled={this.state.isTraining}
                                        />
                                    </div>
                                }
                                <span>
                                    {strings.train.modelNameTitle}
                                </span>
                                <TextField
                                    theme={getGreenWithWhiteBackgroundTheme()}
                                    placeholder={strings.train.addName}
                                    autoComplete="off"
                                    onChange={this.onTextChanged}
                                    disabled={this.state.isTraining}
                                    value={this.state.modelName}
                                >
                                </TextField>
                                {!this.state.isTraining ? (
                                    <div  className="container-items-end">
                                        <PrimaryButton
                                            style={{"margin": "15px 0px"}}
                                            id="train_trainButton"
                                            theme={getPrimaryGreenTheme()}
                                            autoFocus={true}
                                            className="flex-center"
                                            onClick={this.handleTrainClick}
                                            disabled={trainDisabled}>
                                            <FontIcon iconName="MachineLearning" />
                                            <h6 className="d-inline text-shadow-none ml-2 mb-0">
                                                {strings.train.title} </h6>
                                        </PrimaryButton>
                                    </div>
                                ) : (
                                    <div className="loading-container">
                                        <Spinner
                                            label="Training in progress..."
                                            ariaLive="assertive"
                                            labelPosition="right"
                                            size={SpinnerSize.large}
                                            className={"training-spinner"}
                                        />
                                    </div>
                                )
                                }
                            </div>
                            <div className={!this.state.isTraining ? "" : "greyOut"}>
                                {currTrainRecord &&
                                    <>
                                        <TrainPanel
                                            currTrainRecord={currTrainRecord}
                                            viewType={this.state.viewType}
                                            updateViewTypeCallback={this.handleViewTypeClick}
                                    />
                                    <PrimaryButton
                                        ariaDescription={strings.train.downloadJson}
                                        style={{ "margin": "2rem auto" }}
                                        id="train-download-json_button"
                                        theme={getPrimaryGreenTheme()}
                                        autoFocus={true}
                                        className="flex-center"
                                        onClick={this.handleDownloadJSONClick}
                                        disabled={trainDisabled}>
                                        <FontIcon
                                            iconName="Download"
                                            style={{ fontWeight: 600 }}/>
                                        <h6 className="d-inline text-shadow-none ml-2 mb-0">
                                            {strings.train.downloadJson}</h6>
                                    </PrimaryButton>
                                    </>
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

    private removeDefaultInputtedLabelFolderURL = () => {
        if (this.state.inputtedLabelFolderURL === strings.train.defaultLabelFolderURL) {
            this.setState({inputtedLabelFolderURL: ""});
        }
    }

    private setInputtedLabelFolderURL = (event) => {
        this.setState({inputtedLabelFolderURL: event.target.value});
    }

    private onTextChanged = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string) => {
        this.setState({modelName: text});
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
                modelName: "",
            }));
        }).catch((err) => {
            this.setState({
                isTraining: false,
                trainMessage: err.message,
            });
        });
        if (this.appInsights) {
            this.appInsights.trackEvent({name: "TRAIN_MODEL_EVENT"});
        }
    }

    private handleViewTypeClick = (viewType: "tableView" | "chartView"): void => {
        this.setState({ viewType });
    }

    private async trainProcess(): Promise<any> {
        try {
            const trainRes = await this.train();
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

    private async train(): Promise<any> {
        const baseURL = url.resolve(
            this.props.project.apiUriBase,
            constants.apiModelsPath,
        );
        const provider = this.props.project.sourceConnection.providerOptions as any;
        let trainSourceURL;
        let trainPrefix;

        if (this.props.project.sourceConnection.providerType === "localFileSystemProxy") {
            trainSourceURL = this.state.inputtedLabelFolderURL;
            trainPrefix = ""
        } else {
            trainSourceURL = provider.sas;
            trainPrefix = this.props.project.folderPath ? this.props.project.folderPath : "";
        }
        const payload = {
            source: trainSourceURL,
            sourceFilter: {
                prefix: trainPrefix,
                includeSubFolders: false,
            },
            useLabelFile: true,
            modelName: this.state.modelName,
        };
        try {
            const result = await ServiceHelper.postWithAutoRetry(
                baseURL,
                payload,
                {},
                this.props.project.apiKey as string,
            );
            this.setState({modelUrl: result.headers.location});
            return result;
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        }
    }

    private async getTrainStatus(operationLocation: string): Promise<any> {
        const timeoutPerFileInMs = 10000;  // 10 second for each file
        const minimumTimeoutInMs = 300000;  // 5 minutes minimum waiting time  for each training process
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
        const recentModelRecords: IRecentModel[] = this.props.project.recentModelRecords ?
                                                   [...this.props.project.recentModelRecords] : [];
        recentModelRecords.unshift({...newTrainRecord, isComposed: false} as IRecentModel);
        if (recentModelRecords.length > constants.recentModelRecordsCount) {
            recentModelRecords.pop();
        }

        return {
            ...this.props.project,
            recentModelRecords,
            trainRecord: newTrainRecord,
            predictModelId: newTrainRecord.modelInfo.modelId,
        };
    }

    private getTrainMessage = (trainingResult): string => {
        if (trainingResult !== undefined && trainingResult.modelInfo !== undefined
            && trainingResult.modelInfo.status === constants.statusCodeReady) {
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
                modelName: response["modelInfo"]["modelName"],
                isComposed: false,
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
     * Poll function to repeatably check if request succeeded
     * @param func - function that will be called repeatably
     * @param timeout - timeout
     * @param interval - interval
     */
    private poll = (func, timeout, interval): Promise<any> => {
        const endTime = Number(new Date()) + (timeout || 10000);
        interval = interval || 100;

        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then((response) => {
                if (response.data.modelInfo && response.data.modelInfo.status === constants.statusCodeReady) {
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

    private handleDownloadJSONClick = () => {
        this.triggerJsonDownload();
    }

    private async triggerJsonDownload(): Promise<any> {
        const currModelUrl = this.props.project.apiUriBase + constants.apiModelsPath + "/" + this.state.currTrainRecord.modelInfo.modelId;
        const modelUrl = this.state.modelUrl.length ? this.state.modelUrl : currModelUrl;
        const modelJSON = await this.getModelsJson(this.props.project, modelUrl);

        const fileURL = window.URL.createObjectURL(
            new Blob([modelJSON]));
        const fileLink = document.createElement("a");
        const fileBaseName = "model";
        const downloadFileName =`${fileBaseName}-${this.state.currTrainRecord.modelInfo.modelId}.json`;

        fileLink.href = fileURL;
        fileLink.setAttribute("download", downloadFileName);
        document.body.appendChild(fileLink);
        fileLink.click();
    }

    private async getModelsJson(project: IProject, modelUrl: string,) {
        const baseURL = url.resolve(
            project.apiUriBase,
            modelUrl)
        const config = {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "withCredentials": "true",
            },
        };

        try {
            return await ServiceHelper.getWithAutoRetry(
                baseURL,
                config,
                project.apiKey as string,
            ).then(res => res.request.response);
        } catch (error) {
            ServiceHelper.handleServiceError(error);
        }
    }
}
