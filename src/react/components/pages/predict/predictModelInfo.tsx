// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react'
import './predictModelInfo.scss';

export default function PredictModelInfo({ modelInfo }) {
    const { docType, modelId, docTypeConfidence } = modelInfo;
    const getPercentage = (value: number) => {
        const percents = 100 * value;
        return percents % 1 !== 0 ? percents.toFixed(2) : percents;
    };
    const modeType = docType.split(":")[0]
    const modelName = docType.split(":")[1]

    return (
        <div className="model-info-container">
            <div className="model-info-item">
                <span className="title" >Model type:</span>
                <span className="value" >{modeType}</span>
            </div>
            {
                modelName !== modelId &&
            <div className="model-info-item">
                <span className="title" >Model name:</span>
                <span className="value" >{modelName}</span>
            </div>
            }
            <div className="model-info-item">
                <span className="title" >Model id:</span>
                <span className="value" >{modelId}</span>
            </div>
            <div className="model-info-item">
                <span className="title" >Document type confidence:</span>
                <span className="value" >{getPercentage(docTypeConfidence)}%</span>
            </div>
        </div>
    )
}
