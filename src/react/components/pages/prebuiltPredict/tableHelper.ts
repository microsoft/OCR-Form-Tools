// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {Feature} from "ol";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import {Component} from "react";
import {ImageMap} from "../../common/imageMap/imageMap";

export interface ITableHelper {
    setImageMap(imageMap: ImageMap): void;
    setAnalyzeResult(analyzeResult: any): void;
    drawTables(targetPage: number): void;
    reset(): void;
    setTableState(viewedTableId, state): void;
    getTable(targetPage: number, hoveringFeature: string): any;

    tableIconFeatureStyler(feature, resolution): Style;
    tableBorderFeatureStyler(feature): Style;
    tableIconBorderFeatureStyler(feature): Style;
    handleTableToolTipChange(display: string, width: number, height: number, top: number,
        left: number, rows: number, columns: number, featureID: string): void;

    setTableToView(tableToView, tableToViewId): void;
}

export interface ITableState {
    tableIconTooltip: any;
    hoveringFeature: string;
    tableToView?: object;
    tableToViewId?: string;
}

export class TableHelper<TState extends ITableState> {
    /**
     *
     */
    constructor(private component: Component<{}, TState>) {

    }
    private imageMap: ImageMap;
    private analyzeResult: any;
    private tableIDToIndexMap: object;

    public setImageMap = (imageMap: ImageMap) => {
        this.imageMap = imageMap;
    }
    public setAnalyzeResult = (analyzeResult: any) => {
        this.analyzeResult = analyzeResult;
    }

    public reset = () => {
        this.analyzeResult = null;
    }

    public setTableState = (viewedTableId, state) => {
        this.imageMap.getTableBorderFeatureByID(viewedTableId).set("state", state);
        this.imageMap.getTableIconFeatureByID(viewedTableId).set("state", state);
    }

    public getTable = (targetPage: number, hoveringFeature: string) => {
        const pageOcrData = this.getOcrResultForPage(targetPage);
        return pageOcrData?.pageResults?.tables[this.tableIDToIndexMap[hoveringFeature]] ?? [];
    }

    private getOcrResultForPage = (targetPage: number): any => {
        const isTargetPage = result => result.page === targetPage;
        if (!this.analyzeResult) {
            return {};
        }
        if (this.analyzeResult?.readResults) {
            // OCR schema with analyzeResult/readResults property
            const ocrResultsForCurrentPage = {};
            if (this.analyzeResult.pageResults) {
                ocrResultsForCurrentPage["pageResults"] = this.analyzeResult.pageResults.find(isTargetPage);
            }
            ocrResultsForCurrentPage["readResults"] = this.analyzeResult.readResults.find(isTargetPage);
            return ocrResultsForCurrentPage;
        }
        return {};
    }

    drawTables = (targetPage: number) => {
        const ocrForCurrentPage = this.getOcrResultForPage(targetPage);
        const tableBorderFeatures = [];
        const tableIconFeatures = [];
        const tableIconBorderFeatures = [];

        const ocrReadResults = ocrForCurrentPage["readResults"];
        const ocrPageResults = ocrForCurrentPage["pageResults"];
        const imageExtent = this.imageMap.getImageExtent();

        this.tableIDToIndexMap = {};
        if (ocrPageResults?.tables) {
            const ocrExtent = [0, 0, ocrReadResults.width, ocrReadResults.height];
            ocrPageResults.tables.forEach((table, index) => {

                if (table.cells && table.columns && table.rows) {
                    const tableBoundingBox = getTableBoundingBox(table.cells.map((cell) => cell.boundingBox));
                    const createdTableFeatures = this.createBoundingBoxVectorTable(
                        tableBoundingBox,
                        imageExtent,
                        ocrExtent,
                        ocrPageResults.page,
                        table.rows,
                        table.columns,
                        index);
                    tableBorderFeatures.push(createdTableFeatures["border"]);
                    tableIconFeatures.push(createdTableFeatures["icon"]);
                    tableIconBorderFeatures.push(createdTableFeatures["iconBorder"]);
                }
            });
            if (tableBorderFeatures.length > 0 && tableBorderFeatures.length === tableIconFeatures.length
                && tableBorderFeatures.length === tableIconBorderFeatures.length) {
                this.imageMap.addTableBorderFeatures(tableBorderFeatures);
                this.imageMap.addTableIconFeatures(tableIconFeatures);
                this.imageMap.addTableIconBorderFeatures(tableIconBorderFeatures);
            }
        }
    }

