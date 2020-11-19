// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    app, ipcMain, BrowserWindow, BrowserWindowConstructorOptions,
    Menu, MenuItemConstructorOptions,
} from "electron";
import { IpcMainProxy } from "./common/ipcMainProxy";
import LocalFileSystem from "./providers/storage/localFileSystem";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null;
let ipcMainProxy: IpcMainProxy;

const isMac = process.platform === "darwin"
const isLinux = process.platform === "linux"

async function createWindow() {
    const windowOptions: BrowserWindowConstructorOptions = {
        width: 1024,
        height: 768,
        minWidth: 450,
        minHeight: 100,
        frame: isLinux,
        titleBarStyle: "hidden",
        backgroundColor: "#272B30",
        show: false,
        icon: "app-icons/icon.png"
    };
    windowOptions.webPreferences = {
        nodeIntegration: true,
        webSecurity: false,
        enableRemoteModule: true
    };

    const staticUrl = process.env.ELECTRON_START_URL || `file:///${__dirname}/index.html`;
    mainWindow = new BrowserWindow(windowOptions);
    mainWindow.loadURL(staticUrl);
    mainWindow.maximize();

    mainWindow.on("closed", () => {
        mainWindow = null;
        ipcMainProxy.unregisterAll();
    });

    mainWindow.webContents.on("did-fail-load", () => {
        mainWindow.loadURL(staticUrl);
    });

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    ipcMainProxy = new IpcMainProxy(ipcMain, mainWindow);
    registerContextMenu(mainWindow);

    const localFileSystem = new LocalFileSystem(mainWindow);
    ipcMainProxy.registerProxy("LocalFileSystem", localFileSystem);
}

/**
 * Adds standard cut/copy/paste/etc context menu comments when right clicking input elements
 * @param browserWindow The browser window to apply the context-menu items
 */
function registerContextMenu(browserWindow: BrowserWindow): void {
    const selectionMenu = Menu.buildFromTemplate([
        { role: "copy", accelerator: "CmdOrCtrl+C" },
        { type: "separator" },
        { role: "selectAll", accelerator: "CmdOrCtrl+A" },
    ]);

    const inputMenu = Menu.buildFromTemplate([
        { role: "undo", accelerator: "CmdOrCtrl+Z" },
        { role: "redo", accelerator: "CmdOrCtrl+Shift+Z" },
        { type: "separator", label: "separator1"},
        { role: "cut", accelerator: "CmdOrCtrl+X" },
        { role: "copy", accelerator: "CmdOrCtrl+C" },
        { role: "paste", accelerator: "CmdOrCtrl+V" },
        { type: "separator", label: "separator2"},
        { role: "selectAll", accelerator: "CmdOrCtrl+A" },
    ]);

    browserWindow.webContents.on("context-menu", (e, props) => {
        const { selectionText, isEditable } = props;
        if (isEditable) {
            inputMenu.popup({
                window: browserWindow,
            });
        } else if (selectionText && selectionText.trim() !== "") {
            selectionMenu.popup({
                window: browserWindow,
            });
        }
    });

    const menuItems: MenuItemConstructorOptions[] = [
        {
            label: "File", submenu: [
                isMac ? { role: "close" } : { role: "quit" }
            ],
        },
        { role: "editMenu" },
        {
            label: "View", submenu: [
                { role: "reload" },
                { type: "separator", label: "separator1" },
                { role: "toggleDevTools" },
                { role: "togglefullscreen" },
                { type: "separator", label: "separator2" },
                { role: "resetZoom", label: "Reset Zoom" },
                { role: "zoomIn", accelerator:  "CmdOrCtrl+="},
                { role: "zoomOut" },
            ],
        },
        {
            label: "Window", submenu:
                (isMac ? [
                    { role: "minimize" },
                    { role: "front" },
                    { type: "separator" },
                    { role: "window" }
                ] : [
                    { role: "minimize" },
                    { role: "close" }
                ])
        },
    ];
    const menu = Menu.buildFromTemplate(menuItems);
    Menu.setApplicationMenu(menu);
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
