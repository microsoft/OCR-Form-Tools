// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {FontIcon} from "@fluentui/react";
import {constants} from "../../../common/constants";
import axios from 'axios';
import "./statusBar.scss";

interface IStatusBarState {
    commitHash?: string;
}
export class StatusBar extends React.Component<{}, IStatusBarState> {
    componentDidMount() {
        const commitInfoUrl = require("../../../git-commit-info.txt");
        axios.get(commitInfoUrl).then(res => {
            const commitHash = /commit (\S{8})/.exec(res.data)[1];
            this.setState({commitHash});
        });
    }
    public render() {
        return (
            <div className="status-bar">
                <div className="status-bar-main">{this.props.children}</div>
                <div className="status-bar-version">
                    <ul>
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