    private createBoundingBoxVectorTable = (boundingBox, imageExtent, ocrExtent, page, rows, columns, index) => {
        const coordinates: any[] = [];
        const polygonPoints: number[] = [];
        const imageWidth = imageExtent[2] - imageExtent[0];
        const imageHeight = imageExtent[3] - imageExtent[1];
        const ocrWidth = ocrExtent[2] - ocrExtent[0];
        const ocrHeight = ocrExtent[3] - ocrExtent[1];

        for (let i = 0; i < boundingBox.length; i += 2) {
            // An array of numbers representing an extent: [minx, miny, maxx, maxy]
            coordinates.push([
                Math.round((boundingBox[i] / ocrWidth) * imageWidth),
                Math.round((1 - (boundingBox[i + 1] / ocrHeight)) * imageHeight),
            ]);

            polygonPoints.push(boundingBox[i] / ocrWidth);
            polygonPoints.push(boundingBox[i + 1] / ocrHeight);
        }
        const tableID = createRegionIdFromBoundingBox(polygonPoints, page);
        this.tableIDToIndexMap[tableID] = index;
        const tableFeatures = {};
        tableFeatures["border"] = new Feature({
            geometry: new Polygon([coordinates]),
            id: tableID,
            state: "rest",
            boundingbox: boundingBox,
        });
        tableFeatures["icon"] = new Feature({
            geometry: new Point([coordinates[0][0] - 6.5, coordinates[0][1] - 4.5]),
            id: tableID,
            state: "rest",
        });

        const iconTR = [coordinates[0][0] - 5, coordinates[0][1]];
        const iconTL = [iconTR[0] - 31.5, iconTR[1]];
        const iconBL = [iconTR[0], iconTR[1] - 29.5];
        const iconBR = [iconTR[0] - 31.5, iconTR[1] - 29.5];

        tableFeatures["iconBorder"] = new Feature({
            geometry: new Polygon([[iconTR, iconTL, iconBR, iconBL]]),
            id: tableID,
            rows,
            columns,
        });

        tableFeatures["border"].setId(tableID);
        tableFeatures["icon"].setId(tableID);
        tableFeatures["iconBorder"].setId(tableID);
        return tableFeatures;
    }

    public tableIconFeatureStyler = (feature, resolution) => {
        if (feature.get("state") === "rest") {
            return new Style({
                image: new Icon({
                    opacity: 0.3,
                    scale: this.imageMap?.getResolutionForZoom(3) ?
                        this.imageMap.getResolutionForZoom(3) / resolution : 1,
                    anchor: [.95, 0.15],
                    anchorXUnits: "fraction",
                    anchorYUnits: "fraction",
                    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAmCAYAAABZNrIjAAABhUlEQVRYR+1YQaqCUBQ9BYZOWkHQyEELSAJbQM7cQiMxmjTXkQtwEomjttAsF6AguoAGjQRX0CRRsI/yg/hlqV8w4b3xfe8ezn3nHN7rKYpy8zwP37o4jkNPkqSbaZrfihGSJHUQ5G63w2QyaZ3V0+mE1WqV43hi0rZt8DzfOkjHcTCfzzsMcr1eYzQatc5kGIbYbrevmWwd3QsA3VR3mXE/jiIT2WKxAEVRhUNIkgSWZSETQ7aq9qil7r/K03UdDMMUgrxer9hsNrgHRhkH+be6CcjfeRAmX13Mxu/k8XjEdDp9a5e+70MQhLxmuVxC0zTQNF24J4oiqKqK/X6f11Tt0U2fJIlTkwFi5nfiGld3ncgisVj3+UCyu0x2z2YzDIfDt2ZxuVzgum5eMx6PwbIs+v1+4Z40TXE+nxEEQV5TtQdJnJre/bTtickynwOPD3dRFCHLMgaDQSGmOI5hGAYOh0NeU7UHSRySOJ/+goiZlzHzqsprRd1NeVuT53Qncbrwsf8D9suXe5WWs/YAAAAASUVORK5CYII=",
                }),
            });
        } else {
            return new Style({
                image: new Icon({
                    opacity: 1,
                    scale: this.imageMap && this.imageMap.getResolutionForZoom(3) ?
                        this.imageMap.getResolutionForZoom(3) / resolution : 1,
                    anchor: [.95, 0.15],
                    anchorXUnits: "fraction",
                    anchorYUnits: "fraction",
                    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAmCAYAAABZNrIjAAABhUlEQVRYR+1YQaqCUBQ9BYZOWkHQyEELSAJbQM7cQiMxmjTXkQtwEomjttAsF6AguoAGjQRX0CRRsI/yg/hlqV8w4b3xfe8ezn3nHN7rKYpy8zwP37o4jkNPkqSbaZrfihGSJHUQ5G63w2QyaZ3V0+mE1WqV43hi0rZt8DzfOkjHcTCfzzsMcr1eYzQatc5kGIbYbrevmWwd3QsA3VR3mXE/jiIT2WKxAEVRhUNIkgSWZSETQ7aq9qil7r/K03UdDMMUgrxer9hsNrgHRhkH+be6CcjfeRAmX13Mxu/k8XjEdDp9a5e+70MQhLxmuVxC0zTQNF24J4oiqKqK/X6f11Tt0U2fJIlTkwFi5nfiGld3ncgisVj3+UCyu0x2z2YzDIfDt2ZxuVzgum5eMx6PwbIs+v1+4Z40TXE+nxEEQV5TtQdJnJre/bTtickynwOPD3dRFCHLMgaDQSGmOI5hGAYOh0NeU7UHSRySOJ/+goiZlzHzqsprRd1NeVuT53Qncbrwsf8D9suXe5WWs/YAAAAASUVORK5CYII=",
                }),
            });
        }
    }

