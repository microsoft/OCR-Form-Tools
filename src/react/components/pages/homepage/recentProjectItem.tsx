// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { FontIcon, IconButton } from "@fluentui/react";
import { strings } from "../../../../common/strings";
import "../../../../App.scss";

export default function RecentProjectItem({ item, onClick, onDelete }) {
    return (
        <li className="recent-project-item">
            {/* eslint-disable-next-line */}
            <a className="condensed-list-item" href="#" onClick={onClick} aria-label={`${item.name} project`}>
                <FontIcon iconName="OpenFolderHorizontal" />
                <span className="px-2 ms-Fabric" style={{color: "inherit"}}>{item.name}</span>
                <IconButton className="float-right app-delete-button"
                    title={strings.common.delete}
                    onClick={onDelete}>
                    <FontIcon iconName="Delete" className="app-delete-icon" />
                </IconButton>
            </a>
        </li>
    );
}
