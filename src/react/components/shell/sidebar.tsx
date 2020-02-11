// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { NavLink } from "react-router-dom";
import ConditionalNavLink from "../common/conditionalNavLink/conditionalNavLink";
import { strings } from "../../../common/strings";

/**
 * Side bar that remains visible throughout app experience
 * Contains links to editor, settings, export, etc.
 * @param param0 - {
 *      project - IProject
 * }
 */
export function Sidebar({ project }) {
    const projectId = project ? project.id : null;

    return (
        <div className="bg-lighter-2 app-sidebar">
            <ul>
                <li>
                    <NavLink title={"Home"} to={`/`} exact>
                        <i className="ms-Icon ms-Icon--Home" aria-hidden="true"></i>
                    </NavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.tags.editor}
                        to={`/projects/${projectId}/edit`}>
                        <i className="ms-Icon ms-Icon--Tag" aria-hidden="true"></i>
                    </ConditionalNavLink>
                </li>
               <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.train.title}
                        to={`/projects/${projectId}/train`}>
                        <i className="ms-Icon ms-Icon--MachineLearning" aria-hidden="true"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={`Predict`}
                        to={`/projects/${projectId}/predict`}>
                        <i className="ms-Icon ms-Icon--Insights" aria-hidden="true"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.projectSettings.title}
                        to={`/projects/${projectId}/settings`}>
                        <i className="ms-Icon ms-Icon--DocumentManagement" aria-hidden="true"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <NavLink title={strings.connections.title} to={`/connections`}>
                        <i className="ms-Icon ms-Icon--Plug" aria-hidden="true"></i>
                    </NavLink>
                </li>
            </ul>
            <div className="app-sidebar-fill"></div>
            <ul>
                <li>
                    <NavLink title={strings.appSettings.title} to={`/settings`}>
                        <i className="ms-Icon ms-Icon--Settings" aria-hidden="true"></i>
                    </NavLink>
                </li>
            </ul>
        </div>
    );
}
