// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// tslint:disable-next-line:no-var-requires
const packageJson = require("../../package.json");
// tslint:disable-next-line:no-var-requires
const appConfig = require("../appConfig.json");

/**
 * Defines the application information
 */
export interface IAppInfo {
    /** The app name */
    name: string;
    /** The app version */
    version: string;
    /** The app description */
    description: string;
    /** Flag for if API version is selectable */
    enableAPIVersionSelection: boolean;
    enablePredictionFileSelection: boolean;

}

/**
 * Gets current application info
 */
export const appInfo = { ...packageJson, enableAPIVersionSelection: appConfig["enableAPIVersionSelection"], enablePredictionFileSelection: appConfig["enablePredictionFileSelection"] } as IAppInfo;
