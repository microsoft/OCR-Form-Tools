// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ITag } from "../../../../models/applicationState";
import "./predictResult.scss";
import { getPrimaryGreenTheme } from "../../../../common/themes";
import { PrimaryButton } from "office-ui-fabric-react";

export interface IPredictResultProps {
    predictions: { [key: string]: any };
    analyzeResult: {};
    page: number;
    tags: ITag[];
    downloadResultLabel: string;
    onPredictionClick?: (item: any) => void;
    onPredictionMouseEnter?: (item: any) => void;
    onPredictionMouseLeave?: (item: any) => void;
}

export interface IPredictResultState { }

export default class PredictResult extends React.Component<IPredictResultProps, IPredictResultState> {
    public render() {
        const { tags, predictions } = this.props;
        const tagsDisplayOrder = tags.map((tag) => tag.name);
        for (const name of Object.keys(predictions)) {
            const prediction = predictions[name];
            if (prediction != null) {
                prediction.fieldName = name;
                prediction.displayOrder = tagsDisplayOrder.indexOf(name);
            }
        }
        // not sure if we decide to filter item by the page
        const items = Object.values(predictions).filter(Boolean).sort((p1, p2) => p1.displayOrder - p2.displayOrder);

        return (
            <div>
                <div className="prediction-header">
                    <h5 className="prediction-header-result">Result:</h5>
                    <PrimaryButton
                        className="prediction-header-download"
                        theme={getPrimaryGreenTheme()}
                        type="button"
                        title="Download JSON"
                        onClick={this.triggerDownload}>
                        Download result (JSON)
                    </PrimaryButton>
                </div>
                <div className="prediction-field-header">
                    <h6 className="prediction-field-header-field"> Field </h6>
                    <h6 className="prediction-field-header-confidence"> Confidence </h6>
                </div>
                <div className="prediction-header-clear"></div>

                {items.map((item: any, key) => this.renderItem(item, key))}
            </div>
        );
    }

    private renderItem = (item: any, key: any) => {
        const style: any = {
            background: this.getTagColor(item.fieldName),
        };
        return (
            <div key={key}
                onClick={() => this.onPredictionClick(item)}
                onMouseEnter={() => this.onPredictionMouseEnter(item)}
                onMouseLeave={() => this.onPredictionMouseLeave(item)}>
                <li className="predictiontag-item" style={style}>
                    <div className={"predictiontag-color"}>
                        <span>P. {item.page}</span>
                    </div>
                    <div className={"predictiontag-content"}>
                        {this.getPredictionTagContent(item)}
                    </div>
                </li>
                <li className="predictiontag-item-label">
                    {item.text}
                </li>
            </div>
        );
    }

    private getTagColor = (name: string): string => {
        const tag: ITag = this.props.tags.find((tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase());
        if (tag) {
            return tag.color;
        }
        return "#999999";
    }

    private getPredictionTagContent = (item: any) => {
        return (
            <div className={"predictiontag-name-container"}>
                <div className="predictiontag-name-body">
                    {
                        <span title={item.fieldName} className="predictiontag-name-text px-2">
                            {item.fieldName}
                        </span>
                    }
                </div>
                <div className={"predictiontag-confidence"}>
                    <span>{this.toPercentage(item.confidence)}</span>
                </div>
            </div>
        );
    }

    private triggerDownload = (): void => {
        const fileURL = window.URL.createObjectURL(
            new Blob([JSON.stringify(this.props.analyzeResult)]));
        const fileLink = document.createElement("a");
        const fileBaseName = this.props.downloadResultLabel.split(".")[0];
        const downloadFileName = "Result-" + fileBaseName + ".json";

        fileLink.href = fileURL;
        fileLink.setAttribute("download", downloadFileName);
        document.body.appendChild(fileLink);
        fileLink.click();
    }

    private toPercentage = (x: number): string => {
        return (100 * x).toFixed(1) + "%";
    }

    private onPredictionClick = (prediction: any) => {
        if (this.props.onPredictionClick) {
            this.props.onPredictionClick(prediction);
        }
    }

    private onPredictionMouseEnter = (prediction: any) => {
        if (this.props.onPredictionMouseEnter) {
            this.props.onPredictionMouseEnter(prediction);
        }
    }

    private onPredictionMouseLeave = (prediction: any) => {
        if (this.props.onPredictionMouseLeave) {
            this.props.onPredictionMouseLeave(prediction);
        }
    }
}
