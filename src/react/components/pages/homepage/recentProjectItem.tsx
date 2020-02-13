// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Link } from "react-router-dom";
import { FontIcon } from "office-ui-fabric-react";
import { strings } from "../../../../common/strings";

export default function RecentProjectItem({ item, onClick, onDelete }) {
    return (
        <li className="recent-project-item">
            {/* eslint-disable-next-line */}
            <a className="condensed-list-item" href="#" onClick={onClick}>
                <FontIcon iconName="OpenFolderHorizontal" />
                <span className="px-2 ms-Fabric" style={{color: "inherit"}}>{item.name}</span>
                <Link className="float-right"
                    to="#"
                    title={strings.common.delete}
                    aria-label={strings.common.delete}
                    onClick={onDelete}>
                    <FontIcon iconName="Delete" />
                </Link>
            </a>
        </li>
    );
}
