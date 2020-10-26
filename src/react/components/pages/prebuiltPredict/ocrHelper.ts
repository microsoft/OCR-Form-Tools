import {Feature} from "ol";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import {ImageMap} from "../../common/imageMap/imageMap";

export interface IOcrHelper {
    setImageMap(imageMap: ImageMap): void;
    setOcr(ocr: any): void;
    drawOcr(targetPage: number): void;
    reset(): void;
    getOcrResultForPage(targetPage: number): any;
    getTable(targetPage: number, hoveringFeature: string): any;
}

export class OcrHelper implements IOcrHelper {
    private imageMap: ImageMap;
    private ocr: any;
    private regionOrders: Record<string, number>[] = [];
    private regionOrderById: string[][] = [];

    private tableIDToIndexMap: object;

    setImageMap(imageMap: ImageMap) {
        this.imageMap = imageMap;
    }

    setOcr(ocr: any) {
        this.ocr = ocr;
        this.buildRegionOrders();
    }

    reset() {
        this.ocr = null;
        this.regionOrderById = [];
        this.regionOrders = [];
        this.imageMap?.removeAllFeatures();
    }

    private buildRegionOrders() {
        // Build order index here instead of building it during 'drawOcr' for two reasons.
        // 1. Build order index for all pages at once. This allow us to support cross page
        //    tagging if it's supported by FR service.
        // 2. Avoid rebuilding order index when users switch back and forth between pages.
        const ocrs = this.ocr;
        const ocrReadResults = (ocrs.recognitionResults || (ocrs.analyzeResult && ocrs.analyzeResult.readResults));
        const ocrPageResults = (ocrs.recognitionResults || (ocrs.analyzeResult && ocrs.analyzeResult.pageResults));
        const imageExtent = this.imageMap.getImageExtent();
        ocrReadResults.forEach((ocr) => {
            const ocrExtent = [0, 0, ocr.width, ocr.height];
            const pageIndex = ocr.page - 1;
            this.regionOrders[pageIndex] = {};
            this.regionOrderById[pageIndex] = [];
            let order = 0;
            if (ocr.lines) {
                ocr.lines.forEach((line) => {
                    if (line.words) {
                        line.words.forEach((word) => {
                            if (this.shouldDisplayOcrWord(word.text)) {
                                const feature = this.createBoundingBoxVectorFeature(
                                    word.text, word.boundingBox, imageExtent, ocrExtent, ocr.page);
                                this.regionOrders[pageIndex][feature.getId()] = order++;
                                this.regionOrderById[pageIndex].push(feature.getId());
                            }
                        });
                    }
                });
            }
            const checkboxes = ocr.selectionMarks
                || (ocrPageResults && ocrPageResults[pageIndex] && ocrPageResults[pageIndex].checkboxes);
            if (checkboxes) {
                this.addCheckboxToRegionOrder(checkboxes, pageIndex, order, imageExtent, ocrExtent);
            }
        });
    }

