// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable jsx-a11y/anchor-is-valid */

import React, {SyntheticEvent} from "react";
import {connect} from "react-redux";
import {RouteComponentProps} from "react-router-dom";
import {bindActionCreators} from "redux";
import {FontIcon} from "@fluentui/react";
import {strings, interpolate} from "../../../../common/strings";
import {getPrimaryRedTheme} from "../../../../common/themes";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import {CloudFilePicker} from "../../common/cloudFilePicker/cloudFilePicker";
import FilePicker from "../../common/filePicker/filePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import "./homePage.scss";
import RecentProjectItem from "./recentProjectItem";
import {constants} from "../../../../common/constants";
import {
    IApplicationState, IConnection, IProject,
    ErrorCode, AppError, IAppSettings,
} from "../../../../models/applicationState";
import {StorageProviderFactory} from "../../../../providers/storage/storageProviderFactory";
import {decryptProject, fillTagsColor} from "../../../../common/utils";
import {toast} from "react-toastify";
import {isElectron} from "../../../../common/hostProcess";
import ProjectService from "../../../../services/projectService";
import {HomeProjectView} from "./homeProjectView";

export interface IHomePageProps extends RouteComponentProps, React.Props<HomePage> {
    recentProjects: IProject[];
    connections: IConnection[];
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appSettings: IAppSettings;
    project: IProject;
    appTitleActions: IAppTitleActions;
}

export interface IHomePageState {
    cloudPickerOpen: boolean;
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
export default class HomePage extends React.Component<IHomePageProps, IHomePageState> {

    public state: IHomePageState = {
        cloudPickerOpen: false
    };
    private homeProjectViewRef: React.RefObject<HomeProjectView> = React.createRef();
    private filePicker: React.RefObject<FilePicker> = React.createRef();
    private deleteConfirmRef = React.createRef<Confirm>();
    private cloudFilePickerRef = React.createRef<CloudFilePicker>();
    private importConfirmRef: React.RefObject<Confirm> = React.createRef();

    public async componentDidMount() {
        this.props.appTitleActions.setTitle("Welcome");
        document.title = strings.homePage.title + " - " + strings.appName;
    }

    public render() {
        return (
            <div className="app-homepage" id="pageHome">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            <a id="home_prebuilt"
                                onClick={this.onPrebuiltClicked}
                                className="primary-link"
                                role="button">
                                <FontIcon iconName="ContactCard" className="icon-7x" />
                                <div className="title">{strings.homePage.prebuiltPredict.title}</div>
                                <div className="description">{strings.homePage.prebuiltPredict.description}</div>
                            </a>
                            <a className="quickstart"
                                href="https://aka.ms/form-recognizer/pre-built"
                                target="_blank"
                                rel="noopener noreferrer">
                                <FontIcon iconName="Rocket" />{strings.homePage.quickStartGuide}</a>
                        </li>
                        <li>
                            <a onClick={this.onUseLayoutToGetTextAndTAblesClicked}
                                className="primary-link"
                                role="button">
                                <FontIcon iconName="KeyPhraseExtraction" className="icon-7x" />
                                <div className="title">{strings.homePage.layoutPredict.title}</div>
                                <div className="description">
                                    {strings.homePage.layoutPredict.description}
                                </div>
                            </a>
                            <a className="quickstart"
                                href="https://aka.ms/form-recognizer/layout"
                                target="_blank"
                                rel="noopener noreferrer">
                                <FontIcon iconName="Rocket" />{strings.homePage.quickStartGuide}</a>
                        </li>
                        <li>
                            <a onClick={this.onTrainAndUseAModelWithLables}
                                className="primary-link"
                                role="button">
                                <FontIcon iconName="AddTo" className="icon-7x" />
                                <div className="title">{strings.homePage.trainWithLabels.title}</div>
                                <div className="description">
                                    {strings.homePage.trainWithLabels.description}
                                </div>
                            </a>
                            <a className="quickstart"
                                href="https://aka.ms/form-recognizer/custom"
                                target="_blank"
                                rel="noopener noreferrer"
                            ><FontIcon iconName="Rocket" />{strings.homePage.quickStartGuide}</a>
                        </li>
                        <CloudFilePicker
                            ref={this.cloudFilePickerRef}
                            connections={this.props.connections}
                            onSubmit={this.onCloudPickerClick}
                            fileExtension={constants.projectFileExtension}
                        />
                    </ul>
                </div>
                {(this.props.recentProjects && this.props.recentProjects.length > 0) &&
                    <div className="app-homepage-recent bg-lighter-1">
                        <div className="app-homepage-open-cloud-project" role="button"
                            onClick={this.createNewProject}>
                            <FontIcon iconName="AddTo" className="icon" />
                            <span className="title">{strings.homePage.newProject}</span>
                        </div>
                        {isElectron() &&
                            <>
                                <div className="app-homepage-open-cloud-project" role="button"
                                    onClick={() => this.filePicker.current.upload()}>
                                    <FontIcon iconName="System" className="icon" />
                                    <span className="title">{strings.homePage.openLocalProject.title}</span>
                                </div>
                                <FilePicker ref={this.filePicker}
                                    onChange={this.onProjectFileUpload}
                                    onError={this.onProjectFileUploadError}
                                    accept={[".fott"]}
                                />
                            </>
                        }
                        <div className="app-homepage-open-cloud-project" role="button"
                            onClick={this.onOpenCloudProjectClick}>
                            <FontIcon iconName="Cloud" className="icon" />
                            <span className="title">{strings.homePage.openCloudProject.title}</span>
                        </div>
                        <CondensedList
                            title={strings.homePage.recentProjects}
                            Component={RecentProjectItem}
                            items={this.props.recentProjects}
                            onClick={this.freshLoadSelectedProject}
                            onDelete={(project) => this.deleteConfirmRef.current.open(project)} />
                    </div>
                }
                <Confirm title="Delete Project"
                    ref={this.deleteConfirmRef as any}
                    message={(project: IProject) => `${strings.homePage.deleteProject.confirmation} ${project.name}?`}
                    confirmButtonTheme={getPrimaryRedTheme()}
                    onConfirm={this.deleteProject} />

                <HomeProjectView
                    ref={this.homeProjectViewRef}
                    recentProjects={this.props.recentProjects}
                    connections={this.props.connections}
                    createNewProject={this.createNewProject}
                    onProjectFileUpload={this.onProjectFileUploadError}
                    onProjectFileUploadError={this.onProjectFileUploadError}
                    onOpenCloudProjectClick={this.onOpenCloudProjectClick}
                    loadSelectedProject={this.loadSelectedProject}
                    freshLoadSelectedProject={this.freshLoadSelectedProject}
                    deleteProject={this.deleteProject}
                />
            </div>
        );
    }

