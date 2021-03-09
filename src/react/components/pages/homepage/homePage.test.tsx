// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Link } from "react-router-dom";
import { AnyAction, Store } from "redux";
import MockFactory from "../../../../common/mockFactory";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import { IApplicationState, IProject, AppError, ErrorCode } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import createReduxStore from "../../../../redux/store/store";
import CondensedList from "../../common/condensedList/condensedList";
import HomePage, { IHomePageProps, IHomePageState } from "./homePage";

jest.mock("../../common/cloudFilePicker/cloudFilePicker");
import { CloudFilePicker, ICloudFilePickerProps } from "../../common/cloudFilePicker/cloudFilePicker";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

import { toast } from "react-toastify";
import registerMixins from "../../../../registerMixins";

describe("Homepage Component", () => {
    let store: Store<IApplicationState> = null;
    let props: IHomePageProps = null;
    let wrapper: ReactWrapper = null;
    let deleteProjectSpy: jest.SpyInstance = null;
    let closeProjectSpy: jest.SpyInstance = null;
    const recentProjects = MockFactory.createTestProjects(2);
    const storageProviderMock = {
        writeText: jest.fn((project) => Promise.resolve(project)),
        deleteFile: jest.fn(() => Promise.resolve()),
    };
    StorageProviderFactory.create = jest.fn(() => storageProviderMock);

    function createComponent(store, props: IHomePageProps): ReactWrapper {
        return mount(
            <Provider store={store}>
                <Router>
                    <HomePage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeAll(() => {
        registerMixins();
        toast.success = jest.fn(() => 2);
        toast.info = jest.fn(() => 2);
    });

    beforeEach(async () => {
        const projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve(project));
        projectServiceMock.prototype.delete = jest.fn(() => Promise.resolve());

        store = await createStore(recentProjects);
        props = createProps();
        deleteProjectSpy = jest.spyOn(props.actions, "deleteProject");
        closeProjectSpy = jest.spyOn(props.actions, "closeProject");

        wrapper = createComponent(store, props);
    });

    it("should render a New Project Link", () => {
        expect(wrapper.find("a.new-project").exists()).toBe(true);
    });

    it("should not close projects when homepage loads", () => {
        expect(closeProjectSpy).not.toBeCalled();
    });

    it("should render a list of recent projects", () => {
        expect(wrapper).not.toBeNull();
        const homePage = wrapper.find(HomePage).childAt(0) as ReactWrapper<IHomePageProps>;
        if (homePage.props().recentProjects && homePage.props().recentProjects.length > 0) {
            expect(wrapper.find(CondensedList).exists()).toBeTruthy();
        }
    });

    it("should delete a project when clicking trash icon", async () => {
        const store = createStore(recentProjects);
        const props = createProps();
        const wrapper = createComponent(store, props);

        expect(wrapper.find(".recent-project-item").length).toEqual(recentProjects.length);
        wrapper.find(".delete-btn").first().simulate("click");

        // Accept the modal delete warning
        wrapper.find(".modal-footer button").first().simulate("click");

        await MockFactory.flushUi();
        wrapper.update();

        const homePage = wrapper.find(HomePage).childAt(0) as ReactWrapper<IHomePageProps>;

        expect(deleteProjectSpy).toBeCalledWith(recentProjects[0]);
        expect(homePage.props().recentProjects.length).toEqual(recentProjects.length - 1);
        expect(toast.info).toBeCalledWith(expect.stringContaining(recentProjects[0].name));
    });

    it("opens the cloud picker when selecting the open cloud project button", () => {
        const mockCloudFilePicker = CloudFilePicker as jest.Mocked<typeof CloudFilePicker>;

        wrapper.find("a.cloud-open-project").first().simulate("click");
        expect(mockCloudFilePicker.prototype.open).toBeCalled();
    });

    it("loads a cloud project after project file has been selected", () => {
        const openProjectSpy = jest.spyOn(props.actions, "loadProject");
        const testProject = MockFactory.createTestProject("TestProject");
        const projectJson = JSON.stringify(testProject, null, 4);
        const cloudFilePicker = wrapper.find(CloudFilePicker) as ReactWrapper<ICloudFilePickerProps>;
        cloudFilePicker.props().onSubmit(projectJson);

        expect(openProjectSpy).toBeCalledWith(testProject);
    });

    it("closes any open project and navigates to the new project screen", () => {
        const eventMock = {
            preventDefault: jest.fn(),
        };

        const homepage = wrapper.find(HomePage).childAt(0) as ReactWrapper<IHomePageProps, IHomePageState>;
        homepage.find("a.new-project").simulate("click", eventMock);
        expect(closeProjectSpy).toBeCalled();
        expect(homepage.props().history.push).toBeCalledWith("/projects/create");
        expect(eventMock.preventDefault).toBeCalled();
    });

    function createProps(): IHomePageProps {
        return {
            recentProjects: [],
            project: MockFactory.createTestProject(),
            connections: MockFactory.createTestConnections(),
            history: {
                length: 0,
                action: null,
                location: null,
                push: jest.fn(),
                replace: jest.fn(),
                go: jest.fn(),
                goBack: jest.fn(),
                goForward: jest.fn(),
                block: jest.fn(),
                listen: jest.fn(),
                createHref: jest.fn(),
            },
            location: {
                hash: null,
                pathname: null,
                search: null,
                state: null,
            },
            actions: (projectActions as any) as IProjectActions,
            applicationActions: (applicationActions as any) as IApplicationActions,
            appSettings: {
                securityTokens: [],
            },
            match: {
                params: {},
                isExact: true,
                path: `https://localhost:3000/`,
                url: `https://localhost:3000/`,
            },
            appTitleActions: {
                // tslint:disable-next-line:no-empty
                setTitle(title: string) {},
            },
        };
    }

    async function createStore(recentProjects: IProject[]): Promise<Store<IApplicationState, AnyAction>> {
        const initialState: IApplicationState = {
            currentProject: null,
            appSettings: MockFactory.appSettings(),
            connections: [],
            recentProjects,
            appError: null,
        };

        return await createReduxStore(initialState);
    }
});
