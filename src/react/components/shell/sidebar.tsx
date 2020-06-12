// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { NavLink } from "react-router-dom";
import { FontIcon } from "@fluentui/react";
import ConditionalNavLink from "../common/conditionalNavLink/conditionalNavLink";
import { strings } from "../../../common/strings";
import './sidebar.scss'

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
        <div className="bg-lighter-2 app-sidebar" id="appSidebar">
            <ul>
                <li>
                    <NavLink title={"Home"} to={`/`} exact role="button">
                        <FontIcon iconName="Home" />
                    </NavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.tags.editor}
                        to={`/projects/${projectId}/edit`}>
                        <FontIcon iconName="Tag" />
                    </ConditionalNavLink>
                </li>
               <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.train.title}
                        to={`/projects/${projectId}/train`}>
                        <FontIcon iconName="MachineLearning" />
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={`Analyze`}
                        to={`/projects/${projectId}/predict`}>
                        <FontIcon iconName="Insights" />
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.projectSettings.title}
                        to={`/projects/${projectId}/settings`}>
                        <FontIcon iconName="DocumentManagement" />
                    </ConditionalNavLink>
                </li>
                <li className="receipt-demo-sidebar-item">
                    <NavLink title={strings.receipts.title} to={`/receipts`} role="button">
                        <FontIcon iconName="KeyPhraseExtraction" />
                        <div className="demo-badge">Preview</div>
                    </NavLink>
                </li>
                <li>
                    <NavLink title={strings.connections.title} to={`/connections`} role="button">
                        <FontIcon iconName="Plug" />
                    </NavLink>
                </li>
            </ul>
            <div className="app-sidebar-fill"></div>
            <ul>
                <li>
                    <NavLink title={strings.appSettings.title} to={`/settings`} role="button">
                        <FontIcon iconName="Settings" />
                    </NavLink>
                </li>
            </ul>
        </div>
    );
}
