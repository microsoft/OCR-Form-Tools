// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {IPrebuiltSettings} from "../../models/applicationState";
import {ActionTypes} from "../actions/actionTypes";
import {IUpdatePrebuiltSettingsAction} from "../actions/prebuiltSettingsActions";

type AnyAction = IUpdatePrebuiltSettingsAction;

/**
 * prebuilt setting Reducer
 * Actions handled:
 * UPDATE_PREBUILT_SETTING
 * @param {IPrebuiltSettings} state
 * @param {AnyAction} action
 * @returns {IPrebuiltSettings}
 */
export const reducer = (state: IPrebuiltSettings = {apiKey: "", serviceURI: ""}, action: AnyAction) :IPrebuiltSettings => {
    switch (action.type) {
        case ActionTypes.UPDATE_PREBUILT_SETTINGS:
            return action.payload;
        default:
            return state;
    }
}
