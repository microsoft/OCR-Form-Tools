// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { connect } from "react-redux";
import { FontIcon, CommandBarButton, IButtonStyles, IOverflowSetItemProps, OverflowSet, Customizer, ICustomizations } from "@fluentui/react";
import { IApplicationState } from "../../../models/applicationState";
import { PlatformType, isElectron } from "../../../common/hostProcess";
import "./titleBar.scss";
import { getLightGreyTheme } from "../../../common/themes";

export interface ITitleBarProps extends React.Props<TitleBar> {
    icon?: string | JSX.Element;
    title?: string;
}

export interface ITitleBarState {
    isElectron: boolean;
    platform: string;
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
        isElectron: false,
        platform: global && global.process && global.process.platform ? global.process.platform : PlatformType.Web,
        maximized: false,
        fullscreen: false,
        menu: null,
    };

    private isElectron: boolean;
    private remote: Electron.Remote;
    private currentWindow: Electron.BrowserWindow;

    public componentDidMount() {
        this.isElectron = isElectron();

        if (this.isElectron) {
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

        const dark: ICustomizations = {
            settings: {
              theme: getLightGreyTheme(),
            },
            scopedSettings: {},
        };

        const onRenderItem = (item: IOverflowSetItemProps): JSX.Element => {
            if (item.onRender) {
              return item.onRender(item);
            }
            return (
              <CommandBarButton
                menuProps={item.subMenuProps}
                text={item.name}
              />
            );
          };
          
          const onRenderOverflowButton = (overflowItems: any[] | undefined): JSX.Element => {
            const buttonStyles: Partial<IButtonStyles> = {
              root: {
                minWidth: 0,
                padding: '0 4px',
                alignSelf: 'stretch',
                height: 'auto',
              },
            };
            return (
              <CommandBarButton
                ariaLabel="More items"
                role="menuitem"
                styles={buttonStyles}
                menuProps={{ items: overflowItems! }}
              />
            );
          };

        return (
            <div className="title-bar bg-lighter-3">
                <div className="title-bar-icon">
                    {typeof (this.props.icon) === "string" && <FontIcon iconName={this.props.icon} />}
                    {typeof (this.props.icon) !== "string" && this.props.icon}
                </div>
                {this.isElectron &&
                    <Customizer {...dark}>
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
                    {this.isElectron &&
                        <div>
                            <FontIcon className="app-close-icon" iconName="ChromeMinimize" onClick={this.minimizeWindow}/>
                            {this.state.maximized
                                ? <FontIcon className="app-close-icon" iconName="ChromeRestore" onClick={this.unmaximizeWindow}/>
                                : <FontIcon className="app-close-icon" iconName="SquareShape" onClick={this.maximizeWindow}/>
                            }
                            <FontIcon className="app-close-icon" iconName="Cancel" onClick={this.closeWindow}/>
                        </div>
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
            case "submenu":
                results.push({
                    key: menuItem.label,
                    name: menuItem.label,
                    subMenuProps: {
                        items: this.addDefaultMenuItems(menuItem["submenu"])
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
        if (menuItem.label == "Zoom In") {
            this.currentWindow.webContents.setZoomLevel(this.currentWindow.webContents.zoomLevel + .3);
        } else if (menuItem.label == "Zoom Out") {
            this.currentWindow.webContents.setZoomLevel(this.currentWindow.webContents.zoomLevel - .3);
        } else if (menuItem.label == "Reset Zoom") {
            this.currentWindow.webContents.setZoomLevel(-3);
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
