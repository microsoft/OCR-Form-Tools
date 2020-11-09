// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {IApplicationState} from "../../models/applicationState";

/**
 * Initial state of application
 * @member appSettings - Application settings
 * @member connections - Connections
 * @member recentProjects - Recent projects
 * @member currentProject - Current project
 */
const initialState: IApplicationState = {
    appSettings: {
        securityTokens: [],
    },
    connections: [],
    recentProjects: [],
    currentProject: null,
    appError: null,
    prebuiltSettings: null
};

/**
 * Instance of initial application state
 */
export default initialState;
