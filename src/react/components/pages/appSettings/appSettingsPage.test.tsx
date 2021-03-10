// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Provider } from "react-redux";
import { AnyAction, Store } from "redux";
import { BrowserRouter as Router } from "react-router-dom";
import { ReactWrapper, mount } from "enzyme";
import { IAppSettings, IApplicationState } from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import AppSettingsPage, { IAppSettingsProps } from "./appSettingsPage";
import MockFactory from "../../../../common/mockFactory";
import createReduxStore from "../../../../redux/store/store";
import { AppSettingsForm } from "./appSettingsForm";

jest.mock("react-toastify");
import { toast } from "react-toastify";

describe("App Settings Page", () => {
    function createComponent(
        store: Store<IApplicationState>,
        props: IAppSettingsProps = null): ReactWrapper<IAppSettingsProps> {
        props = props || createProps();

        return mount(
            <Provider store={store}>
                <Router>
                    <AppSettingsPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeAll(() => {
        toast.success = jest.fn(() => 2);
    });

    it("renders correctly", async () => {
        const store = await createStore();
        const wrapper = createComponent(store);
        expect(wrapper.find(AppSettingsForm).length).toEqual(1);
        expect(wrapper.find("button#toggleDevTools").length).toEqual(1);
        expect(wrapper.find("button#refreshApp").length).toEqual(1);
    });

    it("Saves app settings when click on save button", async () => {
        const appSettings = MockFactory.appSettings();
        const store = await createStore(appSettings);
        const props = createProps();
        const saveAppSettingsSpy = jest.spyOn(props.actions, "saveAppSettings");
        const goBackSpy = jest.spyOn(props.history, "goBack");

        const wrapper = createComponent(store, props);
        await MockFactory.flushUi(() => wrapper.find("form").simulate("submit"));
        wrapper.update();

        expect(saveAppSettingsSpy).toBeCalledWith(appSettings);
        expect(toast.success).toBeCalledWith(expect.any(String));
        expect(goBackSpy).toBeCalled();
    });

    it("Navigates the user back to the previous page on cancel", async () => {
        const store = await createStore();
        const props = createProps();
        const goBackSpy = jest.spyOn(props.history, "goBack");

        const wrapper = createComponent(store, props);
        wrapper.find("button.btn-cancel").simulate("click");

        expect(goBackSpy).toBeCalled();
    });

    function createProps(): IAppSettingsProps {
        return {
            appSettings: null,
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
            actions: (applicationActions as any) as IApplicationActions,
            match: {
                params: {},
                isExact: true,
                path: `https://localhost:3000/settings`,
                url: `https://localhost:3000/settings`,
            },
            appTitleActions: {
                // tslint:disable-next-line:no-empty
                setTitle(title: string) {},
            },
        };
    }

    async function createStore(appSettings: IAppSettings = null): Promise<Store<IApplicationState, AnyAction>> {
        const initialState: IApplicationState = {
            currentProject: null,
            appSettings: appSettings || MockFactory.appSettings(),
            connections: [],
            recentProjects: [],
        };

        return await createReduxStore(initialState);
    }
});
