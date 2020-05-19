// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export const IpcEventNames  = {
    Renderer: "ipc-renderer-proxy",
    Main: "ipc-main-proxy",
};

export interface IIpcProxyMessage<TResult> {
    id: string;
    type: string;
    args?: any;
    error?: string;
    result?: TResult;
    debug?: string;
}
