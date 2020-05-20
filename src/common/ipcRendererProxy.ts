// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as shortid from "shortid";
import { IIpcProxyMessage, IpcEventNames } from "./ipcProxy";
import { Deferred } from "./deferred";

export class IpcRendererProxy {

    public static pending: { [id: string]: Deferred<any> } = {};

    public static initialize() {
        if (IpcRendererProxy.initialized) {
            return;
        }

        IpcRendererProxy.ipcRenderer = (window as any).require("electron").ipcRenderer;
        IpcRendererProxy.ipcRenderer.on(IpcEventNames.Renderer, (sender: any, message: IIpcProxyMessage<any>) => {
            const deferred = IpcRendererProxy.pending[message.id];

            if (!deferred) {
                throw new Error(`Cannot find deferred with id '${message.id}'`);
            }

            if (message.error) {
                deferred.reject(message.error);
            } else {
                deferred.resolve(message.result);
            }

            delete IpcRendererProxy.pending[message.id];
        });

        IpcRendererProxy.initialized = true;
    }

    public static send<TResult, TArgs>(type: string, args?: TArgs): Promise<TResult> {
        IpcRendererProxy.initialize();

        const id = shortid.generate();
        const deferred = new Deferred<TResult>();
        IpcRendererProxy.pending[id] = deferred;

        const outgoingArgs: IIpcProxyMessage<TArgs> = {
            id,
            type,
            args,
        };

        IpcRendererProxy.ipcRenderer.send(IpcEventNames.Main, outgoingArgs);

        return deferred.promise;
    }

    private static ipcRenderer: any;
    private static initialized: boolean = false;
}
