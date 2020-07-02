// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { connect } from "react-redux";
import { FontIcon, CommandBarButton, IButtonStyles, IIconProps,  IOverflowSetItemProps, OverflowSet, Customizer, ICustomizations, Separator, ContextualMenuItemType } from "@fluentui/react";
import { IApplicationState } from "../../../models/applicationState";
import { PlatformType, isElectron } from "../../../common/hostProcess";
import { getLightGreyTheme, getSubMenuTheme } from "../../../common/themes";
import "./titleBar.scss";

const isElectronCheck = isElectron();
const platform = global && global.process && global.process.platform ? global.process.platform : PlatformType.Web;
const isMac = platform === "darwin";
const isLinux = platform === "linux";
const isElectronAndNotMacOrLinux = isElectronCheck && !(isMac || isLinux);
const isNotElectronAndMacOrLinux = !(isElectronCheck && (isMac || isLinux));

export interface ITitleBarProps extends React.Props<TitleBar> {
    icon?: string | JSX.Element;
    title?: string;
}

export interface ITitleBarState {
    maximized: boolean;
    fullscreen: boolean;
    menu: Electron.Menu;
}

function mapStateToProps(state: IApplicationState) {
    return {
        title: state.appTitle,
    };
}

@connect(mapStateToProps, null)
export class TitleBar extends React.Component<ITitleBarProps, ITitleBarState> {
    public state: ITitleBarState = {
        maximized: false,
        fullscreen: false,
        menu: null,
    };

    private remote: Electron.Remote;
    private currentWindow: Electron.BrowserWindow;

    public componentDidMount() {
        if (isElectronCheck) {
            this.remote = window.require("electron").remote as Electron.Remote;
            this.currentWindow = this.remote.getCurrentWindow();
            this.currentWindow.on("maximize", () => this.onMaximize(true));
            this.currentWindow.on("unmaximize", () => this.onMaximize(false));
            this.currentWindow.on("enter-full-screen", () => this.onFullScreen(true));
            this.currentWindow.on("leave-full-screen", () => this.onFullScreen(false));

            this.setState({
                maximized: this.currentWindow.isMaximized(),
                fullscreen: this.currentWindow.isFullScreen(),
                menu: this.remote.Menu.getApplicationMenu(),
            });
        }
    }

    public render() {
        if (this.state.fullscreen) {
            return null;
        }

        const titleBarTheme: ICustomizations = {
            settings: {
              theme: getLightGreyTheme(),
            },
            scopedSettings: {},
        };

        const onRenderItem = (item: IOverflowSetItemProps): JSX.Element => {
            const buttonStyles: Partial<IButtonStyles> = {
                root: {
                    padding: '0 5px',
                    alignSelf: 'stretch',
                }
            };
            const iconStyles: Partial<IIconProps> = {
                style: {display: "none"}
            };

            return (
                <CommandBarButton
                    menuProps={item.subMenuProps}
                    styles={buttonStyles}
                    text={item.name}
                    menuIconProps={iconStyles}
                />
            );
        };

        const onRenderOverflowButton = (overflowItems: any[] | undefined): JSX.Element => {
            return (
                <CommandBarButton
                    ariaLabel="More items"
                    role="menuitem"
                    menuProps={{ items: overflowItems! }}
                />
            );
        };

        return (
            <div className="title-bar bg-lighter-3">
                {isNotElectronAndMacOrLinux &&
                    <div className="title-bar-icon">
                        {typeof (this.props.icon) === "string" && <FontIcon iconName={this.props.icon} />}
                        {typeof (this.props.icon) !== "string" && this.props.icon}
                    </div>
                }
                {isElectronAndNotMacOrLinux &&
                    <Customizer {...titleBarTheme}>
                        <OverflowSet
                            role="menubar"
                            items={this.addDefaultMenuItems(this.state.menu)}
                            onRenderOverflowButton={onRenderOverflowButton}
                            onRenderItem={onRenderItem}
                        />
                    </Customizer>
                }
                <div className="title-bar-main">{this.props.title || "Welcome"}</div>
                <div className="title-bar-controls">
                    {this.props.children}
                    {isElectronAndNotMacOrLinux &&
                        [
                            <Separator vertical key="seperator" className="mr-2 ml-2"/>,
                            <div key="minimizeDiv">
                                <FontIcon className="end-icons" iconName="ChromeMinimize" onClick={this.minimizeWindow}/>
                            </div>,
                            <div key="resizeDiv">
                                {this.state.maximized
                                    ? <FontIcon  className="end-icons" iconName="ChromeRestore" onClick={this.unmaximizeWindow}/>
                                    : <FontIcon className="end-icons" iconName="SquareShape" onClick={this.maximizeWindow}/>
                                }
                            </div>,
                            <div key="closeDiv">
                                <FontIcon className="app-close-icon" iconName="Cancel" onClick={this.closeWindow}/>
                            </div>
                        ]
                    }
                </div>
            </div>
        );
    }


    private addDefaultMenuItems = (menu: Electron.Menu) => {
        if (!menu) {
            return null;
        }

        return menu.items.reduce(this.renderMenuItem, []);
    }

    private renderMenuItem = (results, menuItem: Electron.MenuItem) => {
        if (!menuItem.visible) {
            return null;
        }

        const itemType: string = menuItem["type"];

        switch (itemType) {
            case "separator":
                results.push({
                    key: menuItem.label,
                    itemType: ContextualMenuItemType.Divider,
                })
                break;
            case "submenu":
                results.push({
                    key: menuItem.label,
                    name: menuItem.label,
                    subMenuProps: {
                        theme: getSubMenuTheme(),
                        items: this.addDefaultMenuItems(menuItem["submenu"]),
                    }
                });
                break;
            case "normal":
                results.push({
                    key: menuItem.label,
                    name: menuItem.label,
                    onClick: (e) => this.onMenuItemClick(e, menuItem)
                });

        }
        return results;
    }

    private onMenuItemClick(e: any, menuItem: Electron.MenuItem) {
        if (menuItem.label === "Zoom In") {
            this.currentWindow.webContents.setZoomLevel(this.currentWindow.webContents.getZoomLevel() + .3)
        } else if (menuItem.label === "Zoom Out") {
            this.currentWindow.webContents.setZoomLevel(this.currentWindow.webContents.getZoomLevel() - .3)
        } else if (menuItem.label === "Reset Zoom") {
            this.currentWindow.webContents.setZoomLevel(0);
        } else if (menuItem.click) {
            menuItem.click.call(menuItem, menuItem, this.currentWindow);
        }
    }

    private onMaximize = (isMaximized: boolean) => {
        this.setState({
            maximized: isMaximized,
        });
    }

    private onFullScreen = (isFullScreen: boolean) => {
        this.setState({
            fullscreen: isFullScreen,
        });
    }

    private minimizeWindow = () => {
        this.currentWindow.minimize();
    }

    private maximizeWindow = () => {
        this.currentWindow.maximize();
    }

    private unmaximizeWindow = () => {
        this.currentWindow.unmaximize();
    }

    private closeWindow = () => {
        this.currentWindow.close();
    }

}
