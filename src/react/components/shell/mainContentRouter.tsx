// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useEffect, useState } from "react";
import { Switch, Route } from "react-router-dom";
import { getPathParams } from '../../../common/currPathParams';
import HomePage from "../pages/homepage/homePage";
import AppSettingsPage from "../pages/appSettings/appSettingsPage";
import TrainPage from "../pages/train/trainPage";
import ConnectionPage from "../pages/connections/connectionsPage";
import EditorPage from "../pages/editorPage/editorPage";
import PredictPage from "../pages/predict/predictPage";
import ProjectSettingsPage from "../pages/projectSettings/projectSettingsPage";

/**
 * @name - Main Content Router
 * @description - Controls main content pane based on route
 */

interface IProjectId {
    projectId: string;
}

export function MainContentRouter() {
    const id = getPathParams(window.location.pathname, "projectId") as IProjectId;
    const { projectId } = id;
    const [prevProjectId, setPrevProjectId] = useState(projectId)
    const [renderPrediction, setRenderPrediction] = useState(true);

    useEffect(() => {
        if (prevProjectId !== projectId) {
            setRenderPrediction(false) // unmounts predictionPage on projectId change
            setPrevProjectId(projectId);
        }
        return () => {
            setRenderPrediction(true);
        };
    }, [renderPrediction, prevProjectId, projectId]);

    return (
        <div className="app-content text-light">
            <Switch>
                <Route path="/" exact component={HomePage} />
                <Route path="/settings" component={AppSettingsPage} />
                <Route path="/connections/:connectionId" component={ConnectionPage} />
                <Route path="/connections" exact component={ConnectionPage} />
                <Route path="/projects/:projectId/edit" component={EditorPage} />
                <Route path="/projects/create" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/train" component={TrainPage} />
                <Route path="/projects/:projectId/predict" />
                <Route path="/projects/:projectId/settings" component={ProjectSettingsPage} />
                <Route component={HomePage} />
            </Switch>
            {renderPrediction &&
                <Route
                path={[
                "/projects/:projectId/predict",
                "/projects/:projectId/train",
                "/projects/:projectId/edit",
                "/projects/:projectId/settings",
                "/"]}
                component={ PredictPage } />}
        </div>
    );
}
