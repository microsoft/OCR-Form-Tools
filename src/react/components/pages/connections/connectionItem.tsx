// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { NavLink } from "react-router-dom";
import { FontIcon, IconButton } from "@fluentui/react";
import { strings } from "../../../../common/strings";
import "../../../../App.scss";

export default function ConnectionItem({ item, onClick, onDelete }) {
    return (
        <li onClick={onClick}>
            <NavLink className="condensed-list-item" to={`/connections/${item.id}`}
                aria-label={`${item.name} connection`}>
                <FontIcon iconName="Edit" />
                <span className="px-2">{item.name}</span>
                <IconButton className="float-right app-delete-button"
                    title={strings.common.delete}
                    onClick={onDelete}>
                    <FontIcon iconName="Delete" className="app-delete-icon"/>
                </IconButton>
            </NavLink>
        </li>
    );
}
