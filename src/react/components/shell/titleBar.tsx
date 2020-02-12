// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { connect } from "react-redux";
import { IApplicationState } from "../../../models/applicationState";
import { PlatformType } from "../../../common/hostProcess";
import "./titleBar.scss";

export interface ITitleBarProps extends React.Props<TitleBar> {
    icon?: string | JSX.Element;
    title?: string;
}

export interface ITitleBarState {
    platform: string;
    maximized: boolean;
    fullscreen: boolean;
}

function mapStateToProps(state: IApplicationState) {
    return {
        title: state.appTitle,
    };
}

@connect(mapStateToProps, null)
export class TitleBar extends React.Component<ITitleBarProps, ITitleBarState> {
    public state: ITitleBarState = {
        platform: global && global.process && global.process.platform ? global.process.platform : PlatformType.Web,
        maximized: false,
        fullscreen: false,
    };

    public render() {
        if (this.state.fullscreen) {
            return null;
        }

        return (
            <div className="title-bar bg-lighter-3">
                {(this.state.platform === PlatformType.Web) &&
                    <div className="title-bar-icon">
                        {typeof (this.props.icon) === "string" && <i className={`${this.props.icon}`}></i>}
                        {typeof (this.props.icon) !== "string" && this.props.icon}
                    </div>
                }
                <div className="title-bar-main">{this.props.title || "Welcome"}</div>
                <div className="title-bar-controls">
                    {this.props.children}
                </div>
            </div>
        );
    }
}
