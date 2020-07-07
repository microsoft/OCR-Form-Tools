// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react'
import './predictModelInfo.scss';

export default function PredictModelInfo({ modelInfo }) {
    const { docType, modelId, docTypeConfidence } = modelInfo;
    const getPercentage = (value: number) => {
        const percents = 100 * value;
        return percents % 1 !== 0 ? percents.toFixed(2) : percents;
    }

    return (
        <div className="model-info-container">
            <h5>Train model info</h5>
            <div className="model-info-item">
                <span className="title" >Type and name:</span>
                <span className="value" >{docType}</span>
            </div>
            <div className="model-info-item">
                <span className="title" >Id:</span>
                <span className="value" >{modelId}</span>
            </div>
            <div className="model-info-item">
                <span className="title" >Document type confidence:</span>
                <span className="value" >{getPercentage(docTypeConfidence)}%</span>
            </div>
        </div>
    )
}