    private createNewProject = (e: SyntheticEvent) => {
        this.props.actions.closeProject();
        this.props.history.push("/projects/create");

        e.preventDefault();
    }

    private onPrebuiltClicked = () => {
        this.props.history.push("/prebuilts-analyze");
    }

    private onUseLayoutToGetTextAndTAblesClicked = () => {
        this.props.history.push("/layout-analyze");
    }

    private onTrainAndUseAModelWithLables = () => {
        this.homeProjectViewRef.current.open();
    }

    private onOpenCloudProjectClick = () => {
        this.homeProjectViewRef.current.close();
        this.cloudFilePickerRef.current.open();
    }

    private loadSelectedProject = async (project: IProject, sharedToken?: {}) => {
        try {
            const loadedProject = await this.props.actions.loadProject(project, sharedToken);
            if (loadedProject !== null) {
                this.props.history.push(`/projects/${project.id}/edit`);
            }
        } catch (error) {
            if (error instanceof AppError && error.errorCode === ErrorCode.SecurityTokenNotFound) {
                toast.error(strings.errors.securityTokenNotFound.message, {autoClose: 5000});
            }
            if (error instanceof AppError && error.errorCode === ErrorCode.ProjectInvalidSecurityToken) {
                toast.error(strings.errors.projectInvalidSecurityToken.message, {autoClose: 5000});
            }
        }
    }

    private freshLoadSelectedProject = async (project: IProject) => {
        // Lookup security token used to decrypt project settings
        const projectToken = this.props.appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        if (!projectToken) {
            toast.error(strings.errors.securityTokenNotFound.message, {autoClose: 3000});
            return;
        }

        // Load project from storage provider to keep the project in latest state
        const decryptedProject = await decryptProject(project, projectToken);
        const storageProvider = StorageProviderFactory.createFromConnection(decryptedProject.sourceConnection);
        try {
            let projectStr: string;
            try {
                const projectService = new ProjectService();
                if (!(await projectService.isValidProjectConnection(decryptedProject))) {
                    return;
                }
                projectStr = await storageProvider.readText(
                    `${decryptedProject.name}${constants.projectFileExtension}`);
            } catch (err) {
                if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                    // try old file extension
                    projectStr = await storageProvider.readText(
                        `${decryptedProject.name}${constants.projectFileExtensionOld}`);
                } else {
                    throw err;
                }
            }
            const selectedProject = { ...JSON.parse(projectStr), sourceConnection: project.sourceConnection };
            await this.loadSelectedProject(fillTagsColor(selectedProject));
        } catch (err) {
            if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                const reason = interpolate(strings.errors.projectNotFound.message, {file: `${project.name}${constants.projectFileExtension}`, container: project.sourceConnection.name});
                toast.error(reason, {autoClose: false});
                return;
            }
            throw err;
        }
    }

    private deleteProject = async (project: IProject) => {
        try {
            await this.props.actions.deleteProject(project);
        } catch (error) {
            if (error instanceof AppError && error.errorCode === ErrorCode.SecurityTokenNotFound) {
                toast.error(error.message, {autoClose: false});
            }
            else {
                throw error;
            }
        }
    }

    private onProjectFileUpload = async (e, project) => {
        let projectJson: IProject;

        try {
            projectJson = JSON.parse(project.content);
        } catch (error) {
            throw new AppError(ErrorCode.ProjectInvalidJson, "Error parsing JSON");
        }

        if (projectJson.name === null || projectJson.name === undefined) {
            try {
                await this.importConfirmRef.current.open(project);
            } catch (e) {
                throw new Error(e.message);
            }
        } else {
            await this.loadSelectedProject(projectJson);
        }
    }

    private onProjectFileUploadError = (e, error: any) => {
        if (error instanceof AppError) {
            throw error;
        }
    }

    private onCloudPickerClick = (content, sharedToken?) => {
        const project = JSON.parse(content);
        this.loadSelectedProject(fillTagsColor(project), sharedToken);
    }
}
