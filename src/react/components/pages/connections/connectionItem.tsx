// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { NavLink } from "react-router-dom";
import { IconButton } from "../../common/iconButton/iconButton";
import { strings } from "../../../../common/strings";

export default function ConnectionItem({ item, onClick, onDelete }) {
    return (
        <li onClick={onClick}>
            <NavLink to={`/connections/${item.id}`}>
                <i className="ms-Icon ms-Icon--Edit"></i>
                <span className="px-2">{item.name}</span>
                <IconButton
                    iconClassName="ms-Icon ms-Icon--Delete"
                    buttonClassName="float-right delete-btn"
                    title={strings.common.delete}
                    onClick={onDelete}/>
            </NavLink>
        </li>
    );
}