    public drawOcr(targetPage: number) {
        this.imageMap.removeAllFeatures();

        const ocrForCurrentPage = this.getOcrResultForPage(targetPage);
        const textFeatures = [];

        const tableBorderFeatures = [];
        const tableIconFeatures = [];
        const tableIconBorderFeatures = [];

        const checkboxFeatures = [];
        const ocrReadResults = ocrForCurrentPage["readResults"];
        const ocrPageResults = ocrForCurrentPage["pageResults"];
        const imageExtent = this.imageMap.getImageExtent();
        if (ocrReadResults) {
            const ocrExtent = [0, 0, ocrReadResults.width, ocrReadResults.height];
            if (ocrReadResults.lines) {
                ocrReadResults.lines.forEach((line) => {
                    if (line.words) {
                        line.words.forEach((word) => {
                            if (this.shouldDisplayOcrWord(word.text)) {
                                textFeatures.push(this.createBoundingBoxVectorFeature(
                                    word.text, word.boundingBox, imageExtent, ocrExtent, ocrReadResults.page));
                            }
                        });
                    }
                });
            }

            this.tableIDToIndexMap = {};
            if (ocrPageResults && ocrPageResults.tables) {
                ocrPageResults.tables.forEach((table, index) => {
                    if (table.cells && table.columns && table.rows) {
                        const tableBoundingBox = this.getTableBoundingBox(table.cells.map((cell) => cell.boundingBox));
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
            }

            if (ocrReadResults && ocrReadResults.selectionMarks) {
                ocrReadResults.selectionMarks.forEach((checkbox) => {
                    checkboxFeatures.push(this.createBoundingBoxVectorFeature(
                        checkbox.state, checkbox.boundingBox, imageExtent, ocrExtent, ocrReadResults.page));
                });
            } else if (ocrPageResults && ocrPageResults.checkboxes) {
                ocrPageResults.checkboxes.forEach((checkbox) => {
                    checkboxFeatures.push(this.createBoundingBoxVectorFeature(
                        checkbox.state, checkbox.boundingBox, imageExtent, ocrExtent, ocrPageResults.page));
                });
            }

            if (tableBorderFeatures.length > 0 && tableBorderFeatures.length === tableIconFeatures.length
                && tableBorderFeatures.length === tableIconBorderFeatures.length) {
                this.imageMap.addTableBorderFeatures(tableBorderFeatures);
                this.imageMap.addTableIconFeatures(tableIconFeatures);
                this.imageMap.addTableIconBorderFeatures(tableIconBorderFeatures);
            }

            if (textFeatures.length > 0) {
                this.imageMap.addFeatures(textFeatures);
            }
            if (checkboxFeatures.length > 0) {
                this.imageMap.addCheckboxFeatures(checkboxFeatures);
            }
        }
    }

    public getOcrResultForPage = (targetPage: number): any => {
        if (!this.ocr) {
            return {};
        }
        if (this.ocr.analyzeResult && this.ocr.analyzeResult.readResults) {
            // OCR schema with analyzeResult/readResults property
            const ocrResultsForCurrentPage = {};
            if (this.ocr.analyzeResult.pageResults) {
                ocrResultsForCurrentPage["pageResults"] = this.ocr.analyzeResult.pageResults[targetPage - 1];
            }
            ocrResultsForCurrentPage["readResults"] = this.ocr.analyzeResult.readResults[targetPage - 1];
            return ocrResultsForCurrentPage;
        }
        return {};
    }

    getTable(targetPage: number, hoveringFeature: string) {
        const pageOcrData = this.getOcrResultForPage(targetPage);
        return pageOcrData?.pageResults.tables[this.tableIDToIndexMap[hoveringFeature]];
    }

    private createBoundingBoxVectorFeature = (text, boundingBox, imageExtent, ocrExtent, page) => {
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

        const featureId = this.createRegionIdFromBoundingBox(polygonPoints, page);
        const feature = new Feature({
            geometry: new Polygon([coordinates]),
        });
        feature.setProperties({
            id: featureId,
            text,
            boundingbox: boundingBox,
            highlighted: false,
            isOcrProposal: true,
        });
        feature.setId(featureId);

        return feature;
    }

    private createRegionIdFromBoundingBox = (boundingBox: number[], page: number): string => {
        return boundingBox.join(",") + ":" + page;
    }


    private shouldDisplayOcrWord = (text: string): boolean => {
        const regex = new RegExp(/^[_]+$/);
        return !text.match(regex);
    }

    private addCheckboxToRegionOrder = (
        checkboxes: any[],
        pageIndex: number,
        order: number,
        imageExtent: number[],
        ocrExtent: any[]) => {
        checkboxes.forEach((checkbox) => {
            const checkboxFeature = this.createBoundingBoxVectorFeature(
                checkbox.state, checkbox.boundingBox, imageExtent, ocrExtent, pageIndex + 1);
            this.regionOrders[pageIndex][checkboxFeature.getId()] = order++;
            this.regionOrderById[pageIndex].push(checkboxFeature.getId());
        });
    }

    private getTableBoundingBox = (lines: []) => {
        const flattenedLines = [].concat(...lines);
        const xAxisValues = flattenedLines.filter((value, index) => index % 2 === 0);
        const yAxisValues = flattenedLines.filter((value, index) => index % 2 === 1);
        const left = Math.min(...xAxisValues);
        const top = Math.min(...yAxisValues);
        const right = Math.max(...xAxisValues);
        const bottom = Math.max(...yAxisValues);
        return ([left, top, right, top, right, bottom, left, bottom]);
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
        const tableID = this.createRegionIdFromBoundingBox(polygonPoints, page);
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
}
