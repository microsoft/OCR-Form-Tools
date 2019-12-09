import shortid from "shortid";
import { StorageProviderFactory, IStorageProvider } from "../providers/storage/storageProviderFactory";
import {
    IProject, ITag, ISecurityToken, AppError,
    ErrorCode, ModelPathType, IActiveLearningSettings,
} from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { ExportProviderFactory } from "../providers/export/exportProviderFactory";
import { decryptProject, encryptProject } from "../common/utils";
import packageJson from "../../package.json";
import { ExportAssetState } from "../providers/export/exportProvider";
import { IExportFormat } from "vott-react";
import { Tag } from "vott-ct/lib/js/CanvasTools/Core/Tag";
import { strings, interpolate } from "../common/strings";
import { toast } from "react-toastify";
const tagColors = require("../react/components/common/tagColors.json");

/**
 * Functions required for a project service
 * @member save - Save a project
 * @member delete - Delete a project
 */
export interface IProjectService {
    load(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
    save(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
    delete(project: IProject): Promise<void>;
    isDuplicate(project: IProject, projectList: IProject[]): boolean;
}

const defaultActiveLearningSettings: IActiveLearningSettings = {
    autoDetect: false,
    predictTag: true,
    modelPathType: ModelPathType.Coco,
};

const defaultExportOptions: IExportFormat = {
    providerType: "vottJson",
    providerOptions: {
        assetState: ExportAssetState.Visited,
        includeImages: true,
    },
};

/**
 * @name - Project Service
 * @description - Functions for dealing with projects
 */
export default class ProjectService implements IProjectService {
    /**
     * Loads a project
     * @param project The project JSON to load
     * @param securityToken The security token used to decrypt sensitive project settings
     */
    public load(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        try {
            const loadedProject = decryptProject(project, securityToken);

            // Ensure tags is always initialized to an array
            if (!loadedProject.tags) {
                loadedProject.tags = [];
            }

            // Initialize active learning settings if they don't exist
            if (!loadedProject.activeLearningSettings) {
                loadedProject.activeLearningSettings = defaultActiveLearningSettings;
            }

            // Initialize export settings if they don't exist
            if (!loadedProject.exportFormat) {
                loadedProject.exportFormat = defaultExportOptions;
            }

            this.ensureBackwardsCompatibility(loadedProject);

            return Promise.resolve({ ...loadedProject });
        } catch (e) {
            const error = new AppError(ErrorCode.ProjectInvalidSecurityToken, "Error decrypting project settings");
            return Promise.reject(error);
        }
    }

    /**
     * Save a project
     * @param project - Project to save
     * @param securityToken - Security Token to encrypt
     */
    public async save(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        project.version = packageJson.version;

        if (!project.id) {
            project.id = shortid.generate();
        }

        // Initialize active learning settings if they don't exist
        if (!project.activeLearningSettings) {
            project.activeLearningSettings = defaultActiveLearningSettings;
        }

        // Initialize export settings if they don't exist
        if (!project.exportFormat) {
            project.exportFormat = defaultExportOptions;
        }

        await this.saveExportSettings(project);

        const storageProvider = StorageProviderFactory.createFromConnection(project.targetConnection);

        if (!project.tags) {
            await this.getTagsFromPreExistingLabelFiles(project, storageProvider);
        }

        project = encryptProject(project, securityToken);

        await storageProvider.writeText(
            `${project.name}${constants.projectFileExtension}`,
            JSON.stringify(project, null, 4),
        );

        return project;
    }

    /**
     * Delete a project
     * @param project - Project to delete
     */
    public async delete(project: IProject): Promise<void> {
        Guard.null(project);

        const storageProvider = StorageProviderFactory.createFromConnection(project.targetConnection);

        try {
            // try deleting project file
            await storageProvider.deleteFile(`${project.name}${constants.projectFileExtension}`);
            toast.info(interpolate(strings.homePage.messages.deleteSuccess, { project }));
        } catch (error) {
            let reason = "";
            if (error.errorCode === ErrorCode.BlobContainerIOForbidden) {
                reason = interpolate(strings.errors.projectDeleteForbidden.message, { file: `${project.name}${constants.projectFileExtension}` });
            } else if (error.errorCode === ErrorCode.BlobContainerIONotFound) {
                reason = interpolate(strings.errors.projectDeleteNotFound.message, { file: `${project.name}${constants.projectFileExtension}` });
            } else {
                reason = strings.errors.projectDeleteError.message;
            }
            toast.error(reason, { autoClose: false });
        }
    }

    /**
     * Checks whether or not the project would cause a duplicate at the target connection
     * @param project The project to validate
     * @param projectList The list of known projects
     */
    public isDuplicate(project: IProject, projectList: IProject[]): boolean {
        const duplicateProjects = projectList.find((p) =>
            p.id !== project.id &&
            p.name === project.name &&
            JSON.stringify(p.targetConnection.providerOptions) ===
            JSON.stringify(project.targetConnection.providerOptions),
        );
        return (duplicateProjects !== undefined);
    }

    public async isProjectNameAlreadyUsed(project: IProject): Promise<boolean> {
        const storageProvider = StorageProviderFactory.createFromConnection(project.targetConnection);
        const fileList = await storageProvider.listFiles(null/*folderPath*/, constants.projectFileExtension/*ext*/);
        for (const fileName of fileList) {
            if (fileName === `${project.name}${constants.projectFileExtension}`) {
                return true;
            }
        }

        return false;
    }

    /**
     * Assign project tags.
     * A new project doesn't have any tags at the beginning. But it could connect to a blob container
     * which contains existing label files. In this case, we'll populate project tags based on these files.
     * @param project the project we're trying to create
     * @param storageProvider the storage we're trying to save the project to
     */
    private async getTagsFromPreExistingLabelFiles(project: IProject, storageProvider: IStorageProvider) {
        const tags: ITag[] = [];
        const tagNameSet = new Set<string>();
        try {
            const blobs = new Set<string>(await storageProvider.listFiles());
            for (const blob of blobs) {
                const blobFolderPath = blob.substr(0, blob.lastIndexOf("/"));
                if (blobFolderPath === project.folderPath
                    && blob.endsWith(constants.labelFileExtension)
                    && blobs.has(blob.substr(0, blob.length - constants.labelFileExtension.length))) {
                    try {
                        const content = JSON.parse(await storageProvider.readText(blob));
                        content.labels.forEach((label) => tagNameSet.add(label.label));
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
            const tagNameArray = Array.from(tagNameSet);
            if (tagNameArray.containsDuplicates((name) => name)) {
                const reason = interpolate(strings.errors.duplicateFieldKeyInLabelsFile.message, { labelFileName: strings.projectService.existingLabelFiles });
                toast.error(reason, { autoClose: false });
                throw new Error("Invalid label file");
            }
            tagNameArray.forEach((name, index) => {
                tags.push(new Tag(name, tagColors[index]));
            });
            project.tags = tags;
        } catch (err) {
            project.tags = [];
        }
    }

    private async saveExportSettings(project: IProject): Promise<void> {
        if (!project.exportFormat || !project.exportFormat.providerType) {
            return Promise.resolve();
        }

        const exportProvider = ExportProviderFactory.createFromProject(project);

        if (!exportProvider.save) {
            return Promise.resolve();
        }

        project.exportFormat.providerOptions = await exportProvider.save(project.exportFormat);
    }

    /**
     * Ensures backwards compatibility with project
     * @param project The project to update
     */
    private ensureBackwardsCompatibility(project: IProject) {
        const projectVersion = project.version.toLowerCase();

        if (projectVersion.startsWith("2.0.0")) {
            // Required for backwards compatibility with v2.0.0 release
            if (project.exportFormat.providerType === "tensorFlowPascalVOC") {
                project.exportFormat.providerType = "pascalVOC";
            }
        }
    }
}
