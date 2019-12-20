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
                        <i className="fas fa-home"></i>
                    </NavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.tags.editor}
                        to={`/projects/${projectId}/edit`}>
                        <i className="fas fa-bookmark"></i>
                    </ConditionalNavLink>
                </li>
               <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.train.title}
                        to={`/projects/${projectId}/train`}>
                        <i className="fas fa-train"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={`Predict`}
                        to={`/projects/${projectId}/predict`}>
                        <i className="fas fa-object-ungroup"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.projectSettings.title}
                        to={`/projects/${projectId}/settings`}>
                        <i className="fas fa-sliders-h"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <NavLink title={strings.connections.title}
                        to={`/connections`}><i className="fas fa-plug"></i></NavLink>
                </li>
            </ul>
            <div className="app-sidebar-fill"></div>
            <ul>
                <li><NavLink title={strings.appSettings.title}
                    to={`/settings`}><i className="fas fa-cog"></i></NavLink></li>
            </ul>
        </div>
    );
}
