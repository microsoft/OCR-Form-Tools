import React, { SyntheticEvent } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { strings, interpolate } from "../../../../common/strings";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import { CloudFilePicker } from "../../common/cloudFilePicker/cloudFilePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import FilePicker from "../../common/filePicker/filePicker";
import "./homePage.scss";
import RecentProjectItem from "./recentProjectItem";
import { constants } from "../../../../common/constants";
import {
    IApplicationState, IConnection, IProject, IFileInfo,
    ErrorCode, AppError, IAppSettings
} from "../../../../models/applicationState";
import ImportService from "../../../../services/importService";
import { IAssetMetadata } from "../../../../models/applicationState";
import { isElectron } from "../../../../common/hostProcess";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import { decryptProject } from "../../../../common/utils";
import { toast } from "react-toastify";

export interface IHomePageProps extends RouteComponentProps, React.Props<HomePage> {
    recentProjects: IProject[];
    connections: IConnection[];
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appSettings: IAppSettings;
    project: IProject;
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
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class HomePage extends React.Component<IHomePageProps, IHomePageState> {
    public state: IHomePageState = {
        cloudPickerOpen: false,
    };
    private filePicker: React.RefObject<FilePicker> = React.createRef();
    private deleteConfirm: React.RefObject<Confirm> = React.createRef();
    private cloudFilePicker: React.RefObject<CloudFilePicker> = React.createRef();
    private importConfirm: React.RefObject<Confirm> = React.createRef();

    public render() {
        return (
            <div className="app-homepage">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            {/* eslint-disable-next-line */}
                            <a href="#" onClick={this.createNewProject} className="p-5 new-project">
                                <i className="fas fa-folder-plus fa-9x"></i>
                                <h6>{strings.homePage.newProject}</h6>
                            </a>
                        </li>
                        {isElectron() &&
                            <li>
                                {/* eslint-disable-next-line */}
                                <a href="#" className="p-5 file-upload"
                                    onClick={() => this.filePicker.current.upload()} >
                                    <i className="fas fa-folder-open fa-9x"></i>
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
                            <a href="#" onClick={this.handleOpenCloudProjectClick} className="p-5 cloud-open-project">
                                <i className="fas fa-cloud fa-9x"></i>
                                <h6>{strings.homePage.openCloudProject.title}</h6>
                            </a>
                            <CloudFilePicker
                                ref={this.cloudFilePicker}
                                connections={this.props.connections}
                                onSubmit={(content) => this.loadSelectedProject(JSON.parse(content))}
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
                            onDelete={(project) => this.deleteConfirm.current.open(project)} />
                    </div>
                }
                <Confirm title="Delete Project"
                    ref={this.deleteConfirm as any}
                    message={(project: IProject) => `${strings.homePage.deleteProject.confirmation} ${project.name}?`}
                    confirmButtonColor="danger"
                    onConfirm={this.deleteProject} />
                <Confirm title="Import Project"
                    ref={this.importConfirm as any}
                    message={(project: IFileInfo) =>
                        interpolate(strings.homePage.importProject.confirmation, { project })}
                    confirmButtonColor="danger"
                    onConfirm={this.convertProject} />
            </div>
        );
    }

    private createNewProject = (e: SyntheticEvent) => {
        this.props.actions.closeProject();
        this.props.history.push("/projects/create");

        e.preventDefault();
    }

    private handleOpenCloudProjectClick = () => {
        this.cloudFilePicker.current.open();
    }

    private onProjectFileUpload = async (e, project) => {
        let projectJson: IProject;

        try {
            projectJson = JSON.parse(project.content);
        } catch (error) {
            throw new AppError(ErrorCode.ProjectInvalidJson, "Error parsing JSON");
        }

        // need a better check to tell if its v1
        if (projectJson.name === null || projectJson.name === undefined) {
            try {
                await this.importConfirm.current.open(project);
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

        throw new AppError(ErrorCode.ProjectUploadError, "Error uploading project file");
    }

    private loadSelectedProject = async (project: IProject) => {
        await this.props.actions.loadProject(project);
        this.props.history.push(`/projects/${project.id}/edit`);
    }

    private freshLoadSelectedProject = async (project: IProject) => {
        // Lookup security token used to decrypt project settings
        const projectToken = this.props.appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        if (!projectToken) {
            throw new AppError(ErrorCode.SecurityTokenNotFound, "Security Token Not Found");
        }

        // Load project from storage provider to keep the project in latest state
        const decryptedProject = decryptProject(project, projectToken);
        const storageProvider = StorageProviderFactory.createFromConnection(decryptedProject.targetConnection);
        try {
            const projectStr = await storageProvider.readText(`${decryptedProject.name}${constants.projectFileExtension}`);
            const selectedProject = { ...JSON.parse(projectStr), sourceConnection: project.sourceConnection, targetConnection: project.targetConnection };
            await this.loadSelectedProject(selectedProject);
        } catch (err) {
            if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                const reason = interpolate(strings.errors.projectNotFound.message, { file: `${project.name}${constants.projectFileExtension}`, container: project.targetConnection.name });
                toast.error(reason, { autoClose: false });
                return;
            }
            throw err;
        }
    }

    private deleteProject = async (project: IProject) => {
        await this.props.actions.deleteProject(project);
    }

    private convertProject = async (projectInfo: IFileInfo) => {
        const importService = new ImportService();
        let generatedAssetMetadata: IAssetMetadata[];
        let project: IProject;

        try {
            project = await importService.convertProject(projectInfo);
        } catch (e) {
            throw new AppError(ErrorCode.V1ImportError, "Error converting v1 project file");
        }

        this.props.applicationActions.ensureSecurityToken(project);

        try {
            generatedAssetMetadata = await importService.generateAssets(projectInfo, project);
            await this.props.actions.saveProject(project);
            await this.props.actions.loadProject(project);
            await generatedAssetMetadata.mapAsync((assetMetadata) => {
                return this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
            });
        } catch (e) {
            throw new Error(`Error importing project information - ${e.message}`);
        }

        await this.props.actions.saveProject(this.props.project);
        await this.loadSelectedProject(this.props.project);
    }
}
