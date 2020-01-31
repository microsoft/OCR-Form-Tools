// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { constants } from "../../common/constants";
import { ActionTypes } from "../actions/actionTypes";
import { IConnection } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";
import { getStorageItem, setStorageItem } from "../middleware/localStorage";

/**
 * Reducer for application connections. Actions handled:
 * SAVE_CONNECTION_SUCCESS
 * DELETE_CONNECTION_SUCCESS
 * LOAD_PROJECT_SUCCESS
 * @param state - Current array of connections
 * @param action - Action that was dispatched
 */
export const reducer = (state: IConnection[] = [], action: AnyAction): IConnection[] => {
    if (!state) {
        state = [];
    }

    switch (action.type) {
        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            const projectJson = getStorageItem(constants.projectFormTempKey);
            if (projectJson) {
                const project = JSON.parse(projectJson);
                project.sourceConnection = action.payload;
                setStorageItem(constants.projectFormTempKey, JSON.stringify(project));
            }
            return [
                { ...action.payload },
                ...state.filter((connection) => connection.id !== action.payload.id),
            ];
        case ActionTypes.DELETE_CONNECTION_SUCCESS:
            return [...state.filter((connection) => connection.id !== action.payload.id)];
        case ActionTypes.LOAD_PROJECT_SUCCESS:
            return [
                { ...action.payload.sourceConnection },
                ...state.filter((connection) => connection.id !== action.payload.sourceConnection.id),
            ];

        default:
            return state;
    }
};
