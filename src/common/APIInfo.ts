// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// tslint:disable-next-line:no-var-requires
const APIConfig = require("../APIConfig.json");

/**
 * Defines the API information
 */
export interface IAPIInfo {
    /** If aPI is selectable */
    enableAPIVersionSelection: boolean;
}

/**
 * Gets current API info
 */
export const APIInfo = APIConfig as IAPIInfo;
