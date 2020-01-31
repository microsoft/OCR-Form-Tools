// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Middleware, Dispatch, AnyAction, MiddlewareAPI } from "redux";
import { constants } from "../../common/constants";

export interface ILocalStorageMiddlewareOptions {
    paths: string[];
}

export function createLocalStorage(config: ILocalStorageMiddlewareOptions): Middleware {
    return (store: MiddlewareAPI<Dispatch<AnyAction>>) => (next: Dispatch<AnyAction>) => (action: any) => {
        const result = next(action);
        const state = store.getState();

        config.paths.forEach((path) => {
            if (state[path]) {
                const json = JSON.stringify(state[path]);
                setStorageItem(path, json);
            }
        });

        return result;
    };
}

export function mergeInitialState(state: any, paths: string[]) {
    const initialState = { ...state };
    paths.forEach((path) => {
        const json = getStorageItem(path);
        if (json) {
            initialState[path] = JSON.parse(json);
        }
    });

    return initialState;
}

export function setStorageItem(key: string, value: string) {
    localStorage.setItem(`${constants.version}_${key}`, value);
}

export function getStorageItem(key: string) {
    return localStorage.getItem(`${constants.version}_${key}`);
}

export function removeStorageItem(key: string) {
    return localStorage.removeItem(`${constants.version}_${key}`);
}
