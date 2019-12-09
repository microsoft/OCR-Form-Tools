import { Middleware, Dispatch, AnyAction, MiddlewareAPI } from "redux";

export interface ILocalStorageMiddlewareOptions {
    paths: string[];
}

const version = "pubpreview_1.0_";

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
    localStorage.setItem(`${version}${key}`, value);
}

export function getStorageItem(key: string) {
    return localStorage.getItem(`${version}${key}`);
}

export function removeStorageItem(key: string) {
    return localStorage.removeItem(`${version}${key}`);
}
