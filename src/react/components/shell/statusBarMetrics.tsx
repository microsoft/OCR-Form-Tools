// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import _ from "lodash";
import { IProject, AssetState } from "../../../models/applicationState";
import { strings, interpolate } from "../../../common/strings";

export interface IStatusBarMetricsProps {
    project: IProject;
}

export class StatusBarMetrics extends React.Component<IStatusBarMetricsProps> {
    public render() {
        const { project } = this.props;

        if (!project) {
            return null;
        }

        const projectAssets = _.values(project.assets);
        const visitedAssets = projectAssets
            .filter((asset) => asset.state === AssetState.Visited || asset.state === AssetState.Tagged);
        const taggedAssets = projectAssets
            .filter((asset) => asset.state === AssetState.Tagged);

        return (
            <ul>
                <li title={strings.projectSettings.sourceConnection.title}>
                    <i className="ms-Icon ms-Icon--PlugConnected"></i>
                    <span className="metric-source-connection-name">{project.sourceConnection.name}</span>
                </li>
                <li title={interpolate(strings.projectMetrics.taggedAssets, { count: taggedAssets.length })}>
                    <i className="ms-Icon ms-Icon--Tag"></i>
                    <span className="metric-tagged-asset-count">{taggedAssets.length}</span>
                </li>
                <li title={interpolate(strings.projectMetrics.visitedAssets, { count: visitedAssets.length })}>
                    <i className="ms-Icon ms-Icon--View"></i>
                    <span className="metric-visited-asset-count">{visitedAssets.length}</span>
                </li>
                <li title={`Total Assets (${projectAssets.length})`}>
                    <i className="ms-Icon ms-Icon--TextDocument"></i>
                    <span className="metric-asset-count">{projectAssets.length}</span>
                </li>
            </ul>
        );
    }
}
