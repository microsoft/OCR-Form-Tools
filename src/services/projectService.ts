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
    ITableTag, ITableField, ILabelData, TableVisualizationHint
} from "../models/applicationState";
import Guard from "../common/guard";
import { constants } from "../common/constants";
import { decryptProject, encryptProject, joinPath, patch, getNextColor } from "../common/utils";
import packageJson from "../../package.json";
import { strings, interpolate } from "../common/strings";
import { toast } from "react-toastify";
import clone from "rfdc";
import _ from "lodash";

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
    updatedAssetMetadata(oldProject: IProject, assetDocumentCountDifference: any, columnDocumentCountDifference: any, rowDocumentCountDifference: any): Promise<IProject>;
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
        try {
            await storageProvider.writeText(
                `${project.name}${constants.projectFileExtension}`,
                JSON.stringify(project, null, 4),
            );
        } catch (error) {
            throw new Error(error);
        }
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
        return await storageProvider.isFileExists(`${project.name}${constants.projectFileExtension}`);
    }

    public async isValidProjectConnection(project: IProject): Promise<boolean> {
        const storageProvider = StorageProviderFactory.createFromConnection(project.sourceConnection);
        let isValid;
        try {
            if (project.sourceConnection.providerType === "localFileSystemProxy") {
                isValid = await storageProvider.isValidProjectConnection(project.folderPath);
            } else {
                isValid = await storageProvider.isValidProjectConnection();
            }
        } catch {
            isValid = false;
        }
        if (!isValid) {
            if (project.sourceConnection.providerType === "localFileSystemProxy") {
                await toast.error(interpolate(strings.connections.providers.local.invalidFolderMessage, { project }));
            } else if (project.sourceConnection.providerType === "azureBlobStorage") {
                await toast.error(interpolate(strings.connections.providers.azureBlob.invalidSASMessage, { project }));
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

    public async updatedAssetMetadata(project: IProject, assetDocumentCountDifference: any, columnDocumentCountDifference?: any,
        rowDocumentCountDifference?: any): Promise<IProject> {
        const updatedProject = clone()(project);
        updatedProject.tags?.forEach((tag: ITag) => {
            const diff = assetDocumentCountDifference?.[tag.name];
            if (diff) {
                tag.documentCount += diff;
            }
            if (tag.type === FieldType.Object || tag.type === FieldType.Array) {
                // (tag as ITableTag).columnKeys?.forEach((columnKey) => {
                //     if (columnDocumentCountDifference?.[tag.name]?.[columnKey.fieldKey]) {
                //         columnKey.documentCount += columnDocumentCountDifference[tag.name][columnKey.fieldKey];
                //     }
                // });
                // (tag as ITableTag).rowKeys?.forEach((rowKey) => {
                //     if (rowDocumentCountDifference?.[tag.name]?.[rowKey.fieldKey]) {
                //         rowKey.documentCount += rowDocumentCountDifference[tag.name][rowKey.fieldKey]
                //     }
                // });
            }
        });
        if (JSON.stringify(updatedProject.tags) === JSON.stringify(project.tags)) {
            return project;
        } else {
            return updatedProject;
        }
    }

    public static async checkAndUpdateSchema(project: IProject): Promise<void> {
        try {
            const storageProvider = StorageProviderFactory.createFromConnection(project.sourceConnection);
            const fieldInfo = await ProjectService.getFieldInfo(project, storageProvider);
            const fieldsSchema = _.get(fieldInfo, "$schema", "");
            if (ProjectService.shouldUpdateSchema(fieldsSchema)) {
                fieldInfo["$schema"] = constants.fieldsSchema;
                const fieldFilePath = joinPath("/", project.folderPath, constants.fieldsFileName);
                await storageProvider.writeText(fieldFilePath, JSON.stringify(fieldInfo, null, 4));
            }
        } catch (err) {
            console.warn(err);
        }
    }

    private static shouldUpdateSchema(fieldsSchema: string) {
        return fieldsSchema
            && constants.supportedFieldsSchemas.has(fieldsSchema)
            && fieldsSchema !== constants.fieldsSchema;
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
            await Promise.all(Array.from(blobs).map(async (blob) => {
                const blobFolderPath = blob.substr(0, blob.lastIndexOf("/"));
                if (blobFolderPath === project.folderPath
                    && blob.endsWith(constants.labelFileExtension)
                    && blobs.has(blob.substr(0, blob.length - constants.labelFileExtension.length))) {
                    try {
                        if (!assetLabel || assetLabel === blob) {
                            const content = JSON.parse(await storageProvider.readText(blob)) as ILabelData;
                            const localTagDocumentCount = {};
                            content.labels.forEach((label) => {
                                if (constants.supportedLabelsSchemas.has(content?.$schema) && label.label.split("/").length > 1) {
                                    return;
                                }
                                let labelName;
                                if (constants.supportedLabelsSchemas.has(content?.$schema)) {
                                    labelName = label.label.replace(/~1/g, "/").replace(/~0/g, "~");
                                } else {
                                    labelName = label.label
                                }
                                if (localTagDocumentCount[labelName]) {
                                    localTagDocumentCount[labelName] += 1;
                                } else {
                                    localTagDocumentCount[labelName] = 1;
                                }
                            });
                            return localTagDocumentCount;
                        }
                    } catch (err) {
                        // ignore err
                    }
                }
            })).then(localTagDocumentCounts => {
                for (const localTagDocumentCount of localTagDocumentCounts) {
                    if (_.isPlainObject(localTagDocumentCount)) {
                        for (const [labelName, labelCount] of Object.entries(localTagDocumentCount)) {
                            tagNameSet.add(labelName);
                            if (tagDocumentCount[labelName]) {
                                tagDocumentCount[labelName] += labelCount;
                            } else {
                                tagDocumentCount[labelName] = labelCount;
                            }
                        }
                    }
                }
            });
            const tagNameArray = Array.from(tagNameSet);
            if (tagNameArray.containsDuplicates((name) => name)) {
                const reason = interpolate(
                    strings.errors.duplicateFieldKeyInLabelsFile.message,
                    { labelFileName: strings.projectService.existingLabelFiles });
                toast.error(reason, { autoClose: false });
                throw new Error("Invalid label file");
            }
            tagNameArray.forEach((name, index) => {
                const color = getNextColor(tags);
                tags.push({
                    name,
                    color,
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
     * Get fields info from fields.json file.
     * @param project the project we're trying to create
     * @param storageProvider the storage we're trying to save the project to
     */
     private static getFieldInfo = async (project: IProject, storageProvider: IStorageProvider): Promise<IFieldInfo> => {
        const fieldFilePath = joinPath("/", project.folderPath, constants.fieldsFileName);
        try {
            const json = await storageProvider.readText(fieldFilePath, true);
            return JSON.parse(json) as IFieldInfo;
        } catch (err) {
            if (err instanceof SyntaxError) {
                const reason = interpolate(strings.errors.invalidJSONFormat.message, { fieldFilePath });
                toast.error(reason, { autoClose: false });
            }
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
                if (field.fieldType === FieldType.Object || field.fieldType === FieldType.Array) {
                    const tableDefinition = fieldInfo?.definitions?.[field.fieldKey + "_object"];
                    if (!tableDefinition) {
                        toast.info("Table field " + field.fieldKey + " has no definition.")
                        return;
                    }
                    if (field.fieldType === FieldType.Object) {
                        const color = getNextColor(tags);
                        tags.push({
                            name: field.fieldKey,
                            color,
                            type: normalizeFieldType(field.fieldType),
                            format: field.fieldFormat,
                            documentCount: 0,
                            itemType: (field as ITableField).itemType,
                            fields: (field as ITableField).fields,
                            definition: tableDefinition,
                            visualizationHint: (field as ITableField).visualizationHint || TableVisualizationHint.Vertical
                        } as ITableTag);
                    } else {
                        const color = getNextColor(tags);
                        tags.push({
                            name: field.fieldKey,
                            color,
                            type: normalizeFieldType(field.fieldType),
                            format: field.fieldFormat,
                            documentCount: 0,
                            itemType: (field as ITableField).itemType,
                            fields: (field as ITableField).fields,
                            definition: tableDefinition,
                            visualizationHint: null,
                        } as ITableTag);
                    }

                } else {
                    const color = getNextColor(tags);
                    tags.push({
                        name: field.fieldKey,
                        color,
                        type: normalizeFieldType(field.fieldType),
                        format: field.fieldFormat,
                        documentCount: 0,
                    } as ITag);
                }
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
                const reason = interpolate(strings.errors.invalidJSONFormat.message, { fieldFilePath });
                toast.error(reason, { autoClose: false });
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
            if (!oldProject.tags.find((oldTag) => updatedTag.name === oldTag.name)) {
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
            const foundExistingTag = project.tags.find((tag) => fileTag.name === tag.name);
            if (!foundExistingTag) {
                return true;
            } else {
                if (tagDocumentCount) {
                    foundExistingTag.documentCount = tagDocumentCount[foundExistingTag.name];
                }
                return false;
            }
        });
        project.tags = [...project.tags, ...missingTags];
    }

    // public async getAllTagsInProjectCount(project: IProject, tags: ITag[]) {}
    /**
     * Save fields.json
     * @param project the project we're trying to create
     * @param storageProvider the storage we're trying to save the project
     */
    public async saveFieldsFile(project: IProject, storageProvider: IStorageProvider) {
        Guard.null(project);
        Guard.null(project.tags);

        const definitions = {};
        const fieldInfo = {};
        fieldInfo["$schema"] = constants.fieldsSchema;
        fieldInfo["fields"] =
            project.tags.map((tag) => {
                if (tag.type === FieldType.Object || tag.type === FieldType.Array) {
                    const tableField = {
                        fieldKey: tag.name,
                        fieldType: tag.type ? tag.type : FieldType.String,
                        fieldFormat: tag.format ? tag.format : FieldFormat.NotSpecified,
                        itemType: (tag as ITableTag).itemType,
                        fields: (tag as ITableTag).fields,
                    } as ITableField;
                    if (tag.type === FieldType.Object) {
                        tableField.visualizationHint = (tag as ITableTag).visualizationHint
                    }
                    definitions[(tag as ITableTag).definition.fieldKey] = (tag as ITableTag).definition;
                    return tableField;
                } else {
                    return ({
                        fieldKey: tag.name,
                        fieldType: tag.type ? tag.type : FieldType.String,
                        fieldFormat: tag.format ? tag.format : FieldFormat.NotSpecified,
                    } as IField)
                }
            })
        fieldInfo["definitions"] = definitions;

        const fieldFilePath = joinPath("/", project.folderPath, constants.fieldsFileName);
        await storageProvider.writeText(fieldFilePath, JSON.stringify(fieldInfo, null, 4));
    }
}
