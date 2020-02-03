// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { NavLink } from "react-router-dom";

export default function ConnectionItem({ item, onClick, onDelete }) {
    return (
        <li onClick={onClick}>
            <NavLink to={`/connections/${item.id}`}>
                <i className="ms-Icon ms-Icon--Edit"></i>
                <span className="px-2">{item.name}</span>
                <div className="float-right delete-btn" onClick={onDelete}><i className="ms-Icon ms-Icon--Delete"></i></div>
            </NavLink>
        </li>
    );
}
