// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Middleware, Dispatch, AnyAction, MiddlewareAPI } from "redux";
import { constants } from "../../common/constants";
import webStorageManager from "../../common/webStorageManager";

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
    paths.forEach(async (path) => {
        const json = await getStorageItem(path);
        if (json) {
            initialState[path] = JSON.parse(json);
        }
    });

    return initialState;
}

export function setStorageItem(key: string, value: string) {
    webStorageManager.setItem(`${constants.version}_${key}`, value);
}

export async function getStorageItem(key: string) {
    return await webStorageManager.getItem(`${constants.version}_${key}`);
}

export function removeStorageItem(key: string) {
    return webStorageManager.removeItem(`${constants.version}_${key}`);
}
