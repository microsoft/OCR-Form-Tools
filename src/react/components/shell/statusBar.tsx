// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { FontIcon } from "office-ui-fabric-react";
import { appInfo } from "../../../common/appInfo";
import "./statusBar.scss";

export class StatusBar extends React.Component {
    public render() {
        return (
            <div className="status-bar">
                <div className="status-bar-main">{this.props.children}</div>
                <div className="status-bar-version">
                    <ul>
                        <li>
                            <FontIcon iconName="BranchMerge" />
                            <span>{appInfo.version}-e8ad9a3</span>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
