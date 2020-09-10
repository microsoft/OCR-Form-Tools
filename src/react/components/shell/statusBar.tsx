// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { FontIcon } from "@fluentui/react";
import { constants } from "../../../common/constants";
import "./statusBar.scss";

export class StatusBar extends React.Component {
    public render() {
        return (
            <div className="status-bar">
                <div className="status-bar-main">{this.props.children}</div>
                <div className="status-bar-version">
                    <ul>
                        <li>
                            <a href="https://github.com/microsoft/OCR-Form-Tools/blob/master/CHANGELOG.md" target="blank" rel="noopener noreferrer">
                                <FontIcon iconName="BranchMerge" />
                                <span>{constants.appVersion}-b92b73b</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
