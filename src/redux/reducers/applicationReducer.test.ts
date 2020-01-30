// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { reducer } from "./applicationReducer";
import { IAppSettings } from "../../models/applicationState";
import { saveAppSettingsAction } from "../actions/applicationActions";
import { anyOtherAction } from "../actions/actionCreators";

describe("Application Reducer", () => {
    it("Saves app settings state is persisted", () => {
        const state: IAppSettings = {
            securityTokens: [],
        };

        const payload: IAppSettings = {
            securityTokens: [
                { name: "A", key: "1" },
                { name: "B", key: "2" },
                { name: "C", key: "3" },
            ],
        };

        const action = saveAppSettingsAction(payload);
        const result = reducer(state, action);

        expect(result).not.toBe(state);
        expect(result).toEqual(payload);
    });

    it("Unknown action performs noop", () => {
        const state: IAppSettings = {
            securityTokens: [],
        };

        const action = anyOtherAction();
        const result = reducer(state, action);
        expect(result).toBe(state);
    });
});
