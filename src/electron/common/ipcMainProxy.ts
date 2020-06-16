// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BrowserWindow, IpcMain } from "electron";
import { IIpcProxyMessage, IpcEventNames } from "../../common/ipcProxy";

export type IpcProxyHandler<T> = (sender: any, args: T) => any;

export class IpcMainProxy {

    public handlers: { [type: string]: IpcProxyHandler<any> } = {};

    constructor(private ipcMain: IpcMain, private browserWindow: BrowserWindow) {
        this.init();
    }

    public register<T>(type: string, handler: IpcProxyHandler<T>) {
        this.handlers[type] = handler;
    }

    public registerProxy(proxyPrefix: string, provider: any) {
        Object.getOwnPropertyNames(provider.__proto__).forEach((memberName) => {
            if (typeof (provider[memberName]) === "function") {
                this.register(`${proxyPrefix}:${memberName}`, (sender: any, eventArgs: any[]) => {
                    return provider[memberName].apply(provider, eventArgs);
                });
            }
        });
    }

    public unregisterAll() {
        this.handlers = {};
    }

    private init() {
        this.ipcMain.on(IpcEventNames.Main, (sender: any, message: IIpcProxyMessage<any>) => {
            const handler = this.handlers[message.type];
            if (!handler) {
                console.log(`No IPC proxy handler defined for event type '${message.type}'`);
            }

            const returnArgs: IIpcProxyMessage<any> = {
                id: message.id,
                type: message.type,
            };

            try {
                returnArgs.debug = JSON.stringify(message.args);

                const handlerValue = handler(sender, message.args);
                if (handlerValue && handlerValue.then) {
                    handlerValue.
                        then((result: any) => {
                            returnArgs.result = result;
                            this.browserWindow.webContents.send(IpcEventNames.Renderer, returnArgs);
                        })
                        .catch((err: string) => {
                            returnArgs.error = err;
                            this.browserWindow.webContents.send(IpcEventNames.Renderer, returnArgs);
                        });
                } else {
                    returnArgs.result = handlerValue;
                    this.browserWindow.webContents.send(IpcEventNames.Renderer, returnArgs);
                }
            } catch (err) {
                returnArgs.error = err;
                this.browserWindow.webContents.send(IpcEventNames.Renderer, returnArgs);
            }
        });
    }
}