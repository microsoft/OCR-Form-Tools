// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { applyMiddleware, createStore, Store } from "redux";
import thunk from "redux-thunk";
import rootReducer from "../reducers";
import { IApplicationState } from "../../models/applicationState";
import { mergeInitialState } from "../middleware/localStorage";
import { Env } from "../../common/environment";

/**
 * Creates initial redux store from initial application state
 * @param initialState - Initial state of application
 * @param useLocalStorage - Whether or not to use localStorage middleware
 */
export default async function createReduxStore(
    initialState?: IApplicationState,
    useLocalStorage: boolean = false): Promise<Store> {
    const paths: string[] = ["appSettings", "connections", "recentProjects", "prebuiltSettings"];

    let middlewares = [thunk];

    if (useLocalStorage) {
        const localStorage = require("../middleware/localStorage");
        const storage = localStorage.createLocalStorage({paths});
        middlewares = [
            ...middlewares,
            storage,
        ];
    }

    if (Env.get() === "development") {
        const logger = require("redux-logger");
        const reduxImmutableStateInvariant = require("redux-immutable-state-invariant");
        middlewares = [
            ...middlewares,
            reduxImmutableStateInvariant.default(),
            logger.createLogger(),
        ];
    }

    const mergedInitialState = await mergeInitialState(initialState, paths);

    return createStore(
        rootReducer,
        useLocalStorage ? mergedInitialState : initialState,
        applyMiddleware(...middlewares),
    );
}