    public tableBorderFeatureStyler(feature) {
        if (feature.get("state") === "rest") {
            return new Style({
                stroke: new Stroke({
                    color: "transparent",
                }),
                fill: new Fill({
                    color: "transparent",
                }),
            });
        } else if (feature.get("state") === "hovering") {
            return new Style({
                stroke: new Stroke({
                    opacity: 0.75,
                    color: "black",
                    lineDash: [2, 6],
                    width: 0.75,
                }),
                fill: new Fill({
                    color: "rgba(217, 217, 217, 0.1)",
                }),
            });
        } else {
            return new Style({
                stroke: new Stroke({
                    color: "black",
                    lineDash: [2, 6],
                    width: 2,
                }),
                fill: new Fill({
                    color: "rgba(217, 217, 217, 0.1)",
                }),
            });
        }
    }

    public tableIconBorderFeatureStyler(_feature) {
        return new Style({
            stroke: new Stroke({
                width: 0,
                color: "transparent",
            }),
            fill: new Fill({
                color: "rgba(217, 217, 217, 0)",
            }),
        });
    }

    setState = <K extends keyof TState>(state: ((prevState: Readonly<TState>) => (Pick<TState, K> | TState | null)) | (Pick<TState, K> | TState | null),
        callback?: () => void) => {
        this.component.setState(state, callback);
    }

    public setTableToView = (tableToView: object, tableToViewId: string): void => {
        const {state} = this.component;
        if (state.tableToViewId) {
            this.setTableState(state.tableToViewId, "rest");
        }
        this.setTableState(tableToViewId, "selected");
        this.setState({
            tableToView,
            tableToViewId,
        });
    }

    public handleTableToolTipChange = (display: string, width: number, height: number, top: number,
        left: number, rows: number, columns: number, featureID: string): void => {
        if (!this.imageMap) {
            return;
        }

        const {state} = this.component;

        if (featureID !== null && this.imageMap.getTableBorderFeatureByID(featureID).get("state") !== "selected") {
            this.imageMap.getTableBorderFeatureByID(featureID).set("state", "hovering");
            this.imageMap.getTableIconFeatureByID(featureID).set("state", "hovering");
        } else if (featureID === null && state.hoveringFeature &&
            this.imageMap.getTableBorderFeatureByID(state.hoveringFeature).get("state") !== "selected") {
            this.imageMap.getTableBorderFeatureByID(state.hoveringFeature).set("state", "rest");
            this.imageMap.getTableIconFeatureByID(state.hoveringFeature).set("state", "rest");
        }
        const newTableIconTooltip = {
            display,
            width,
            height,
            top,
            left,
            rows,
            columns,
        };
        this.setState({
            tableIconTooltip: newTableIconTooltip,
            hoveringFeature: featureID,
        });
    }
}

function getTableBoundingBox(lines: []) {
    const flattenedLines = [].concat(...lines);
    const xAxisValues = flattenedLines.filter((value, index) => index % 2 === 0);
    const yAxisValues = flattenedLines.filter((value, index) => index % 2 === 1);
    const left = Math.min(...xAxisValues);
    const top = Math.min(...yAxisValues);
    const right = Math.max(...xAxisValues);
    const bottom = Math.max(...yAxisValues);
    return ([left, top, right, top, right, bottom, left, bottom]);
}



function createRegionIdFromBoundingBox(boundingBox: number[], page: number) {
    return boundingBox.join(",") + ":" + page;
}


