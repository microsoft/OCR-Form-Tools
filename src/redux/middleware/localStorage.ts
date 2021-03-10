// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Middleware, Dispatch, AnyAction, MiddlewareAPI } from "redux";
import { constants } from "../../common/constants";
import { webStorage } from "../../common/webStorage";

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

export async function mergeInitialState(state: any, paths: string[]) {
    const initialState = { ...state };

    for (const path of paths) {
        const isArray = Array.isArray(initialState[path]);

        let legacyItem = isArray ? [] : {};
        let item = isArray ? [] : {};

        const json = (await getStorageItem(path)) as string;
        if (json) {
            item = JSON.parse(json);
        }

        const legacyJson = localStorage.getItem(`${constants.version}_${path}`);
        if (legacyJson) {
            legacyItem = JSON.parse(legacyJson);
            localStorage.removeItem(`${constants.version}_${path}`);
        }

        if (isArray) {
            initialState[path] = [].concat(legacyItem, item);
        } else {
            initialState[path] = { ...initialState[path], ...item, ...legacyItem };
        }
    }

    return initialState;
}

export function setStorageItem(key: string, value: string) {
    webStorage.setItem(`${constants.version}_${key}`, value);
}

export async function getStorageItem(key: string): Promise<string> {
    return (await webStorage.getItem(`${constants.version}_${key}`)) as string;
}

export function removeStorageItem(key: string) {
    return webStorage.removeItem(`${constants.version}_${key}`);
}
