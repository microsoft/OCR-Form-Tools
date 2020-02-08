// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Dispatch } from "redux";
import { ActionTypes } from "./actionTypes";
import { createPayloadAction, IPayloadAction } from "./actionCreators";
import { IAppSettings } from "../../models/applicationState";
import { IProject, IApplicationState } from "../../models/applicationState";
import { generateKey } from "../../common/crypto";

/**
 * Actions to make changes to application settings
 * @member toggleDevTools - Open or close dev tools
 * @member reloadApplication - Reload application
 */
export default interface IApplicationActions {
    saveAppSettings(appSettings: IAppSettings): IAppSettings;
    ensureSecurityToken(project: IProject): IAppSettings;
}

/**
 * Save app settings
 */
export function saveAppSettings(appSettings: IAppSettings): (dispatch: Dispatch) => Promise<IAppSettings> {
    return (dispatch: Dispatch) => {
        dispatch(saveAppSettingsAction(appSettings));
        return Promise.resolve(appSettings);
    };
}

/**
 * Ensures that a valid security token is associated with the project, otherwise creates one
 * @param project The project to validate
 */
export function ensureSecurityToken(project: IProject):
    (dispatch: Dispatch, getState: () => IApplicationState) => Promise<IAppSettings> {
    return async (dispatch: Dispatch, getState: () => IApplicationState) => {
        const appState = getState();
        let securityToken = appState.appSettings.securityTokens
            .find((st) => st.name === project.securityToken);

        if (securityToken) {
            return appState.appSettings;
        }

        // check if there's token with the same prefix
        const tokenPrefix = `${project.name} Token`;
        const tokenCountWithTheSamePrefix = appState.appSettings.securityTokens
            .filter((st) => st.name.startsWith(tokenPrefix))
            .length;

        const tokenSuffix = tokenCountWithTheSamePrefix === 0 ? `` : ` [${tokenCountWithTheSamePrefix}]`;
        securityToken = {
            name: `${tokenPrefix}${tokenSuffix}`,
            key: generateKey(),
        };

        const updatedAppSettings: IAppSettings = {
            securityTokens: [...appState.appSettings.securityTokens, securityToken],
        };

        await this.saveAppSettings(updatedAppSettings);

        project.securityToken = securityToken.name;
        dispatch(ensureSecurityTokenAction(updatedAppSettings));
        return updatedAppSettings;
    };
}

/**
 * Save app settings action type
 */
export interface ISaveAppSettingsAction extends IPayloadAction<string, IAppSettings> {
    type: ActionTypes.SAVE_APP_SETTINGS_SUCCESS;
}

/**
 * Ensure project security token action type
 */
export interface IEnsureSecurityTokenAction extends IPayloadAction<string, IAppSettings> {
    type: ActionTypes.ENSURE_SECURITY_TOKEN_SUCCESS;
}

/**
 * Instance of save app settings action
 */
export const saveAppSettingsAction = createPayloadAction<ISaveAppSettingsAction>(ActionTypes.SAVE_APP_SETTINGS_SUCCESS);
/**
 * Instance of Export Project action
 */
export const ensureSecurityTokenAction =
    createPayloadAction<IEnsureSecurityTokenAction>(ActionTypes.ENSURE_SECURITY_TOKEN_SUCCESS);
