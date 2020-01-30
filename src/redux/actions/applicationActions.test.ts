// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import createMockStore, { MockStoreEnhanced } from "redux-mock-store";
import thunk from "redux-thunk";
import * as applicationActions from "./applicationActions";
import { ActionTypes } from "./actionTypes";
import { IAppSettings } from "../../models/applicationState";
import { IApplicationState } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";
import initialState from "../store/initialState";

describe("Application Redux Actions", () => {
    let store: MockStoreEnhanced<IApplicationState>;
    const appSettings = MockFactory.appSettings();

    beforeEach(() => {
        const middleware = [thunk];
        const mockState: IApplicationState = {
            ...initialState,
            appSettings,
        };
        store = createMockStore<IApplicationState>(middleware)(mockState);
    });

    it("Save app settings action saves state", async () => {
        const appSettings: IAppSettings = {
            securityTokens: [
                { name: "A", key: "1" },
                { name: "B", key: "2" },
                { name: "C", key: "3" },
            ],
        };

        const result = await applicationActions.saveAppSettings(appSettings)(store.dispatch);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.SAVE_APP_SETTINGS_SUCCESS,
            payload: appSettings,
        });

        expect(result).toEqual(appSettings);
    });

    it("Ensure security token action creates a token if one doesn't exist", async () => {
        const appSettings: IAppSettings = {
            securityTokens: [
                { name: "A", key: "1" },
                { name: "B", key: "2" },
                { name: "C", key: "3" },
            ],
        };
        const middleware = [thunk];
        const mockState: IApplicationState = {
            ...initialState,
            appSettings,
        };

        store = createMockStore<IApplicationState>(middleware)(mockState);

        const testProject = MockFactory.createTestProject("TestProject");

        const result = await applicationActions.ensureSecurityToken(testProject)(store.dispatch, store.getState);
        const actions = store.getActions();

        expect(actions.length).toEqual(1);
        expect(actions[0]).toEqual({
            type: ActionTypes.ENSURE_SECURITY_TOKEN_SUCCESS,
            payload: result,
        });

        expect(testProject.securityToken).toEqual("Project TestProject Token");
        expect(result.securityTokens).toHaveLength(4);
        expect(result.securityTokens[3].name).toBe(testProject.securityToken);
    });
});
