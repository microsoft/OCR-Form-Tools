// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export default function RecentProjectItem({ item, onClick, onDelete }) {
    return (
        <li className="recent-project-item">
            {/* eslint-disable-next-line */}
            <a onClick={onClick}>
                <i className="fas fa-folder-open"></i>
                <span className="px-2">{item.name}</span>
                <div className="float-right delete-btn" onClick={onDelete}><i className="fas fa-trash"></i></div>
            </a>
        </li>
    );
}
