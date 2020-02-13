// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Link, NavLink } from "react-router-dom";
import { FontIcon } from "office-ui-fabric-react";
import { strings } from "../../../../common/strings";

export default function ConnectionItem({ item, onClick, onDelete }) {
    return (
        <li onClick={onClick}>
            <NavLink className="condensed-list-item" to={`/connections/${item.id}`}>
                <FontIcon iconName="Edit" />
                <span className="px-2">{item.name}</span>
                <Link className="float-right"
                    to="#"
                    title={strings.common.delete}
                    aria-label={strings.common.delete}
                    onClick={onDelete}>
                    <FontIcon iconName="Delete" />
                </Link>
            </NavLink>
        </li>
    );
}
