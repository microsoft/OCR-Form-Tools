// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// tslint:disable-next-line:no-var-requires
const APIConfig = require("../apiConfig.json");

/**
 * Defines the API information
 */
export interface IAPIInfo {
    /** If API is selectable */
    enableAPIVersionSelection: boolean;
}

/**
 * Gets current API info
 */
export const APIInfo = APIConfig as IAPIInfo;
