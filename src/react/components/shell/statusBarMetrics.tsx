// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import _ from "lodash";
import { FontIcon } from "@fluentui/react";
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
                    <FontIcon iconName="PlugConnected" />
                    <span className="metric-source-connection-name">{project.sourceConnection.name}</span>
                </li>
                <li title={interpolate(strings.projectMetrics.taggedAssets, { count: taggedAssets.length })}>
                    <FontIcon iconName="Tag" />
                    <span className="metric-tagged-asset-count">{taggedAssets.length}</span>
                </li>
                <li title={interpolate(strings.projectMetrics.visitedAssets, { count: visitedAssets.length })}>
                    <FontIcon iconName="View" />
                    <span className="metric-visited-asset-count">{visitedAssets.length}</span>
                </li>
                <li title={`Total Assets (${projectAssets.length})`}>
                    <FontIcon iconName="TextDocument" />
                    <span className="metric-asset-count">{projectAssets.length}</span>
                </li>
            </ul>
        );
    }
}
