// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// tslint:disable-next-line:no-var-requires
const buildConfig = require("../buildConfig.json");

/**
 * Defines the API information
 */
export interface IBuildInfo {
    /** If API is selectable */
    enableAPIVersionSelection: boolean;
}

/**
 * Gets current API info
 */
export const buildInfo = buildConfig as IBuildInfo;
