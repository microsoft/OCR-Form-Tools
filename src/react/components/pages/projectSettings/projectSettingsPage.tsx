// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Redirect } from "react-router";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import { FontIcon, Label, Spinner, SpinnerSize } from "@fluentui/react";
import ProjectForm from "./projectForm";
import { constants } from "../../../../common/constants";
import { strings, interpolate } from "../../../../common/strings";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IApplicationState, IProject, IConnection, IAppSettings } from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { toast } from "react-toastify";
import "./projectSettingsPage.scss";
import { ProjectSettingAction } from "./projectSettingAction";
import ProjectService from "../../../../services/projectService";
import { getStorageItem, setStorageItem, removeStorageItem } from "../../../../redux/middleware/localStorage";

/**
 * Properties for Project Settings Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 * @member connections - Array of connections available for projects
 * @member appSettings - Application settings
 * @member appTitleActions - Application title actions
 */
export interface IProjectSettingsPageProps extends RouteComponentProps, React.Props<ProjectSettingsPage> {
    project: IProject;
    recentProjects: IProject[];
    projectActions: IProjectActions;
    applicationActions: IApplicationActions;
    connections: IConnection[];
    appSettings: IAppSettings;
    appTitleActions: IAppTitleActions;
}

export interface IProjectSettingsPageState {
    project: IProject;
    action: ProjectSettingAction;
    isError: boolean;
    isCommiting: boolean;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
        connections: state.connections,
        recentProjects: state.recentProjects,
        appSettings: state.appSettings,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        projectActions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
        appTitleActions: bindActionCreators(appTitleActions, dispatch),
    };
}

/**
 * @name - Project Settings Page
 * @description - Page for adding/editing/removing projects
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class ProjectSettingsPage extends React.Component<IProjectSettingsPageProps, IProjectSettingsPageState> {
    public state: IProjectSettingsPageState = {
        project: this.props.project,
        action: null,
        isError: false,
        isCommiting: false,
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        try {
            const action = this.getProjectSettingAction(projectId);
            switch (action) {
                case ProjectSettingAction.Create:
                    this.newProjectSetting();
                    this.setState({ action });
                    break;
                case ProjectSettingAction.Update:
                    if (!this.props.project) {
                        await this.loadProjectSetting(projectId);
                    }
                    this.setState({ action });
                    break;
                default:
                    throw Error("Your action is neither new nor edit a project setting. Please check if you are loading the project correctly");
            }
        } catch (error) {
            this.setState({ isError: true });
            alert(error);
        }

        this.props.appTitleActions.setTitle(strings.projectSettings.title);
        document.title = strings.projectSettings.title + " - " + strings.appName;
    }

    public componentDidUpdate(prevProps: Readonly<IProjectSettingsPageProps>) {
        if (prevProps.project !== this.props.project) {
            this.setState({ project: this.props.project });
        }
    }

    componentWillUnmount() {
        if (this.state.project?.id) {
            removeStorageItem(constants.projectFormTempKey);
        }
    }
    // Hide ProjectMetrics for private-preview
    public render() {
        return (
            <div className="project-settings-page skipToMainContent" id="pageProjectSettings">
                <div className="project-settings-page-settings m-3">
                    <h3 className="flex-center">
                        <FontIcon iconName="DocumentManagement" />
                        <span className="px-2">
                            {strings.projectSettings.title}
                        </span>
                    </h3>
                    <div className="m-3">
                        <ProjectForm
                            project={this.state.project}
                            connections={this.props.connections}
                            appSettings={this.props.appSettings}
                            onChange={this.onFormChange}
                            onSubmit={this.onFormSubmit}
                            onCancel={this.onFormCancel}
                            action={this.state.action} />
                    </div>
                </div>
                {this.state.isError &&
                    <Redirect to="/" />
                }
                {this.state.isCommiting &&
                    <div className="project-saving">
                        <div className="project-saving-spinner">
                            <Label className="p-0" ></Label>
                            <Spinner size={SpinnerSize.large} label="Saving Project..." ariaLive="assertive" labelPosition="right" />
                        </div>
                    </div>
                }
            </div>
        );
    }

    private getProjectSettingAction = (projectId: string): ProjectSettingAction => {
        if (this.props.match.url === "/projects/create") {
            return ProjectSettingAction.Create;
        } else if (projectId) {
            return ProjectSettingAction.Update;
        } else {
            return ProjectSettingAction.Other;
        }
    }

    private newProjectSetting = async (): Promise<void> => {
        const projectJson = await getStorageItem(constants.projectFormTempKey);
        if (projectJson) {
            this.setState({ project: JSON.parse(projectJson) });
        }
    }

    private loadProjectSetting = async (projectId: string) => {
        const projectToLoad = this.props.recentProjects.find((project) => project.id === projectId);
        if (projectToLoad) {
            await this.props.applicationActions.ensureSecurityToken(projectToLoad);
            await this.props.projectActions.loadProject(projectToLoad);
        } else {
            throw Error("There might be something wrong. We cannot find any project given the project ID.");
        }
    }

    /**
     * When the project form is changed verifies if the project contains enough information
     * to persist into temp local storage to support better new project flow when
     * creating new connections inline
     */
    private onFormChange = (project: IProject) => {
        if (this.isPartialProject(project)) {
            setStorageItem(constants.projectFormTempKey, JSON.stringify(project));
            this.setState({ project });
        }
    }

    private onFormSubmit = async (project: IProject) => {
        const isNew = !(!!project.id);
        try {
            this.setState({ isCommiting: true });
            const projectService = new ProjectService();
            if (!(await projectService.isValidProjectConnection(project))) {
                return;
            }

            if (await this.isValidProjectName(project, isNew)) {
                toast.error(interpolate(strings.projectSettings.messages.projectExisted, { project }));
                return;
            }

            await this.deleteOldProjectWhenRenamed(project, isNew);
            await this.props.applicationActions.ensureSecurityToken(project);
            await this.props.projectActions.saveProject(project, false, true);

            toast.success(interpolate(strings.projectSettings.messages.saveSuccess, { project }));

            if (isNew) {
                this.props.history.push(`/projects/${this.props.project.id}/edit`);
            } else {
                this.props.history.goBack();
            }
        } catch (error) {
            const message = error?.message
                ? error.message
                : interpolate(strings.errors.requestSendError.message, {});
            toast.error(message);
        } finally {
            this.setState({ isCommiting: false });
        }

    }

    private onFormCancel = () => {
        removeStorageItem(constants.projectFormTempKey);
        this.props.history.goBack();
    }

    /**
     * Checks whether a project is partially populated
     */
    private isPartialProject = (project: IProject): boolean => {
        return project &&
            (
                !!project.name
                || !!project.description
                || (project.sourceConnection && Object.keys(project.sourceConnection).length > 0)
                || (project.tags && project.tags.length > 0)
            );
    }

    private deleteOldProjectWhenRenamed = async (project: IProject, isNew: boolean) => {
        const isProjectRenamed = (this.props.project !== null && this.props.project.name !== project.name);
        if (!isNew && isProjectRenamed) {
            await this.props.projectActions.deleteProject(this.props.project);
        }
    }

    private isValidProjectName = async (project: IProject, isNew: boolean) => {
        const isProjectRenamed = (this.props.project !== null && this.props.project.name !== project.name);
        const projectService = new ProjectService();
        return (isNew || isProjectRenamed) && await projectService.isProjectNameAlreadyUsed(project);
    }
}
