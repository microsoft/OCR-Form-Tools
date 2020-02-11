// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { strings } from "../../../../common/strings";
import { IconButton } from "../../common/iconButton/iconButton";

export default function RecentProjectItem({ item, onClick, onDelete }) {
    return (
        <li className="recent-project-item">
            {/* eslint-disable-next-line */}
            <a href="#" onClick={onClick}>
                <i className="ms-Icon ms-Icon--OpenFolderHorizontal"></i>
                <span className="px-2 ms-Fabric" style={{color: "inherit"}}>{item.name}</span>
                <IconButton
                    iconClassName="ms-Icon ms-Icon--Delete"
                    buttonClassName="float-right delete-btn"
                    title={strings.common.delete}
                    onClick={onDelete}/>
            </a>
        </li>
    );
}
