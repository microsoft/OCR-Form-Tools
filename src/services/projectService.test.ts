// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import _ from "lodash";
import ProjectService, { IProjectService } from "./projectService";
import MockFactory from "../common/mockFactory";
import { StorageProviderFactory } from "../providers/storage/storageProviderFactory";
import { IProject, ISecurityToken, AssetState } from "../models/applicationState";
import { constants } from "../common/constants";
import { generateKey } from "../common/crypto";
import { encryptProject, decryptProject } from "../common/utils";

describe("Project Service", () => {
    let projectService: IProjectService = null;
    let testProject: IProject = null;
    let projectList: IProject[] = null;
    let securityToken: ISecurityToken = null;

    const storageProviderMock = {
        writeText: jest.fn((project) => Promise.resolve(project)),
        deleteFile: jest.fn(() => Promise.resolve()),
    };

    StorageProviderFactory.create = jest.fn(() => storageProviderMock);

    beforeEach(() => {
        securityToken = {
            name: "TestToken",
            key: generateKey(),
        };
        testProject = MockFactory.createTestProject("TestProject");
        projectService = new ProjectService();

        storageProviderMock.writeText.mockClear();
        storageProviderMock.deleteFile.mockClear();
    });

    it("Load decrypts any project settings using the specified key", async () => {
        const encryptedProject = await encryptProject(testProject, securityToken);
        const decryptedProject = await projectService.load(encryptedProject, securityToken);

        expect(decryptedProject).toEqual(testProject);
    });

    it("Saves calls project storage provider to write project", async () => {
        const result = await projectService.save(testProject, securityToken);

        const encryptedProject: IProject = {
            ...testProject,
            sourceConnection: { ...testProject.sourceConnection },
        };
        encryptedProject.sourceConnection.providerOptions = {
            encrypted: expect.any(String),
        };
        encryptedProject.sourceConnection.providerOptions = {
            encrypted: expect.any(String),
        };

        expect(result).toEqual(encryptedProject);
        expect(StorageProviderFactory.create).toBeCalledWith(
            testProject.sourceConnection.providerType,
            testProject.sourceConnection.providerOptions,
        );

        expect(storageProviderMock.writeText).toBeCalledWith(
            `${testProject.name}${constants.projectFileExtension}`,
            expect.any(String));
    });

    it("initializes tags to empty array if not defined", async () => {
        testProject.tags = null;
        const result = await projectService.save(testProject, securityToken);

        expect(result.tags).toEqual([]);
    });

    it("Save throws error if writing to storage provider fails", async () => {
        const expectedError = "Error writing to storage provider";
        storageProviderMock.writeText.mockImplementationOnce(() => Promise.reject(expectedError));
        await expect(projectService.save(testProject, securityToken)).rejects.toEqual(expectedError);
    });

    it("Save throws error if storage provider cannot be created", async () => {
        const expectedError = new Error("Error creating storage provider");
        const createMock = StorageProviderFactory.create as jest.Mock;
        createMock.mockImplementationOnce(() => { throw expectedError; });

        await expect(projectService.save(testProject, securityToken)).rejects.toEqual(expectedError);
    });

    it("Delete calls project storage provider to delete project", async () => {
        await projectService.delete(testProject);

        expect(StorageProviderFactory.create).toBeCalledWith(
            testProject.sourceConnection.providerType,
            testProject.sourceConnection.providerOptions,
        );

        expect(storageProviderMock.deleteFile).toBeCalledWith(`${testProject.name}${constants.projectFileExtension}`);
    });

    it("Delete call fails if deleting from storageProvider fails", async () => {
        const expectedError = "Error deleting from storage provider";
        storageProviderMock.deleteFile
            .mockImplementationOnce(() => Promise.reject(expectedError));

        await expect(projectService.delete(testProject)).rejects.toEqual(expectedError);
    });

    it("Delete call fails if storage provider cannot be created", async () => {
        const expectedError = new Error("Error creating storage provider");
        const createMock = StorageProviderFactory.create as jest.Mock;
        createMock.mockImplementationOnce(() => { throw expectedError; });

        await expect(projectService.delete(testProject)).rejects.toEqual(expectedError);
    });

    it("isDuplicate returns false when called with a unique project", async () => {
        testProject = MockFactory.createTestProject("TestProject");
        projectList = MockFactory.createTestProjects();
        expect(projectService.isDuplicate(testProject, projectList)).toEqual(false);
    });

    it("isDuplicate returns true when called with a duplicate project", async () => {
        testProject = MockFactory.createTestProject("1");
        testProject.id = undefined;
        projectList = MockFactory.createTestProjects();
        expect(projectService.isDuplicate(testProject, projectList)).toEqual(true);
    });

    it("deletes all asset metadata files when project is deleted", async () => {
        const assets = MockFactory.createTestAssets(10);
        assets.forEach((asset) => {
            asset.state = AssetState.Tagged;
        });

        testProject.assets = _.keyBy(assets, (asset) => asset.id);

        await projectService.delete(testProject);
        expect(storageProviderMock.deleteFile.mock.calls).toHaveLength(assets.length + 1);
    });
});
