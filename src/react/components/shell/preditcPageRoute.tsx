// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useEffect, useState } from "react";
import { Route } from "react-router-dom";
import { useSelector } from 'react-redux'

import PredictPage from "../pages/predict/predictPage";
import { IApplicationState } from '../../../models/applicationState';


/**
 * @name - Predict page Route
 * @description - Controls rendering of predict page
 */

export function PredictPageRoute() {
    const projectProperties = useSelector((state: IApplicationState) => {
        if (state && state.currentProject) {
            const { apiKey, folderPath, apiUriBase, id, predictModelId } = state.currentProject;
            return JSON.stringify({ id, apiKey, apiUriBase, folderPath, predictModelId });
        }
    });

    const [prevProjectProperties, setPrevProjectProperties] = useState(projectProperties)
    const [renderPrediction, setRenderPrediction] = useState(true);

    useEffect(() => {
        if (projectProperties !== prevProjectProperties) {
            setRenderPrediction(false) // unmounts predictionPageRoute component on projectId or train ModelId change
            setPrevProjectProperties(projectProperties);
        }
        return () => setRenderPrediction(true);
    }, [renderPrediction, prevProjectProperties, projectProperties]);

    return (renderPrediction &&
        <Route
            path={[
                "/projects/:projectId/predict",
                "/projects/:projectId/train",
                "/projects/:projectId/edit",
                "/projects/:projectId/settings",
                "/"]}
            component={PredictPage} />
    );
}
