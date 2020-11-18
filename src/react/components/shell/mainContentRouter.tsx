// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {Switch, Route} from "react-router-dom";
import HomePage from "../pages/homepage/homePage";
import AppSettingsPage from "../pages/appSettings/appSettingsPage";
import TrainPage from "../pages/train/trainPage";
import ConnectionPage from "../pages/connections/connectionsPage";
import EditorPage from "../pages/editorPage/editorPage";
import ProjectSettingsPage from "../pages/projectSettings/projectSettingsPage";
import ModelComposePage from "../pages/modelCompose/modelCompose";
import {PredictPageRoute} from './preditcPageRoute';
import {PrebuiltPredictPage} from "../pages/prebuiltPredict/prebuiltPredictPage";
import {LayoutPredictPage} from "../pages/prebuiltPredict/layoutPredictPage";


/**
 * @name - Main Content Router
 * @description - Controls main content pane based on route
 */

export function MainContentRouter() {
    return (
        <div className="app-content text-light">
            <Switch>
                <Route path="/" exact component={HomePage} />
                <Route path="/settings" component={AppSettingsPage} />
                <Route path="/connections/:connectionId" component={ConnectionPage} />
                <Route path="/connections" exact component={ConnectionPage} />
                <Route path="/projects/:projectId/edit" component={EditorPage} />
                <Route path="/projects/create" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/modelcompose" component={ModelComposePage} />
                <Route path="/projects/:projectId/train" component={TrainPage} />
                <Route path="/projects/:projectId/predict" />
                <Route path="/projects/:projectId/settings" component={ProjectSettingsPage} />
                <Route path="/prebuilts-analyze" component={PrebuiltPredictPage} />
                <Route path="/layout-analyze" component={LayoutPredictPage} />
                <Route component={HomePage} />
            </Switch>
            <PredictPageRoute />
        </div>
    );
}
