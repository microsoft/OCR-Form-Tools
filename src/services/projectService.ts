// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import shortid from "shortid";
import { StorageProviderFactory, IStorageProvider } from "../providers/storage/storageProviderFactory";
import {
    IProject, ITag, ISecurityToken, AppError,
    ErrorCode,
    FieldType,
    FieldFormat,
    IField,
    IFieldInfo,
} from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { decryptProject, encryptProject, joinPath, patch, getNextColor } from "../common/utils";
import packageJson from "../../package.json";
import { strings, interpolate } from "../common/strings";
import { toast } from "react-toastify";

// tslint:disable-next-line:no-var-requires
const tagColors = require("../react/components/common/tagColors.json");

function normalizeFieldType(type: string): string {
    if (type === "checkbox") {
        return FieldType.SelectionMark;
    }
    return type;
}

/**
 * Functions required for a project service
 * @member save - Save a project
 * @member delete - Delete a project
 */
export interface IProjectService {
    load(project: IProject, securityToken: ISecurityToken): Promise<IProject>;
    save(project: IProject, securityToken: ISecurityToken, saveTags?: boolean,
         updateTagsFromFiles?: boolean): Promise<IProject>;
    delete(project: IProject): Promise<void>;
    isDuplicate(project: IProject, projectList: IProject[]): boolean;
    updateProjectTagsFromFiles(oldProject: IProject): Promise<IProject>;
    updatedAssetMetadata(oldProject: IProject, assetDocumentCountDifference: []): Promise<IProject>;
}

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
    public async load(project: IProject, securityToken: ISecurityToken): Promise<IProject> {
        Guard.null(project);

        try {
            const loadedProject = await decryptProject(project, securityToken);

            // Ensure tags is always initialized to an array
            if (!loadedProject.tags) {
                loadedProject.tags = [];
            }

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
    public async save(project: IProject, securityToken: ISecurityToken, saveTags?: boolean,
                      updateTagsFromFiles?: boolean): Promise<IProject> {
        Guard.null(project);

        project.version = packageJson.version;

        if (!project.id) {
            project.id = shortid.generate();
        }

        const storageProvider = StorageProviderFactory.createFromConnection(project.sourceConnection);

        if (updateTagsFromFiles || !project.tags) {
            project = await this.updateProjectTagsFromFiles(project);
        }

        if (project.tags && saveTags) {
            await this.saveFieldsFile(project, storageProvider);
        }

        project = await encryptProject(project, securityToken);

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

        const storageProvider = StorageProviderFactory.createFromConnection(project.sourceConnection);

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
            JSON.stringify(p.sourceConnection.providerOptions) ===
            JSON.stringify(project.sourceConnection.providerOptions),
        );
        return (duplicateProjects !== undefined);
    }

    public async isProjectNameAlreadyUsed(project: IProject): Promise<boolean> {
        const storageProvider = StorageProviderFactory.createFromConnection(project.sourceConnection);
        const fileList = await storageProvider.listFiles("", constants.projectFileExtension/*ext*/);
        for (const fileName of fileList) {
            if (fileName === `${project.name}${constants.projectFileExtension}`) {
                return true;
            }
        }

        return false;
    }

    public async isValidProjectConnection(project: IProject): Promise<boolean> {
        const storageProvider = StorageProviderFactory.createFromConnection(project.sourceConnection);
        let isValid;
        try {
            isValid = await storageProvider.isValidProjectConnection();
        } catch {
            isValid = false;
        }
        if (!isValid) {
            if (project.sourceConnection.providerType === "localFileSystemProxy") {
                await toast.error(interpolate(strings.connections.providers.local.invalidFolderMessage, {project}));
            } else if (project.sourceConnection.providerType === "azureBlobStorage") {
                await toast.error(interpolate(strings.connections.providers.azureBlob.invalidSASMessage, {project}));
            } else {
                await toast.error(interpolate(strings.connections.genericInvalid, { project }));
            }
        }
        return isValid;
    };

    public async updateProjectTagsFromFiles(project: IProject, asset?: string): Promise<IProject> {
        const updatedProject = Object.assign({}, project);
        updatedProject.tags = [];
        const storageProvider = StorageProviderFactory.createFromConnection(project.sourceConnection);
        await this.getTagsFromPreExistingFieldFile(updatedProject, storageProvider);
        await this.getTagsFromPreExistingLabelFiles(updatedProject, storageProvider, asset);
        await this.setColorsForUpdatedTags(project, updatedProject);
        if (JSON.stringify(updatedProject.tags) === JSON.stringify(project.tags)) {
            return project;
        } else {
            return updatedProject;
        }
    }

    public async updatedAssetMetadata(project: IProject,  assetDocumentCountDifference: any): Promise<IProject> {
        const updatedProject = Object.assign({}, project);
        const tags: ITag[] = [];
        updatedProject.tags.forEach((tag) => {
            const diff = assetDocumentCountDifference[tag.name];
            if (diff) {
                tags.push({
                    ...tag,
                    documentCount: tag.documentCount + diff,
                } as ITag);
            } else {
                tags.push({
                    ...tag,
                } as ITag);
            }
        });
        updatedProject.tags = tags;
        if (JSON.stringify(updatedProject.tags) === JSON.stringify(project.tags)) {
            return project;
        } else {
            return updatedProject;
        }
    }

    /**
     * Assign project tags.
     * A new project doesn't have any tags at the beginning. But it could connect to a blob container
     * which contains existing label files. In this case, we'll populate project tags based on these files.
     * @param project the project we're trying to create
     * @param storageProvider the storage we're trying to save the project to
     * @param asset the asset to get tags from
     */
    private async getTagsFromPreExistingLabelFiles(
        project: IProject,
        storageProvider: IStorageProvider,
        asset?: string) {
        const tags: ITag[] = [];
        const tagNameSet = new Set<string>();
        const tagDocumentCount = {};
        try {
            const blobs = new Set<string>(await storageProvider.listFiles(project.folderPath));
            const assetLabel = asset ? asset + constants.labelFileExtension : undefined;
            for (const blob of blobs) {
                const blobFolderPath = blob.substr(0, blob.lastIndexOf("/"));
                if (blobFolderPath === project.folderPath
                    && blob.endsWith(constants.labelFileExtension)
                    && blobs.has(blob.substr(0, blob.length - constants.labelFileExtension.length))) {
                    try {
                        if (!assetLabel || assetLabel === blob) {
                            const content = JSON.parse(await storageProvider.readText(blob));
                            content.labels.forEach((label) => {
                                tagNameSet.add(label.label);
                                if (tagDocumentCount[label.label]) {
                                    tagDocumentCount[label.label] += 1;
                                } else {
                                    tagDocumentCount[label.label] = 1;
                                }
                            });
                        }
                        if (assetLabel && assetLabel === blob) {
                            break;
                        }
                    } catch (err) {
                        // ignore err
                    }
                }
            }
            const tagNameArray = Array.from(tagNameSet);
            if (tagNameArray.containsDuplicates((name) => name)) {
                const reason = interpolate(
                    strings.errors.duplicateFieldKeyInLabelsFile.message,
                    { labelFileName: strings.projectService.existingLabelFiles });
                toast.error(reason, { autoClose: false });
                throw new Error("Invalid label file");
            }
            tagNameArray.forEach((name, index) => {
                tags.push({
                    name,
                    color: tagColors[index],
                    // use default type
                    type: FieldType.String,
                    format: FieldFormat.NotSpecified,
                    documentCount: tagDocumentCount[name],
                } as ITag);
            });
            if (project.tags) {
                await this.addMissingTagsAndUpdateDocumentCount(project, tags, tagDocumentCount);
            } else {
                project.tags = tags;
            }
        } catch (err) {
            // ignore err
        }
    }

    /**
     * Assign project tags
     * A new project does not have any tags at the beginning. But it could connect to a blob container
     * Which contains existing fields .json file. In this case, we'll populate project tags base on this file.
     * @param project the project we're trying to create
     * @param storageProvider the storage we're trying to save the project to
     */

    private async getTagsFromPreExistingFieldFile(project: IProject, storageProvider: IStorageProvider) {
        const fieldFilePath = joinPath("/", project.folderPath, constants.fieldsFileName);
        try {
            const json = await storageProvider.readText(fieldFilePath, true);
            const fieldInfo = JSON.parse(json) as IFieldInfo;
            const tags: ITag[] = [];
            fieldInfo.fields.forEach((field, index) => {
                tags.push({
                    name: field.fieldKey,
                    color: tagColors[index],
                    type: normalizeFieldType(field.fieldType),
                    format: field.fieldFormat,
                    documentCount: 0,
                } as ITag);
            });
            if (project.tags) {
                project.tags = patch(project.tags, tags, "name", ["type", "format"]);
                await this.addMissingTagsAndUpdateDocumentCount(project, tags);
            } else {
                project.tags = tags;
            }
            toast.dismiss();
        } catch (err) {
            if (err instanceof SyntaxError) {
                const reason = interpolate(strings.errors.invalidJSONFormat.message, {fieldFilePath});
                toast.error(reason, {autoClose: false});
            }
        }
    }

    private async setColorsForUpdatedTags(oldProject: IProject, updatedProject: IProject) {
        if (!oldProject.tags || oldProject.tags.length === 0) {
            return;
        }

        let existingTags: ITag[] = [];
        const newTags: ITag[] = [];
        updatedProject.tags.forEach((updatedTag) => {
            if (!oldProject.tags.find((oldTag) => updatedTag.name === oldTag.name )) {
                newTags.push(updatedTag);
            } else {
                existingTags.push(updatedTag);
            }
        });
        existingTags = patch(existingTags, oldProject.tags, "name", ["color"]);
        newTags.forEach((newTag) => {
            newTag.color = getNextColor(existingTags);
            existingTags.push(newTag);
        });
        updatedProject.tags = existingTags;
    }

    private async addMissingTagsAndUpdateDocumentCount(project: IProject, tags: ITag[], tagDocumentCount?: any) {
        const missingTags = tags.filter((fileTag) => {
            const foundExistingTag = project.tags.find((tag) => fileTag.name === tag.name );
            if (!foundExistingTag) {
                return true;
            } else {
                if (tagDocumentCount) {
                    foundExistingTag.documentCount =  tagDocumentCount[foundExistingTag.name];
                }
                return false;
            }
        });
        project.tags = [...project.tags, ...missingTags];
    }

    // private async getAllTagsInProjectCount(project: IProject, tags: ITag[]) {}
    /**
     * Save fields.json
     * @param project the project we're trying to create
     * @param storageProvider the storage we're trying to save the project
     */
    private async saveFieldsFile(project: IProject, storageProvider: IStorageProvider) {
        Guard.null(project);
        Guard.null(project.tags);

        const fieldInfo = {
            fields: project.tags.map((tag) => ({
                fieldKey: tag.name,
                fieldType: tag.type ? tag.type : FieldType.String,
                fieldFormat: tag.format ? tag.format : FieldFormat.NotSpecified,
            } as IField)),
        };

        const fieldFilePath = joinPath("/", project.folderPath, constants.fieldsFileName);
        await storageProvider.writeText(fieldFilePath, JSON.stringify(fieldInfo, null, 4));
    }
}
