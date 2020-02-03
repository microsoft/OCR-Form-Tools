// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export default function RecentProjectItem({ item, onClick, onDelete }) {
    return (
        <li className="recent-project-item">
            {/* eslint-disable-next-line */}
            <a onClick={onClick}>
                <i className="ms-Icon ms-Icon--OpenFolderHorizontal"></i>
                <span className="px-2 ms-Fabric" style={{color: "inherit"}}>{item.name}</span>
                <div className="float-right delete-btn" onClick={onDelete}><i className="ms-Icon ms-Icon--Delete"></i></div>
            </a>
        </li>
    );
}
