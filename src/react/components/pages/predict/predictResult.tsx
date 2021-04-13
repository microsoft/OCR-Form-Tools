// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ITag } from "../../../../models/applicationState";
import "./predictResult.scss";
import { getPrimaryGreenTheme } from "../../../../common/themes";
import { FontIcon, PrimaryButton, ContextualMenu, IContextualMenuProps } from "@fluentui/react";
import { strings } from "../../../../common/strings";
import { downloadFile, downloadZipFile, zipData } from "../../../../common/utils";

export interface IAnalyzeModelInfo {
    docType: string,
    modelId: string,
    docTypeConfidence: number,
}

export interface ITableResultItem {
    displayOrder: number,
    fieldName: string,
    type: string,
    values: {},
    rowKeys?: [],
    columnKeys: [],
}

export interface IResultItem {
    boundingBox: [],
    confidence: number,
    displayOrder: number,
    elements: [],
    fieldName: string,
    page: number,
    text: string,
    type: string,
    valueString: string,
}

export interface IPredictResultProps {
    predictions: { [key: string]: any };
    analyzeResult: {};
    downloadPrefix?: string;
    page: number;
    tags: ITag[];
    downloadResultLabel: string;
    onAddAssetToProject?: () => void;
    onPredictionClick?: (item: IResultItem) => void;
    onTablePredictionClick?: (item: ITableResultItem, tagColor: string) => void;
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
        const menuProps: IContextualMenuProps = {
            className: "keep-button-120px",
            items: [
                {
                    key: 'JSON',
                    text: 'JSON',
                    onClick: () => this.triggerJSONDownload()
                },
                {
                    key: 'CSV',
                    text: 'CSV',
                    onClick: () => this.triggerCSVDownload()
                }
            ]
        }
        return (
            <div>
                <div className="container-items-center container-space-between results-container">
                    <h5 className="results-header">Prediction results</h5>

                </div>
                <div className="container-items-center container-space-between">
                    {this.props.onAddAssetToProject ?
                        <PrimaryButton
                            theme={getPrimaryGreenTheme()}
                            onClick={this.onAddAssetToProject}
                            text={strings.predict.editAndUploadToTrainingSet} />
                        : <span></span>
                    }
                    <PrimaryButton
                        className="align-self-end keep-button-120px"
                        theme={getPrimaryGreenTheme()}
                        text="Download"
                        allowDisabledFocus
                        autoFocus={true}
                        menuProps={menuProps}
                        menuAs={this.getMenu}
                    />
                </div>
                {this.props.children}
                <div className="prediction-field-header" style={{ marginTop: 28 }}>
                    <h6 className="prediction-field-header-field"> Page # / Field name / Value</h6>
                    <h6 className="prediction-field-header-confidence"> Confidence</h6>
                </div>
                <div className="prediction-header-clear"></div>

                {items.map((item: any, key) => this.renderItem(item, key))}
            </div>
        );
    }

    private getMenu(props: IContextualMenuProps): JSX.Element {
        return <ContextualMenu {...props} />;
    }

    private renderItem = (item: any, key: any) => {
        const postProcessedValue = this.getPostProcessedValue(item);
        const style: any = {
            marginLeft: "0px",
            marginRight: "0px",
            background: this.getTagColor(item.fieldName),
        };

        if (item?.type === "array" || item?.type === "object") {
            const pageNumber = this.getPageNumberFrom(item) || 1;

            return (
                (item?.valueArray || item?.valueObject) ?
                    <div key={key}
                        onClick={() => {
                            this.onTablePredictionClick(item, this.getTagColor(item.fieldName));
                            this.onPredictionMouseLeave(item)
                        }}
                        onMouseEnter={() => this.onPredictionMouseEnter(item)}
                        onMouseLeave={() => this.onPredictionMouseLeave(item)}>
                        <li className="predictiontag-item" style={style}>
                            <div className={"predictiontag-color"}>
                                <span>{pageNumber}</span>
                            </div>
                            <div className={"predictiontag-content"}>
                                {this.getPredictionTagContent(item)}
                            </div>
                        </li>
                        <li className="predictiontag-item-label mt-0 mb-1">
                            <FontIcon className="pr-1 pl-1" iconName="Table" />
                            <span style={{ color: "rgba(255, 255, 255, 0.75)" }}>Click to view analyzed table</span>
                        </li>
                    </div> :
                    <>
                        <li className="predictiontag-item" style={style}>
                            <div className={"predictiontag-color"}></div>
                            <div className={"predictiontag-content"}>
                                {this.getPredictionTagContent(item)}
                            </div>
                        </li>
                        <li className="predictiontag-item-label-null mt-0 mb-1">NULL</li>
                    </>
            )
        } else {
            return (
                <div key={key}
                    onClick={() => this.onPredictionClick(item)}
                    onMouseEnter={() => this.onPredictionMouseEnter(item)}
                    onMouseLeave={() => this.onPredictionMouseLeave(item)}>
                    <li className="predictiontag-item" style={style}>
                        <div className={"predictiontag-color"}>
                            <span>{item.page}</span>
                        </div>
                        <div className={"predictiontag-content"}>
                            {this.getPredictionTagContent(item)}
                        </div>
                    </li>
                    {this.renderPredictionItemLabel(item, postProcessedValue)}
                </div>
            );
        }
    }
    private renderPredictionItemLabel = (item, postProcessedValue) => {
        const displayText = item.text || item.valueString;
        return (displayText == null ?
            <li className={postProcessedValue ? "predictiontag-item-label mt-0" : "predictiontag-item-label-null mt-0 mb-1"}>
                {postProcessedValue ? postProcessedValue : "NULL"}
            </li>
            :
            <>
                <li className={postProcessedValue ? "predictiontag-item-label mt-0" : "predictiontag-item-label mt-0 mb-1"}>
                    {postProcessedValue ? "text: " + displayText : displayText}
                </li>
                {postProcessedValue &&
                    <li className="predictiontag-item-label mb-1">
                        {postProcessedValue}
                    </li>
                }
            </>);
    }

    private getTagColor = (name: string): string => {
        const tag: ITag = this.props.tags.find((tag) => name.toLocaleLowerCase().startsWith(tag.name.toLocaleLowerCase()));
        if (tag) {
            return tag.color;
        }
        return "#999999";
    }

    private isTableTag(item): boolean {
        return (item.type === "array" || item.type === "object");
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
                    {isNaN(item.confidence) ? <span></span> :
                        <span>{(item.confidence * 100).toFixed(2) + "%"}</span>}
                </div>
            </div>
        );
    }

    private onAddAssetToProject = async () => {
        if (this.props.onAddAssetToProject) {
            this.props.onAddAssetToProject();
        }
    }

    private triggerJSONDownload = (): void => {
        const { analyzeResult } = this.props;
        const predictionData = JSON.stringify(analyzeResult);
        downloadFile(predictionData, this.props.downloadResultLabel + ".json", this.props.downloadPrefix);
    }

    private triggerCSVDownload = (): void => {
        const data: zipData[] = [];
        const items = this.getItems();
        let csvContent: string = `Key,Value,Confidence,Page,Bounding Box`;
        items.forEach(item => {
            csvContent += `\n"${item.fieldName}","${item.text ?? ""}",${isNaN(item.confidence) ? "NaN" : (item.confidence * 100).toFixed(2) + "%"},${item.page},"[${item.boundingBox}]"`;
        });
        data.push({
            fileName: `${this.props.downloadPrefix}${this.props.downloadResultLabel}-keyvalues.csv`,
            data: csvContent
        });

        let tableContent: string = "";
        const itemNames = ["fieldName", "text", "confidence", "page", "boundingBox"];
        const getValue = (item: any, fieldName: string) => {
            switch (fieldName) {
                case "fieldName":
                    return `"${item[fieldName]}"`;
                case "text":
                    return `"${item[fieldName]}"`;
                case "confidence":
                    return isNaN(item.confidence) ? "NaN" : (item.confidence * 100).toFixed(2) + "%";
                case "page":
                    return item[fieldName];
                case "boundingBox":
                    return `"[${item.boundingBox}]"`;
                default:
                    return "";
            }
        }
        itemNames.forEach(name => {
            tableContent += (name + ",");
            items.forEach(item => {
                tableContent += (getValue(item, name) + ",");
            })
            tableContent += "\n";
        })
        data.push({
            fileName: `${this.props.downloadPrefix}${this.props.downloadResultLabel}-table.csv`,
            data: tableContent
        });
        downloadZipFile(data, this.props.downloadResultLabel);
    }

    private getItems() {
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
        return items;
    }

    private toPercentage = (x: number): string => {
        return (100 * x).toFixed(1) + "%";
    }

    private onPredictionClick = (prediction: any) => {
        if (this.props.onPredictionClick) {
            this.props.onPredictionClick(prediction);
        }
    }
    private onTablePredictionClick = (prediction: any, tagColor) => {
        if (this.props.onTablePredictionClick) {
            this.props.onTablePredictionClick(prediction, tagColor);
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

    private getPostProcessedValue = (prediction: any) => {
        if (!prediction) {
            return null;
        }

        const { type, text } = prediction;
        if (type) {
            const valueType = `value${this.capitalizeFirstLetter(type)}`;
            const postProcessedValue = prediction[valueType]?.toString();
            if (typeof postProcessedValue === "string" && text !== postProcessedValue) {
                return valueType + ": " + postProcessedValue;
            }
        }

        return null;
    }

    private getPageNumberFrom = (item: any) => {
        if (item && item.hasOwnProperty("page")) {
            return item.page;
        }

        // Get page number from item's children in a recursive way.
        if (item && item.type === "object" && item.valueObject) {
            for (const property of Object.keys(item.valueObject)) {
                const pageNumber = this.getPageNumberFrom(item.valueObject[property]);
                if (pageNumber) {
                    return pageNumber;
                }
            }
        } else if (item && item.type === "array" && item.valueArray) {
            for (const element of item.valueArray) {
                const pageNumber = this.getPageNumberFrom(element);
                if (pageNumber) {
                    return pageNumber;
                }
            }
        }
    }

    private capitalizeFirstLetter = (str: string): string => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
