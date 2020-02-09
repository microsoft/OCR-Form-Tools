// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Dispatch } from "redux";
import { createPayloadAction, IPayloadAction } from "./actionCreators";
import { ActionTypes } from "./actionTypes";

/**
 * Action to set app title
 * @member setTitle
 * @interface
 */
export default interface IAppTitleActions {
    setTitle(title: string): void;
}

/**
 * set app title
 * @param title {string} the title of app
 * @returns {(dispatch: Dispatch) => void}
 */
export function setTitle(title: string): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch) => {
        dispatch(setTitleAction(title));
    };
}

/**
 * Set app title
 */
export interface ISetTitleAction extends IPayloadAction<string, string> {
    type: ActionTypes.SET_TITLE;
}

/**
 * Instance of set title action
 */
export const setTitleAction = createPayloadAction<ISetTitleAction>(ActionTypes.SET_TITLE);
