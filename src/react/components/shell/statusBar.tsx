// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {FontIcon} from "@fluentui/react";
import {constants} from "../../../common/constants";
import axios from 'axios';
import "./statusBar.scss";
import { IProject } from "../../../models/applicationState";
export interface IStatusBarProps {
    project: IProject;
}
interface IStatusBarState {
    commitHash?: string;
}
export class StatusBar extends React.Component<IStatusBarProps, IStatusBarState> {
    componentDidMount() {
        const commitInfoUrl = require("../../../git-commit-info.txt");
        axios.get(commitInfoUrl).then(res => {
            this.setState({commitHash: res.data});
        });
    }


// export class StatusBar extends React.Component<IStatusBarProps> {
    public render() {
        return (
            <div className="status-bar">
                <div className="status-bar-main">{this.props.children}</div>
                <div className="status-bar-version">
                    <ul>
                        {this.props.project &&
                            <li>
                            <a href="https://github.com/microsoft/OCR-Form-Tools/blob/master/CHANGELOG.md" target="blank" rel="noopener noreferrer">
                                    <FontIcon iconName="AzureAPIManagement" />
                                    <span>{ this.props.project.apiVersion || constants.apiVersion }</span>
                                </a>
                            </li>
                        }
                        <li>
                            <a href="https://github.com/microsoft/OCR-Form-Tools/blob/master/CHANGELOG.md" target="blank" rel="noopener noreferrer">
                                <FontIcon iconName="BranchMerge" />
                                <span>{constants.appVersion}-{this.state?.commitHash}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
