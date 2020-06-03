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
    const modelId = useSelector((state: IApplicationState) => {
        if (state.currentProject && state.currentProject.trainRecord) {
            return state.currentProject.trainRecord.modelInfo.modelId;
        }
    });
    const projectId = useSelector((state: IApplicationState) => {
        if (state.currentProject) {
            return state.currentProject.id;
        }
    });

    const [prevModelId, setPrevModelId] = useState(modelId)
    const [prevProjectId, setPrevProjectId] = useState(projectId)
    const [renderPrediction, setRenderPrediction] = useState(true);

    useEffect(() => {
        if (prevProjectId !== projectId || prevModelId !== modelId) {
            setRenderPrediction(false) // unmounts predictionPage on projectId or TrainModelIf change
            setPrevProjectId(projectId);
            setPrevModelId(modelId);
        }
        return () => {setRenderPrediction(true); console.log("* RERENDER ***************")}
    }, [renderPrediction, prevProjectId, projectId, prevModelId, modelId]);

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
