// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import { ImageMap } from "../../common/imageMap/imageMap";

export interface ILayoutHelper {
    setImageMap(imageMap: ImageMap): void;
    setLayoutData(ocr: any): void;
    drawLayout(targetPage: number): void;
    reset(): void;
    getOcrResultForPage(targetPage: number): any;
}

export class LayoutHelper implements ILayoutHelper {
    private imageMap: ImageMap;
    private layoutData: any;
    private regionOrders: Record<string, number>[] = [];
    private regionOrderById: string[][] = [];

    setImageMap(imageMap: ImageMap) {
        this.imageMap = imageMap;
    }

    setLayoutData(data: any) {
        this.layoutData = data;
        this.buildRegionOrders();
    }

    reset() {
        this.layoutData = null;
        this.regionOrderById = [];
        this.regionOrders = [];
        this.imageMap?.removeAllFeatures();
    }

    private buildRegionOrders() {
        // Build order index here instead of building it during 'drawOcr' for two reasons.
        // 1. Build order index for all pages at once. This allow us to support cross page
        //    tagging if it's supported by FR service.
        // 2. Avoid rebuilding order index when users switch back and forth between pages.

        const imageExtent = this.imageMap.getImageExtent();
        this.layoutData.analyzeResult.pages.forEach((page) => {
            const { pageNumber, selectionMarks } = page;
            const pageIndex = pageNumber - 1;
            const ocrExtent = [0, 0, page.width, page.height];
            this.regionOrders[pageIndex] = {};
            this.regionOrderById[pageIndex] = [];
            let order = 0;
            page.words.forEach((word) => {
                const text = word.content || word.text;
                if (this.shouldDisplayOcrWord(text)) {
                    const feature = this.createBoundingBoxVectorFeature(
                        text, word.boundingBox, imageExtent, ocrExtent, pageNumber);
                    this.regionOrders[pageIndex][feature.getId()] = order++;
                    this.regionOrderById[pageIndex].push(feature.getId());
                }
            });
            if (selectionMarks) {
                this.addCheckboxToRegionOrder(selectionMarks, pageIndex, order, imageExtent, ocrExtent);
            }
        });

    }

    public drawLayout(targetPage: number) {
        this.imageMap.removeAllFeatures();
        const ocrForCurrentPage = this.getOcrResultForPage(targetPage);
        const textFeatures = [];
        const checkboxFeatures = [];
        const imageExtent = this.imageMap.getImageExtent();
        if (ocrForCurrentPage) {
            const { words, selectionMarks, pageNumber } = ocrForCurrentPage;
            const ocrExtent = [0, 0, ocrForCurrentPage.width, ocrForCurrentPage.height];
            words.forEach((word) => {
                const text = word.content || word.text;
                if (this.shouldDisplayOcrWord(text)) {
                    textFeatures.push(this.createBoundingBoxVectorFeature(
                        text, word.boundingBox, imageExtent, ocrExtent, pageNumber));
                }
            });

            if (selectionMarks) {
                selectionMarks.forEach((selectionMark) => {
                    checkboxFeatures.push(this.createBoundingBoxVectorFeature(
                        selectionMark.state, selectionMark.boundingBox, imageExtent, ocrExtent, pageNumber));
                });
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
        if (!this.layoutData) {
            return undefined;
        }
        if (this.layoutData.analyzeResult?.pages) {
            return this.layoutData.analyzeResult.pages.find(page => page.pageNumber === targetPage) || undefined;
        }
        return undefined;
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
}
