// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon } from "@fluentui/react";
import { strings, interpolate } from "../../../../common/strings";
import { getPrimaryRedTheme } from "../../../../common/themes";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { CloudFilePicker } from "../../common/cloudFilePicker/cloudFilePicker";
import FilePicker from "../../common/filePicker/filePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import "./homePage.scss";
import RecentProjectItem from "./recentProjectItem";
import { constants } from "../../../../common/constants";
import {
    IApplicationState, IConnection, IProject,
    ErrorCode, AppError, IAppSettings,
} from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import { decryptProject } from "../../../../common/utils";
import { toast } from "react-toastify";
import { isElectron } from "../../../../common/hostProcess";
import ProjectService from "../../../../services/projectService";

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
        cloudPickerOpen: false,
    };

    private filePicker: React.RefObject<FilePicker> = React.createRef();
    private newProjectRef = React.createRef<HTMLAnchorElement>();
    private deleteConfirmRef = React.createRef<Confirm>();
    private cloudFilePickerRef = React.createRef<CloudFilePicker>();
    private importConfirmRef: React.RefObject<Confirm> = React.createRef();

    public async componentDidMount() {
        this.props.appTitleActions.setTitle("Welcome");
        this.newProjectRef.current.focus();
        document.title = strings.homePage.title + " - " + strings.appName;
    }

    public async componentDidUpdate() {
        this.newProjectRef.current.focus();
    }

    public render() {
        return (
            <div className="app-homepage" id="pageHome">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            {/* eslint-disable-next-line */}
                            <a ref={this.newProjectRef}
                                id="home_newProject"
                                href="#" onClick={this.createNewProject} className="p-5 new-project skipToMainContent" role="button">
                                <FontIcon iconName="AddTo" className="icon-9x"  />
                                <div>{strings.homePage.newProject}</div>
                            </a>
                        </li>
                        {isElectron() &&
                            <li>
                                <a href="#" className="p-5 file-upload"
                                    onClick={() => this.filePicker.current.upload()} >
                                    <FontIcon iconName="System" className="icon-9x" />
                                    <h6>{strings.homePage.openLocalProject.title}</h6>
                                </a>
                                <FilePicker ref={this.filePicker}
                                    onChange={this.onProjectFileUpload}
                                    onError={this.onProjectFileUploadError} />
                            </li>
                        }
                        <li>
                            {/*Open Cloud Project*/}
                            {/* eslint-disable-next-line */}
                            <a href="#" onClick={this.handleOpenCloudProjectClick}
                                className="p-5 cloud-open-project" role="button">
                                <FontIcon iconName="Cloud" className="icon-9x" />
                                <div>{strings.homePage.openCloudProject.title}</div>
                            </a>
                            <CloudFilePicker
                                ref={this.cloudFilePickerRef}
                                connections={this.props.connections}
                                onSubmit={(content, sharedToken?) => this.loadSelectedProject(JSON.parse(content), sharedToken)}
                                fileExtension={constants.projectFileExtension}
                            />
                        </li>
                    </ul>
                </div>
                {(this.props.recentProjects && this.props.recentProjects.length > 0) &&
                    <div className="app-homepage-recent bg-lighter-1">
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
            </div>
        );
    }

    private createNewProject = (e: SyntheticEvent) => {
        this.props.actions.closeProject();
        this.props.history.push("/projects/create");

        e.preventDefault();
    }

    private handleOpenCloudProjectClick = () => {
        this.cloudFilePickerRef.current.open();
    }

    private loadSelectedProject = async (project: IProject, sharedToken?: {}) => {
        const loadedProject = await this.props.actions.loadProject(project, sharedToken);
        if (loadedProject !== null) {
            this.props.history.push(`/projects/${project.id}/edit`);
        }
    }

    private freshLoadSelectedProject = async (project: IProject) => {
        // Lookup security token used to decrypt project settings
        const projectToken = this.props.appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        if (!projectToken) {
            throw new AppError(ErrorCode.SecurityTokenNotFound, "Security Token Not Found");
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
            await this.loadSelectedProject(selectedProject);
        } catch (err) {
            if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                const reason = interpolate(strings.errors.projectNotFound.message, { file: `${project.name}${constants.projectFileExtension}`, container: project.sourceConnection.name });
                toast.error(reason, { autoClose: false });
                return;
            }
            throw err;
        }
    }

    private deleteProject = async (project: IProject) => {
        await this.props.actions.deleteProject(project);
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
}
