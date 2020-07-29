// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from 'react'
import './predictModelInfo.scss';

export default function PredictModelInfo({ modelInfo }) {
    const { docType, modelId, docTypeConfidence } = modelInfo;
    return (
        <div className="model-info-container">
            <div className="model-info-item">
                <span className="title" >docType:</span>
                <span className="value" >{docType}</span>
            </div>
            <div className="model-info-item">
                <span className="title" >modelId:</span>
                <span className="value" >{modelId}</span>
            </div>
            <div className="model-info-item">
                <span className="title" >docTypeConfidence:</span>
                <span className="value" >{(docTypeConfidence * 100).toFixed(2) + "%"}</span>
            </div>
        </div>
    )
}
