// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ActionTypes } from "../actions/actionTypes";
import { IConnection } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";

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
