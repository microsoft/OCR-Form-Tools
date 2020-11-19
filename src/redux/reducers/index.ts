// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {combineReducers} from "redux";
import * as appSettings from "./applicationReducer";
import * as connections from "./connectionsReducer";
import * as currentProject from "./currentProjectReducer";
import * as recentProjects from "./recentProjectsReducer";
import * as appError from "./appErrorReducer";
import * as appTitle from "./appTitleReducer";
import * as prebuiltSettings from "./prebuiltSettingsReducer";

/**
 * All application reducers
 * @member appSettings - Application Settings reducer
 * @member connections - Connections reducer
 * @member recentProjects - Recent Projects reducer
 * @member currentProject - Current Project reducer
 * @member appError = Application error
 */
export default combineReducers({
    appSettings: appSettings.reducer,
    connections: connections.reducer,
    recentProjects: recentProjects.reducer,
    currentProject: currentProject.reducer,
    appError: appError.reducer,
    appTitle: appTitle.reducer,
    prebuiltSettings: prebuiltSettings.reducer
});
