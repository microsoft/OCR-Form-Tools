// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { app, ipcMain, BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { IpcMainProxy } from "./common/ipcMainProxy";
import LocalFileSystem from "./providers/storage/localFileSystem";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null;
let ipcMainProxy: IpcMainProxy;

async function createWindow() {
    const windowOptions: BrowserWindowConstructorOptions = {
        width: 1024,
        height: 768,
        frame: process.platform === "linux",
        titleBarStyle: "hidden",
        backgroundColor: "#272B30",
        show: false,
    };

    const staticUrl = process.env.ELECTRON_START_URL || `file:///${__dirname}/index.html`;
    if (process.env.ELECTRON_START_URL) {
        windowOptions.webPreferences = {
            nodeIntegration: true,
            webSecurity: false,
        };
    }

    mainWindow = new BrowserWindow(windowOptions);
    mainWindow.loadURL(staticUrl);
    mainWindow.maximize();

    mainWindow.on("closed", () => {
        mainWindow = null;
        ipcMainProxy.unregisterAll();
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow!.show();
    });

    if (!ipcMainProxy) {
        ipcMainProxy = new IpcMainProxy(ipcMain, mainWindow);

    }

    const localFileSystem = new LocalFileSystem(mainWindow);
    ipcMainProxy.registerProxy("LocalFileSystem", localFileSystem);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
