// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ActionTypes } from "../actions/actionTypes";
import { AnyAction } from "../actions/actionCreators";

/**
 * App Title Reducer
 * Actions handled:
 *  SET_TITLE
 * @param {string} state
 * @param {AnyAction} action
 * @returns {any}
 */
export const reducer = (state: string = null, action: AnyAction) => {
    switch (action.type) {
        case ActionTypes.SET_TITLE:
            return action.payload;
        default:
            return state;
    }
};
