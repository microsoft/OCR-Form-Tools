// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { ReactElement } from "react";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { Label } from "@fluentui/react/lib/Label";
import { IconButton } from "@fluentui/react/lib/Button";
import {
    EditorMode, IAssetMetadata,
    IProject, IRegion, RegionType,
    AssetType, ILabelData, ILabel,
    ITag, IAsset, IFormRegion, FeatureCategory, FieldType, FieldFormat, ImageMapParent, LabelType,
} from "../../../../models/applicationState";
import CanvasHelpers from "./canvasHelpers";
import { AssetPreview } from "../../common/assetPreview/assetPreview";
import { ImageMap } from "../../common/imageMap/imageMap";
import "./canvas.scss";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Point from "ol/geom/Point";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { OCRService, OcrStatus } from "../../../../services/ocrService";
import { Feature } from "ol";
import { Extent } from "ol/extent";
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import _ from "lodash";
import Alert from "../../common/alert/alert";
import * as pdfjsLib from "pdfjs-dist";
import Polygon from "ol/geom/Polygon";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { parseTiffData, renderTiffToCanvas, loadImageToCanvas } from "../../../../common/utils";
import { constants } from "../../../../common/constants";
import { CanvasCommandBar } from "./canvasCommandBar";
import { TooltipHost, ITooltipHostStyles } from "@fluentui/react";
import { IAppSettings } from '../../../../models/applicationState';
import { AutoLabelingStatus, PredictService } from "../../../../services/predictService";
import { AssetService } from "../../../../services/assetService";
import { strings } from "../../../../common/strings";


pdfjsLib.GlobalWorkerOptions.workerSrc = constants.pdfjsWorkerSrc(pdfjsLib.version);
const cMapUrl = constants.pdfjsCMapUrl(pdfjsLib.version);

export interface ICanvasProps extends React.Props<Canvas> {
    appSettings: IAppSettings,
    selectedAsset: IAssetMetadata;
    editorMode: EditorMode;
    project: IProject;
    lockedTags: string[];
    hoveredLabel: ILabel;
    children?: ReactElement<AssetPreview>;
    setTableToView?: (tableToView: object, tableToViewId: string) => void;
    closeTableView?: (state: string) => void;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
    onSelectedRegionsChanged?: (regions: IRegion[]) => void;
    onCanvasRendered?: (canvas: HTMLCanvasElement) => void;
    onRunningOCRStatusChanged?: (isRunning: boolean) => void;
    onRunningAutoLabelingStatusChanged?: (isRunning: boolean) => void;
    onTagChanged?: (oldTag: ITag, newTag: ITag) => void;
    runOcrForAllDocs?: (runForAllDocs: boolean) => void;
    onAssetDeleted?: () => void;
}

export interface ICanvasState {
    currentAsset: IAssetMetadata;
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    numPages: number;
    currentPage: number;
    ocr: any;
    ocrForCurrentPage: any;
    pdfFile: any;
    tiffImages: any[];
    isError: boolean;
    errorTitle?: string;
    errorMessage: string;
    ocrStatus: OcrStatus;
    autoLableingStatus: AutoLabelingStatus;
    layers: any;
    tableIconTooltip: any;
    hoveringFeature: string;
    groupSelectMode: boolean;
    drawRegionMode: boolean;
    isSnapped: boolean;
    isVertexDragging: boolean;
    isDrawing: boolean;
    isPointerOnImage: boolean;
    imageAngle: number;
}

interface IRegionOrder {
    page: number;
    order: number;
}

function hexToRgba(color: string, a: number) {
    const hex = color.replace("#", "");
    let r = 255;
    let g = 255;
    let b = 255;
    if (hex.length === 3) {
        r = parseInt(hex.slice(0, 1).repeat(2), 16);
        g = parseInt(hex.slice(1, 2).repeat(2), 16);
        b = parseInt(hex.slice(2, 3).repeat(2), 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    public static defaultProps: ICanvasProps = {
        editorMode: EditorMode.Select,
        selectedAsset: null,
        project: null,
        lockedTags: [],
        hoveredLabel: null,
        appSettings: null,
    };

    public state: ICanvasState = {
        currentAsset: this.props.selectedAsset,
        imageUri: null,
        imageWidth: 1024,
        imageHeight: 768,
        numPages: 1,
        currentPage: 1,
        ocr: null,
        ocrForCurrentPage: {},
        pdfFile: null,
        tiffImages: [],
        isError: false,
        errorMessage: undefined,
        ocrStatus: OcrStatus.done,
        autoLableingStatus: AutoLabelingStatus.none,
        layers: { text: true, tables: true, checkboxes: true, label: true, drawnRegions: true },
        tableIconTooltip: { display: "none", width: 0, height: 0, top: 0, left: 0 },
        hoveringFeature: null,
        groupSelectMode: false,
        drawRegionMode: false,
        isSnapped: false,
        isVertexDragging: false,
        isDrawing: false,
        isPointerOnImage: false,
        imageAngle: 0,
    };

    private imageMap: ImageMap;

    private ocrService: OCRService;

    private selectedRegionIds: string[] = [];

    private regionOrders: Record<string, number>[] = [];

    private regionOrderById: string[][] = [];

    private lastKeyBoardRegionId: string;

    private applyTagFlag: boolean = false;

    private pendingFlag: boolean = false;

    private tableIDToIndexMap: object;

    public componentDidMount = async () => {
        this.ocrService = new OCRService(this.props.project);
        const asset = this.state.currentAsset.asset;
        await this.loadImage();
        await this.loadOcr();
        this.loadLabelData(asset);
    }

    public componentDidUpdate = async (prevProps: Readonly<ICanvasProps>, prevState: Readonly<ICanvasState>) => {
        // Handles asset changing
        if (this.props.selectedAsset.asset.name !== prevProps.selectedAsset.asset.name ||
            this.props.selectedAsset.asset.isRunningOCR !== prevProps.selectedAsset.asset.isRunningOCR) {
            this.selectedRegionIds = [];
            this.imageMap.removeAllFeatures();
            this.imageMap.resetAllLayerVisibility();
            this.setState({
                currentAsset: this.props.selectedAsset,
                ocr: null,
                ocrForCurrentPage: {},
                numPages: 1,
                currentPage: 1,
                pdfFile: null,
                imageUri: null,
                tiffImages: [],
                layers: { text: true, tables: true, checkboxes: true, label: true, drawnRegions: true },
            }, async () => {
                const asset = this.state.currentAsset.asset;
                await this.loadImage();
                await this.loadOcr();
                this.loadLabelData(asset);
            });
        } else if (this.isLabelDataChanged(this.props, prevProps)
            || (prevProps.project
                && this.needUpdateAssetRegionsFromTags(prevProps.project.tags, this.props.project.tags))) {
            const newRegions = this.convertLabelDataToRegions(this.props.selectedAsset.labelData);
            this.updateAssetRegions(newRegions);
            this.redrawAllFeatures();
        }

        if (this.props.hoveredLabel !== prevProps.hoveredLabel) {
            this.imageMap.getAllLabelFeatures().map(this.updateHighlightStatus);
            this.imageMap.getAllDrawnLabelFeatures().map(this.updateHighlightStatus);
        }
    }

    public render = () => {
        const hostStyles: Partial<ITooltipHostStyles> = {
            root: {
                position: "absolute",
                top: this.state.tableIconTooltip.top,
                left: this.state.tableIconTooltip.left,
                width: this.state.tableIconTooltip.width,
                height: this.state.tableIconTooltip.height,
                display: this.state.tableIconTooltip.display,
            },
        };
        return (
            <div style={{ width: "100%", height: "100%" }}>
                <KeyboardBinding
                    displayName={"Delete region"}
                    key={"Delete"}
                    keyEventType={KeyEventType.KeyDown}
                    accelerators={["Escape", "Alt+Backspace", "Shift", "Delete", "Backspace", "<", ",", ">", ".",
                        "{", "[", "}", "]", "+", "-", "/", "=", "_", "?"]}
                    handler={this.handleKeyDown}
                />
                <KeyboardBinding
                    displayName={"Label Key Mode"}
                    key={"Shift"}
                    keyEventType={KeyEventType.KeyUp}
                    accelerators={["Shift"]}
                    handler={this.handleKeyUp}
                />
                <CanvasCommandBar
                    handleLayerChange={this.handleLayerChange}
                    handleZoomIn={this.handleCanvasZoomIn}
                    handleZoomOut={this.handleCanvasZoomOut}
                    handleRotateImage={this.handleRotateCanvas}
                    layers={this.state.layers}
                    handleRunOcr={this.runOcr}
                    handleAssetDeleted={this.props.onAssetDeleted}
                    handleRunOcrForAllDocuments={this.runOcrForAllDocuments}
                    handleRunAutoLabelingOnCurrentDocument={this.runAutoLabelingOnCurrentDocument}
                    connectionType={this.props.project.sourceConnection.providerType}
                    handleToggleDrawRegionMode={this.handleToggleDrawRegionMode}
                    drawRegionMode={this.state.drawRegionMode}
                    project={this.props.project}
                    parentPage={strings.editorPage.title}
                />
                <ImageMap
                    parentPage={ImageMapParent.Editor}
                    ref={(ref) => this.imageMap = ref}
                    imageUri={this.state.imageUri}
                    imageWidth={this.state.imageWidth}
                    imageHeight={this.state.imageHeight}
                    enableFeatureSelection={!this.state.drawRegionMode && !this.state.groupSelectMode}
                    handleFeatureSelect={this.handleFeatureSelect}
                    featureStyler={this.featureStyler}
                    groupSelectMode={this.state.groupSelectMode}
                    handleIsPointerOnImage={this.handleIsPointerOnImage}
                    isPointerOnImage={this.state.isPointerOnImage}
                    drawRegionMode={this.state.drawRegionMode}
                    handleFeatureSelectByGroup={this.handleFeatureSelectByGroup}
                    handleRegionSelectByGroup={this.handleRegionSelectByGroup}
                    checkboxFeatureStyler={this.checkboxFeatureStyler}
                    labelFeatureStyler={this.labelFeatureStyler}
                    tableBorderFeatureStyler={this.tableBorderFeatureStyler}
                    tableIconFeatureStyler={this.tableIconFeatureStyler}
                    tableIconBorderFeatureStyler={this.tableIconBorderFeatureStyler}
                    drawRegionStyler={this.drawRegionStyler}
                    drawnRegionStyler={this.drawnRegionStyler}
                    modifyStyler={this.modifyStyler}
                    onMapReady={this.noOp}
                    handleTableToolTipChange={this.handleTableToolTipChange}
                    hoveringFeature={this.state.hoveringFeature}
                    addDrawnRegionFeatureProps={this.addDrawnRegionFeatureProps}
                    isSnapped={this.state.isSnapped}
                    handleIsSnapped={this.handleIsSnapped}
                    isVertexDragging={this.state.isVertexDragging}
                    handleVertexDrag={this.handleVertexDrag}
                    handleDrawing={this.handleDrawing}
                    isDrawing={this.state.isDrawing}
                    updateFeatureAfterModify={this.updateFeatureAfterModify}
                    imageAngle={this.state.imageAngle}
                />
                <TooltipHost
                    content={"rows: " + this.state.tableIconTooltip.rows +
                        " columns: " + this.state.tableIconTooltip.columns}
                    id="tableInfo"
                    styles={hostStyles}
                >
                    <div
                        aria-describedby="tableInfo"
                        className="tooltip-container"
                        onClick={this.handleTableIconFeatureSelect}
                    />
                </TooltipHost>
                {this.shouldShowPreviousPageButton() &&
                    <IconButton
                        className="toolbar-btn prev"
                        title="Previous"
                        iconProps={{ iconName: "ChevronLeft" }}
                        onClick={this.prevPage}
                    />
                }
                {this.shouldShowNextPageButton() &&
                    <IconButton
                        className="toolbar-btn next"
                        title="Next"
                        onClick={this.nextPage}
                        iconProps={{ iconName: "ChevronRight" }}
                    />
                }
                {this.shouldShowMultiPageIndicator() &&
                    <p className="page-number">
                        Page {this.state.currentPage} of {this.state.numPages}
                    </p>
                }
                {this.state.ocrStatus !== OcrStatus.done &&
                    <div className="canvas-ocr-loading">
                        <div className="canvas-ocr-loading-spinner">
                            <Label className="p-0" ></Label>
                            <Spinner size={SpinnerSize.large} label="Running OCR..." ariaLive="assertive" labelPosition="right" />
                        </div>
                    </div>
                }
                {this.state.autoLableingStatus === AutoLabelingStatus.running &&
                    <div className="canvas-ocr-loading">
                        <div className="canvas-ocr-loading-spinner">
                            <Label className="p-0" ></Label>
                            <Spinner size={SpinnerSize.large} label="Running Auto Labeling..." ariaLive="assertive" labelPosition="right" />
                        </div>
                    </div>
                }
                <Alert
                    show={this.state.isError}
                    title={this.state.errorTitle || "Error"}
                    message={this.state.errorMessage}
                    onClose={() => this.setState({
                        isError: false,
                        errorTitle: undefined,
                        errorMessage: undefined,
                    })}
                />
            </div>
        );
    }

    private runOcrForAllDocuments = () => {
        this.setState({ ocrStatus: OcrStatus.runningOCR })
        this.props.runOcrForAllDocs(true);
    }

    private runAutoLabelingOnCurrentDocument = async () => {
        try {
            this.setAutoLabelingStatus(AutoLabelingStatus.running);
            const asset = this.state.currentAsset.asset;
            const assetPath = asset.path;
            const predictService = new PredictService(this.props.project);
            const result = await predictService.getPrediction(assetPath);

            const assetService = new AssetService(this.props.project);
            await assetService.uploadAssetPredictResult(asset, result);
            const assetMetadata = await assetService.getAssetMetadata(asset);
            await this.props.onAssetMetadataChanged(assetMetadata);
        }
        finally {
            this.setAutoLabelingStatus(AutoLabelingStatus.done);
        }
    }

    public updateSize() {
        this.imageMap.updateSize();
    }

    public setTableState(viewedTableId, state) {
        this.imageMap.getTableBorderFeatureByID(viewedTableId).set("state", state);
        this.imageMap.getTableIconFeatureByID(viewedTableId).set("state", state);
    }

    /**
     * Toggles tag on all selected regions
     * @param selectedTag Tag name
     */
    public applyTag = (tag: string) => {
        const selectedRegions = this.getSelectedRegions();
        const regionsEmpty = !selectedRegions || !selectedRegions.length;
        if (!tag || regionsEmpty) {
            return;
        }

        if (this.showMultiPageFieldWarningIfNecessary(tag, selectedRegions)) {
            return;
        }

        const transformer: (tags: string[], tag: string) => string[] = CanvasHelpers.setSingleTag;
        const inputTag = this.props.project.tags.filter((t) => t.name === tag);

        for (const selectedRegion of selectedRegions) {
            selectedRegion.tags = transformer(selectedRegion.tags, tag);
        }

        this.updateRegions(selectedRegions);

        this.selectedRegionIds = [];
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged([]);
        }

        if (selectedRegions.length === 1 && selectedRegions[0].category === FeatureCategory.Checkbox) {
            this.setTagType(inputTag[0], FieldType.SelectionMark);
        } else if (selectedRegions[0].category === FeatureCategory.DrawnRegion) {
            selectedRegions.forEach((selectedRegion) => {
                this.imageMap.removeDrawnRegionFeature(this.imageMap.getDrawnRegionFeatureByID(selectedRegion.id));
            });
        }

        this.redrawAllFeatures();
        this.applyTagFlag = true;
    }

    private setTagType = (tag: ITag, fieldType: FieldType) => {
        if (tag.type === fieldType) {
            return;
        }

        const newTag = {
            ...tag,
            documentCount: 1,
            type: fieldType,
            format: FieldFormat.NotSpecified,
        } as ITag;
        this.props.onTagChanged(tag, newTag);
    }

    public getSelectedRegions = (): IRegion[] => {
        return this.state.currentAsset.regions.filter((r) => this.selectedRegionIds.find((id) => r.id === id));
    }

    private addRegions = (regions: IRegion[]) => {
        this.addRegionsToAsset(regions);
        this.addRegionsToImageMap(regions.filter((region) => region.pageNumber === this.state.currentPage));
    }

    private addRegionsToAsset = (regions: IRegion[]) => {

        const regionsToBeKept = this.state.currentAsset.regions.filter((assetRegion) => {
            return regions.findIndex((r) => r.id === assetRegion.id) === -1;
        });
        this.updateAssetRegions(regionsToBeKept.concat(regions));
    }

    private addRegionsToImageMap = (regions: IRegion[]) => {
        if (!this.imageMap) {
            return;
        }

        const textRegions = regions.filter((r) => r.category === FeatureCategory.Text);
        const checkboxRegions = regions.filter((r) => r.category === FeatureCategory.Checkbox);
        const drawnRegions = regions.filter((r) => r.category === FeatureCategory.DrawnRegion);
        const imageExtent = this.imageMap.getImageExtent();


        if (textRegions.length > 0) {
            const allTextFeatures = this.imageMap.getAllFeatures();
            const regionsNotInFeatures = textRegions.filter((region) =>
                allTextFeatures.findIndex((feature) => feature.get("id") === region.id) === -1);
            const featuresToAdd = regionsNotInFeatures.map((region) => this.convertRegionToFeature(region, imageExtent));
            this.imageMap.addFeatures(featuresToAdd);
        }

        if (checkboxRegions.length > 0) {
            const allCheckboxFeatures = this.imageMap.getAllCheckboxFeatures();
            const regionsNotInCheckboxFeatures = checkboxRegions.filter((region) =>
                allCheckboxFeatures.findIndex((feature) => feature.get("id") === region.id) === -1);
            const checkboxFeaturesToAdd = regionsNotInCheckboxFeatures.map((region) =>
                this.convertRegionToFeature(region, imageExtent));
            this.imageMap.addCheckboxFeatures(checkboxFeaturesToAdd);
        }

        if (drawnRegions.length > 0) {
            const allDrawnRegionFeatures = this.imageMap.getAllDrawnRegionFeatures();
            const regionsNotInDrawnRegionsFeatures = drawnRegions.filter((region) =>
                allDrawnRegionFeatures.findIndex((feature) => feature.get("id") === region.id) === -1);
            const drawnRegionFeaturesToAdd = regionsNotInDrawnRegionsFeatures.map((region) =>
                this.convertRegionToFeature(region, imageExtent));
            this.imageMap.addDrawnRegionFeatures(drawnRegionFeaturesToAdd);
        }

    }

    private convertRegionToFeature = (region: IRegion, imageExtent: Extent, isOcrProposal: boolean = false) => {
        const coordinates = [];
        const boundingBox = region.id.split(",").map(parseFloat);
        const imageWidth = imageExtent[2] - imageExtent[0];
        const imageHeight = imageExtent[3] - imageExtent[1];
        for (let i = 0; i < boundingBox.length; i += 2) {
            coordinates.push([
                Math.round(boundingBox[i] * imageWidth),
                Math.round((1 - boundingBox[i + 1]) * imageHeight),
            ]);
        }
        const feature = new Feature({
            geometry: new Polygon([coordinates]),
        });
        feature.setProperties({
            id: region.id,
            text: region.value,
            highlighted: false,
            isOcrProposal,
        });
        feature.setId(region.id);

        return feature;
    }

    private deleteRegions = (regions: IRegion[]) => {
        this.deleteRegionsFromSelectedRegionIds(regions);
        this.deleteRegionsFromAsset(regions);
        this.deleteRegionsFromImageMap(regions);
    }

    private deleteRegionsFromSelectedRegionIds = (regions: IRegion[]) => {
        regions.forEach((region) => {
            const regionIndex = this.getIndexOfSelectedRegionIndex(region.id);
            if (regionIndex >= 0) {
                this.selectedRegionIds.splice(regionIndex, 1);
            }
        });
    }

    private deleteRegionsFromAsset = (regions: IRegion[]) => {
        const filteredRegions = this.state.currentAsset.regions.filter((assetRegion) => {
            return regions.findIndex((r) => r.id === assetRegion.id) === -1;
        });
        this.updateAssetRegions(filteredRegions);
    }

    private deleteRegionsFromImageMap = (regions: IRegion[]) => {
        if (!this.imageMap) {
            return;
        }

        const textRegions = regions.filter((r) => r.category === FeatureCategory.Text);
        const checkboxRegions = regions.filter((r) => r.category === FeatureCategory.Checkbox);

        const allFeatures = this.imageMap.getAllFeatures();
        const selectedFeatures = allFeatures
            .filter((feature) => !feature.get("isOcrProposal"))
            .filter((feature) => textRegions.findIndex((region) => region.id === feature.get("id")) !== -1);
        selectedFeatures.forEach((feature) => {
            this.imageMap.removeFeature(feature);
        });

        const allCheckboxFeatures = this.imageMap.getAllCheckboxFeatures();
        const selectedCheckboxFeatures = allCheckboxFeatures
            .filter((feature) => !feature.get("isOcrProposal"))
            .filter((feature) => checkboxRegions.findIndex((region) => region.id === feature.get("id")) !== -1);
        selectedCheckboxFeatures.forEach((feature) => {
            this.imageMap.removeCheckboxFeature(feature);
        });

        const getAllLabelledFeatures = this.imageMap.getAllLabelFeatures();
        const selectedLabelledFeatures = getAllLabelledFeatures
            .filter((feature) => regions.findIndex((region) => region.id === feature.get("id")) !== -1);
        selectedLabelledFeatures.forEach((feature) => {
            this.imageMap.removeLabelFeature(feature);
        });

        const getAllDrawnLabelledFeatures = this.imageMap.getAllDrawnLabelFeatures();
        const selectedDrawnLabelledFeatures = getAllDrawnLabelledFeatures
            .filter((feature) => regions.findIndex((region) => region.id === feature.get("id")) !== -1);
        selectedDrawnLabelledFeatures.forEach((feature) => {
            this.imageMap.removeDrawnLabelFeature(feature);
        });

        this.redrawAllFeatures();
    }

    /**
     * Update regions within the current asset
     * @param regions
     * @param selectedRegions
     */
    private updateAssetRegions = (regions: IRegion[]) => {
        const labelData = this.convertRegionsToLabelData(regions, this.state.currentAsset.asset.name);
        const currentAsset: IAssetMetadata = {
            ...this.state.currentAsset,
            regions,
            labelData,
        };
        if (this.imageMap) {
            this.imageMap.removeAllLabelFeatures();
            this.imageMap.removeAllDrawnLabelFeatures();
            this.addLabelledDataToLayer(regions.filter(
                (region) => region.tags[0] !== undefined &&
                    region.pageNumber === this.state.currentPage));
        }
        this.setState({
            currentAsset,
        }, () => {
            this.props.onAssetMetadataChanged(currentAsset);
        });
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @returns {void}
     */
    private onRegionDelete = (id: string) => {
        // Remove from project
        const currentRegions = this.state.currentAsset.regions;
        const deletedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        currentRegions.splice(deletedRegionIndex, 1);

        this.updateAssetRegions(currentRegions);
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the selected region
     * @param {boolean} multiSelect boolean whether region was selected with multi selection
     * @returns {void}
     */
    private onRegionSelected = (id: string, multiSelect: boolean) => {
        const selectedRegions = this.getSelectedRegions();
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged(selectedRegions);
        }
    }

    /**
     * Updates regions in both Canvas Tools and the asset data store
     * @param updates Regions to be updated
     */
    private updateRegions = (updates: IRegion[]) => {
        const regions = this.state.currentAsset.regions;
        const updatedRegions = [].concat(regions);
        for (const update of updates) {
            const region = regions.find((r) => r.id === update.id);
            if (region) {
                // skip
            } else {
                updatedRegions.push(update);
            }
        }

        updatedRegions.sort(this.compareRegionOrder);
        this.updateAssetRegions(updatedRegions);
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

    private tableIconBorderFeatureStyler = (feature) => {
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

    private checkboxFeatureStyler = (feature) => {
        const regionId = feature.get("id");
        // Selected
        if (this.isRegionSelected(regionId)) {
            return new Style({
                stroke: new Stroke({
                    color: "#FFC0CB",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(255, 105, 180, 0.5)",
                }),
            });
        } else {
            // Unselected
            return new Style({
                stroke: new Stroke({
                    color: "#FFC0CB",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(255, 192, 203, 0.2)",
                }),
            });
        }
    }

    private drawnRegionStyler = (feature) => {
        const regionId = feature.get("id");
        // Selected
        if (this.isRegionSelected(regionId)) {
            return new Style({
                stroke: new Stroke({
                    color: "#a3f0ff",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(82, 226, 255, 0.4)",
                }),
            });
        } else {
            // Unselected
            return new Style({
                stroke: new Stroke({
                    color: "#a3f0ff",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(163, 240, 255, 0.2)",
                }),
            });
        }
    }

    private drawRegionStyler = () => {
        return new Style({
            image: null,
            stroke: new Stroke({
                color: "#a3f0ff",
                width: 1,
            }),
            fill: new Fill({
                color: "rgba(163, 240, 255, 0.2)",
            }),
        });
    }

    private modifyStyler = () => {
        if (this.imageMap.props.isSnapped) {
            return new Style({
                image: new Icon({
                    opacity: 0.6,
                    scale: this.imageMap.getResolutionForZoom(4),
                    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAABcCAYAAADj79JYAAAEjklEQVR4Xu2cu89NWRTAf5+MoJhiKFCLyDQzOg06NCrjOY9Cg3hEPCIalUZkkIlH0EwymBmPUWnQMc10MxrEHyAKFAqEIMu3T5y5Oefc/ThnfXvLOt397tp7rfXba6+99t7nuxPYo0pgQlWbKcOAKweBATfgygSU1VmEG3BlAsrqLMINuDIBZXUW4QZcmYCyOotwA65MQFmdRbgBVyagrM4i3IArE1BWZxFuwJUJKKsrMcLF5o2O05/Ae2VmSepKAy72bgBOO693AJdLgl4S8Drs2Q74M6Ao6KUAb4JdTe2ioJcAvAt2cdBzB96WRnY60qeAotJLzsDH5WxhXi2gxUDPFfg42FUp6CuXVMr12ThH4KEQQ+X75BfcV27AY+HFtgsGltogN+DTgO+BM8CXQEjJNwr9BbAd+B14lwqqr/a5ARe/xKZNwM/A3sCdZAX9OLAf+CO3XWiOwCvoc4EnEcDEp9i2fQVyaz+5Ah/c8alSYMCVyRtwA95KQCqYecACYKarPF4BD1w1U8S5uHaEi751gMDzPceeAawGdgPLWobjLvALcAN47RG0VTUj5eLViIXZQ0WziCbwep08HdjmUbYtBg474D5OCvBDwL8dwlXZeRZ4o32ergW8aSf4GFgP/N0CZzlwHljkQ7om8xDYAtxpabcUuALMn4pLDA3gMdvur4FfgSU1aJI2TjiQsgOVR04JZWD2jKSbf4DNwP0G6DH2BI55u/jQwGOc+wo453K9WC5b9KPAMeBliyuzgH3AAXckIGKSm7cCz3OCPiTwGNjCZg3wVw3SQQf77Zgw+8JBP1KT+w643tIu1r6kaB8KeKwzcmAlN/I/Oa+6orTJ8dHZccEtijJLmp5YO6OhDwE8xYlvgGvAQudRV4S2OV2fIY+AtcC9DkIp9gaD7xt4qvErgFvOi//cFZpUHSGPVDVS43/rGq0Ebo/pINVub/v6BN5ktExln3q7MvgH4KL7cBOQz0+9vZkUnANcAla5dj+6z+O6qdfnktrkCTmPH9f/x+/7BC67R3kF7WTtJv1zAL4LkFfqernE6BN4NYApN+mWUrzmyf+FUvKhLZoRwFMi3crCSOAp0OsLp/STsvHpWjBTZmI0lr5z+KghMU7Z1j56OCcbxkCXXP5brZaWfuzwKmAg7HjWwRo6pdTHpA7dLiACojVFVKDbFVsKQcW2Mljygo8cbNklsiL4olVp5vCiQfVlvAHvi6RnP7kCr/K1vczpOZApYtW5tL2unELRs+3oJUDIBcDo5ir0LN7TxDSx3FJK0yWGD/S244NeLw/SUH865+ijnz77CD17CZXv09bgvnKL8MoBX4i+csFghmqQK3CfU0aRSbnOG4ppZ785A++Cbv/6PWC4NKWNUXU+C+uAJvp3nXuEd+X06rtiYFdT1n94playuAWyCVcpEd4U6fK3on4NqLQIr0O3Hxmb2mxTjvbSUko5ZFssNeDKQ2jADbgyAWV1FuEGXJmAsjqLcAOuTEBZnUW4AVcmoKzOItyAKxNQVmcRbsCVCSirswg34MoElNVZhBtwZQLK6j4AgoeUbKT4onIAAAAASUVORK5CYII=",
                }),
            });
        } else {
            return new Style({
                image: null,
            });
        }
    }

    private featureStyler = (feature) => {
        const regionId = feature.get("id");
        // Selected
        if (this.isRegionSelected(regionId)) {
            return new Style({
                stroke: new Stroke({
                    color: "#6eff40",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(110, 255, 80, 0.4)",
                }),
            });
        } else {
            // Unselected
            return new Style({
                stroke: new Stroke({
                    color: "#fffc7f",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(255, 252, 127, 0.2)",
                }),
            });
        }
    }

    private labelFeatureStyler = (feature) => {
        const regionId = feature.get("id");
        const selectedRegion = this.state.currentAsset.regions.find((region) => region.id === regionId);
        const tag: ITag = this.getTagFromRegionId(regionId);
        // Selected
        if (this.isRegionSelected(regionId)) {
            let color;
            if (selectedRegion.category === FeatureCategory.DrawnRegion) {
                color = "rgba(82, 226, 255, 0.4)";
            } else if (tag.type === FieldType.SelectionMark) {
                color = "rgba(255, 105, 180, 0.5)";
            } else {
                color = "rgba(110, 255, 80, 0.4)";
            }
            return new Style({
                stroke: new Stroke({
                    color: tag.color,
                    width: feature.get("highlighted") ? 4 : 2,
                }),
                fill: new Fill({
                    color,
                }),
            });
        } else if (tag != null) {
            const highlighted = feature.get("highlighted");
            let color = "rgb(255, 255, 255, 0)";
            if (highlighted) {
                color = hexToRgba(tag.color, 0.3);
            }
            // Already tagged
            return new Style({
                stroke: new Stroke({
                    color: tag.color,
                    width: highlighted ? 4 : 2,
                }),
                fill: new Fill({
                    color,
                }),
            });
        }
    }

    private tableIconFeatureStyler = (feature, resolution) => {
        if (feature.get("state") === "rest") {
            return new Style({
                image: new Icon({
                    opacity: 0.3,
                    scale: this.imageMap && this.imageMap.getResolutionForZoom(3) ?
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

    private tableBorderFeatureStyler = (feature) => {
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

    private setFeatureProperty = (feature, propertyName, propertyValue, forced: boolean = false) => {
        if (forced || feature.get(propertyName) !== propertyValue) {
            feature.set(propertyName, propertyValue);
        }
    }

    private updateHighlightStatus = (feature: any): void => {
        if (this.props.hoveredLabel) {
            const label = this.props.hoveredLabel;
            const id = feature.get("id");
            if (label.value.find((region) =>
                id === this.createRegionIdFromBoundingBox(region.boundingBoxes[0], region.page))) {
                this.setFeatureProperty(feature, "highlighted", true);
            }
        } else if (feature.get("highlighted")) {
            this.setFeatureProperty(feature, "highlighted", false);
        }
    }

    private handleFeatureSelect = (feature: Feature, isToggle: boolean = true, category: FeatureCategory) => {
        const regionId = feature.get("id");
        if (isToggle && this.isRegionSelected(regionId)) {
            this.removeFromSelectedRegions(regionId);
            this.imageMap.setSwiping(false);
        } else {
            this.handleMultiSelection(regionId, category);
            const polygon = regionId.split(",").map(parseFloat);
            this.addToSelectedRegions(regionId, feature.get("text"), polygon, category);
        }
        this.redrawAllFeatures();
    }

    private handleMultiSelection = (regionId: any, category: FeatureCategory) => {
        const selectedRegions = this.getSelectedRegions();

        if (category === FeatureCategory.DrawnRegion ||
            (category === FeatureCategory.Label && this.state.currentAsset.regions
                .find((r) => r.id === regionId).category === FeatureCategory.DrawnRegion)) {
            selectedRegions.forEach((region) => {
                if (region?.category !== FeatureCategory.DrawnRegion) {
                    this.removeFromSelectedRegions(region.id)
                }
            });
        }
        else if (category === FeatureCategory.Checkbox ||
            (category === FeatureCategory.Label && this.state.currentAsset.regions
                .find((r) => r.id === regionId).category === FeatureCategory.Checkbox)) {
            selectedRegions.forEach((region) => this.removeFromSelectedRegions(region.id));
        } else if (category === FeatureCategory.Text ||
            (category === FeatureCategory.Label && this.state.currentAsset.regions
                .find((r) => r.id === regionId).category === FeatureCategory.Text)) {
            selectedRegions.filter((region) => region.category === FeatureCategory.Checkbox ||
                region.category === FeatureCategory.DrawnRegion)
                .forEach((region) => this.removeFromSelectedRegions(region.id));
        }
    }

    private handleTableIconFeatureSelect = () => {
        if (this.state.hoveringFeature != null) {
            const tableState = this.imageMap.getTableBorderFeatureByID(this.state.hoveringFeature).get("state");
            if (tableState === "hovering" || tableState === "rest") {
                this.props.setTableToView(this.state.ocrForCurrentPage.pageResults
                    .tables[this.tableIDToIndexMap[this.state.hoveringFeature]], this.state.hoveringFeature);
            } else {
                this.props.closeTableView("hovering");
            }
        }
    }

    private removeFromSelectedRegions = (regionId: string) => {
        const iRegionId = this.getIndexOfSelectedRegionIndex(regionId);
        if (iRegionId >= 0) {
            const region = this.getSelectedRegions().find((r) => r.id === regionId);
            if (region && region.tags && region.tags.length === 0) {
                this.onRegionDelete(regionId);
            }
            this.selectedRegionIds.splice(iRegionId, 1);
            if (this.props.onSelectedRegionsChanged) {
                this.props.onSelectedRegionsChanged(this.getSelectedRegions());
            }
        }
    }

    private addToSelectedRegions = (regionId: string,
        text: string,
        polygon: number[],
        regionCategory: FeatureCategory) => {
        let selectedRegion;
        if (this.isRegionSelected(regionId)) {
            // skip if it's already existed in selected regions
            return;
        } else if (this.getIndexOfCurrentRegions(regionId) !== -1) {
            selectedRegion = this.state.currentAsset.regions.find((region) => region.id === regionId);
            // Explicitly set pageNumber in order to fix incorrect page number
            selectedRegion.pageNumber = this.state.currentPage;

        } else if (regionCategory === FeatureCategory.Label) {
            if (this.selectedRegionIds.includes(regionId)) {
                return;
            }
        } else {
            const regionBoundingBox = this.convertToRegionBoundingBox(polygon);
            const regionPoints = this.convertToRegionPoints(polygon);
            selectedRegion = {
                id: regionId,
                type: RegionType.Polygon,
                category: regionCategory,
                tags: [],
                boundingBox: regionBoundingBox,
                points: regionPoints,
                value: text,
                pageNumber: this.state.currentPage,
            };
            this.addRegions([selectedRegion]);
        }

        this.selectedRegionIds.push(regionId);
        this.onRegionSelected(regionId, false);
    }

    private isRegionSelected = (regionId: string) => {
        return this.getIndexOfSelectedRegionIndex(regionId) !== -1;
    }

    private getIndexOfSelectedRegionIndex = (regionId: string) => {
        return this.selectedRegionIds.findIndex((id) => id === regionId);
    }

    private getIndexOfCurrentRegions = (regionId: string) => {
        return this.state.currentAsset.regions.findIndex((region) => region.id === regionId);
    }

    private getTagFromRegionId = (id: string): ITag => {
        const iRegion = this.getIndexOfCurrentRegions(id);
        if (iRegion >= 0) {
            const tagName = this.state.currentAsset.regions[iRegion].tags[0];
            return this.props.project.tags.find((tag) => tag.name === tagName);
        }
        return null;
    }

    private loadImage = async () => {
        const asset = this.state.currentAsset.asset;
        if (asset.type === AssetType.Image) {
            const canvas = await loadImageToCanvas(asset.path);
            this.setState({
                imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
                imageWidth: canvas.width,
                imageHeight: canvas.height,
            });
        } else if (asset.type === AssetType.TIFF) {
            await this.loadTiffFile(asset);
        } else if (asset.type === AssetType.PDF) {
            await this.loadPdfFile(asset.id, asset.path);
        }
    }

    private setOCRStatus = (ocrStatus: OcrStatus) => {
        this.setState({ ocrStatus }, () => {
            if (this.props.onRunningOCRStatusChanged) {
                this.props.onRunningOCRStatusChanged(ocrStatus === OcrStatus.runningOCR);
            }
        });
    }
    private setAutoLabelingStatus = (autoLableingStatus: AutoLabelingStatus) => {
        this.setState({ autoLableingStatus }, () => {
            if (this.props.onRunningAutoLabelingStatusChanged) {
                this.props.onRunningAutoLabelingStatusChanged(autoLableingStatus === AutoLabelingStatus.running);
            }
        })
    }

    private runOcr = () => {
        this.loadOcr(true);
    }

    private loadOcr = async (force?: boolean) => {
        const asset = this.state.currentAsset.asset;

        if (asset.isRunningOCR) {
            // Skip loading OCR this time since it's running. This will be triggered again once it's finished.
            return;
        }
        try {
            const ocr = await this.ocrService.getRecognizedText(asset.path, asset.name, this.setOCRStatus, force);
            if (asset.id === this.state.currentAsset.asset.id) {
                // since get OCR is async, we only set currentAsset's OCR
                this.setState({
                    ocr,
                    ocrForCurrentPage: this.getOcrResultForCurrentPage(ocr),
                }, () => {
                    if (asset.id === this.state.currentAsset.asset.id) {
                        this.buildRegionOrders();
                        this.drawOcr();
                    }
                });
            }
        } catch (error) {
            this.setState({
                isError: true,
                errorTitle: error.title,
                errorMessage: error.message,
            });
        }
    }

    private loadTiffFile = async (asset: IAsset) => {
        const assetArrayBuffer = await HtmlFileReader.getAssetArray(asset);
        const tiffImages = parseTiffData(assetArrayBuffer);
        this.loadTiffPage(tiffImages, this.state.currentPage);
    }

    private loadTiffPage = (tiffImages: any[], pageNumber: number) => {
        const tiffImage = tiffImages[pageNumber - 1];
        const canvas = renderTiffToCanvas(tiffImage);
        this.setState({
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: tiffImage.width,
            imageHeight: tiffImage.height,
            numPages: tiffImages.length,
            currentPage: pageNumber,
            tiffImages,
        });
    }

    private loadPdfFile = async (assetId, url) => {
        try {
            const pdf = await pdfjsLib.getDocument({ url, cMapUrl, cMapPacked: true }).promise;
            // Fetch current page
            if (assetId === this.state.currentAsset.asset.id) {
                await this.loadPdfPage(assetId, pdf, this.state.currentPage);
            }
        } catch (reason) {
            // PDF loading error
            console.error(reason);
        }
    }

    private loadPdfPage = async (assetId, pdf, pageNumber) => {
        const page = await pdf.getPage(pageNumber);
        const defaultScale = 2;
        const viewport = page.getViewport({ scale: defaultScale });

        // Prepare canvas using PDF page dimensions
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport,
        };

        await page.render(renderContext).promise;
        if (assetId === this.state.currentAsset.asset.id) {
            this.setState({
                imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
                imageWidth: canvas.width,
                imageHeight: canvas.height,
                numPages: pdf.numPages,
                currentPage: pageNumber,
                pdfFile: pdf,
            });
        }
    }

    private nextPage = async () => {
        if ((this.state.pdfFile !== null || this.state.tiffImages.length !== 0)
            && this.state.currentPage < this.state.numPages) {
            this.props.closeTableView("rest");
            await this.goToPage(this.state.currentPage + 1);
        }
    }

    private prevPage = async () => {
        if ((this.state.pdfFile !== null || this.state.tiffImages.length !== 0) && this.state.currentPage > 1) {
            this.props.closeTableView("rest");
            await this.goToPage(this.state.currentPage - 1);
        }
    }

    private goToPage = async (targetPage: number) => {
        if (targetPage < 1 || targetPage > this.state.numPages) {
            // invalid page number, just return
        }

        // clean up selected regions in current page
        const selectedRegions = this.getSelectedRegions();
        this.deleteRegionsFromSelectedRegionIds(selectedRegions);

        // remove regions without tag from asset
        const selectedRegionsWithoutTag = selectedRegions.filter((region) => region.tags.length === 0);
        this.deleteRegionsFromAsset(selectedRegionsWithoutTag);
        this.deleteRegionsFromImageMap(selectedRegionsWithoutTag);

        // switch image
        await this.switchToTargetPage(targetPage);

        // switch OCR
        this.setState({
            ocrForCurrentPage: this.getOcrResultForCurrentPage(this.state.ocr),
        }, () => {
            this.imageMap.removeAllFeatures();
            this.drawOcr();
            this.loadLabelData(this.state.currentAsset.asset);
        });
    }

    private convertLabelDataToRegions = (labelData: ILabelData): IRegion[] => {
        const regions = [];

        if (labelData && labelData.labels) {
            labelData.labels.forEach((label) => {
                if (label.value) {
                    label.value.forEach((formRegion) => {
                        if (formRegion.boundingBoxes) {
                            formRegion.boundingBoxes.forEach((boundingBox, boundingBoxIndex) => {
                                const text = this.getBoundingBoxTextFromRegion(formRegion, boundingBoxIndex);
                                regions.push(this.createRegion(boundingBox, text, label.label, formRegion.page, label?.labelType));
                            });
                        }
                    });
                }
            });
        }

        return regions;
    }

    private convertRegionsToLabelData = (regions: IRegion[], assetName: string) => {
        const labelData: ILabelData = {
            document: decodeURIComponent(assetName).split("/").pop(),
            labels: [],
        };

        regions.forEach((region) => {
            const labelType = this.getLabelType(region.category);
            const boundingBox = region.id.split(",").map(parseFloat);
            const formRegion = {
                page: region.pageNumber,
                text: region.value,
                boundingBoxes: [boundingBox],
            } as IFormRegion;
            region.tags.forEach((tag) => {
                const label = labelData.labels.find((label) => { return label.label === tag });
                if (label) {
                    label.value.push(formRegion);
                } else {
                    let newLabel;
                    if (labelType) {
                        newLabel = {
                            label: tag,
                            key: null,
                            labelType,
                            value: [formRegion],
                        } as ILabel;
                    } else {
                        newLabel = {
                            label: tag,
                            key: null,
                            value: [formRegion],
                        } as ILabel;
                    }
                    labelData.labels.push(newLabel);
                }
            });
        });
        return labelData;
    }

    private getLabelType = (regionCategory: string) => {
        switch (regionCategory) {
            case FeatureCategory.DrawnRegion:
                return LabelType.DrawnRegion;
            default:
                return null;
        }
    }

    private convertToRegionBoundingBox = (polygon: number[]) => {
        const xAxisValues = polygon.filter((value, index) => index % 2 === 0);
        const yAxisValues = polygon.filter((value, index) => index % 2 === 1);
        const left = Math.min(...xAxisValues);
        const top = Math.min(...yAxisValues);
        const right = Math.max(...xAxisValues);
        const bottom = Math.max(...yAxisValues);

        return {
            height: bottom - top,
            width: right - left,
            left,
            top,
        };
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

    private convertToRegionPoints = (polygon: number[]) => {
        const points = [];
        for (let i = 0; i < polygon.length; i += 2) {
            points.push({ x: polygon[i], y: polygon[i + 1] });
        }
        return points;
    }

    private handleKeyDown = (keyEvent) => {
        if (!this.imageMap) {
            return;
        }

        switch (keyEvent.key) {
            case "Escape":
                if (this.state.isDrawing) {
                    this.imageMap.cancelDrawing();
                } else if (this.state.isVertexDragging) {
                    this.imageMap.cancelModify();
                }
                break;
            case "Shift":
                this.setState({
                    groupSelectMode: true,
                });
                break;
            case "Delete":
            case "Backspace":
                if (this.state.isDrawing) {
                    this.imageMap.cancelDrawing();
                } else if (this.state.isVertexDragging) {
                    this.imageMap.cancelModify();
                } else if (keyEvent.altKey) {
                    const allDrawnRegionFeatures = this.imageMap.getAllDrawnRegionFeatures();
                    const selectedDrawnRegions = this.getSelectedRegions().filter((selectedRegion) => {
                        return selectedRegion.category === FeatureCategory.DrawnRegion
                    })
                    allDrawnRegionFeatures?.forEach((drawnRegionFeature) => {
                        const selectedDrawnRegionFeature = selectedDrawnRegions?.find((selectedDrawnRegion) => {
                            return selectedDrawnRegion.id === drawnRegionFeature.get("id");
                        });
                        if (selectedDrawnRegionFeature) {
                            this.imageMap?.removeDrawnRegionFeature(drawnRegionFeature)
                            this.onRegionDelete(selectedDrawnRegionFeature.id);
                        }
                    })
                } else {
                    this.deleteRegions(this.getSelectedRegions());
                }
                break;

            case "<":
            case ",":
                this.prevPage();
                break;

            case ">":
            case ".":
                this.nextPage();
                break;

            case "}":
            case "]":
                if (!this.pendingFlag) {
                    this.pendingFlag = true;
                    setTimeout(() => {
                        this.getRegionWithKey(true);
                        this.pendingFlag = false;
                    }, 1);
                }
                break;

            case "{":
            case "[":
                if (!this.pendingFlag) {
                    this.pendingFlag = true;
                    setTimeout(() => {
                        this.getRegionWithKey(false);
                        this.pendingFlag = false;
                    }, 1);
                }
                break;

            case "+":
            case "=":
                this.handleCanvasZoomIn();
                break;

            case "-":
            case "_":
                this.handleCanvasZoomOut();
                break;

            case "/":
            case "?":
                this.handleZoomReset();
                break;

            default:
                break;
        }
    }

    private handleKeyUp = (keyEvent) => {
        switch (keyEvent.key) {
            case "Shift":
                this.setState({
                    groupSelectMode: false,
                });
        }
    }


    private handleCanvasZoomIn = () => {
        this.imageMap.zoomIn();
    }

    private handleCanvasZoomOut = () => {
        this.imageMap.zoomOut();
    }

    private handleZoomReset = () => {
        this.imageMap.resetZoom();
    }
    private handleRotateCanvas = (degrees: number) => {
        this.setState({ imageAngle: this.state.imageAngle + degrees });
    }

    private getRegionWithKey = (keyFlag: boolean) => {
        let lastSelectedId;
        const selectedRegion = this.getSelectedRegions();
        const currentPage = this.state.currentPage;
        let nextRegionId;
        if (!selectedRegion.length && !this.applyTagFlag) {
            nextRegionId = this.regionOrderById?.[this.state.currentPage - 1]?.[0];
        } else if (!this.applyTagFlag) {
            lastSelectedId = selectedRegion.find((r) =>
                r.id === this.selectedRegionIds[this.selectedRegionIds.length - 1]).id;
            this.deleteRegionsFromSelectedRegionIds(selectedRegion);
            const removeList = this.state.currentAsset.regions.filter((r) => r.tags.length === 0);
            this.deleteRegionsFromAsset(removeList);
            if (keyFlag) {
                nextRegionId = this.getNextIdByOrder(lastSelectedId, currentPage);
            } else if (!keyFlag) {
                nextRegionId = this.getPrevIdByOrder(lastSelectedId, currentPage);
            }
        } else if (this.applyTagFlag) {
            lastSelectedId = this.lastKeyBoardRegionId;
            if (keyFlag) {
                nextRegionId = this.getNextIdByOrder(lastSelectedId, currentPage);
            } else if (!keyFlag) {
                nextRegionId = this.getPrevIdByOrder(lastSelectedId, currentPage);
            }
            this.applyTagFlag = false;
        }

        if (!nextRegionId || !this.imageMap) {
            return;
        }

        const allFeatures = this.imageMap?.getAllFeatures();
        const nextFeature = allFeatures.find((f) => f.get("id") === (nextRegionId));
        if (nextFeature) {
            const polygon = nextRegionId.split(",").map(parseFloat);
            this.addToSelectedRegions(nextRegionId, nextFeature.get("text"), polygon, FeatureCategory.Text);
            this.redrawFeatures(allFeatures);
        }

        const allCheckboxFeature = this.imageMap.getAllCheckboxFeatures();
        const nextCheckboxFeature = allCheckboxFeature.find((f) => f.get("id") === (nextRegionId));
        if (nextCheckboxFeature) {
            const polygon = nextRegionId.split(",").map(parseFloat);
            this.addToSelectedRegions(nextRegionId, nextCheckboxFeature.get("text"), polygon, FeatureCategory.Checkbox);
            this.redrawFeatures(allCheckboxFeature);
        }
        this.lastKeyBoardRegionId = nextRegionId;
    }

    private getOcrResultForCurrentPage = (ocr: any): any => {
        if (!ocr || !this.state.imageUri) {
            return {};
        }

        if (ocr.analyzeResult && ocr.analyzeResult.readResults) {
            // OCR schema with analyzeResult/readResults property
            const ocrResultsForCurrentPage = {};
            if (ocr.analyzeResult.pageResults) {
                ocrResultsForCurrentPage["pageResults"] = ocr.analyzeResult.pageResults[this.state.currentPage - 1];
            }
            ocrResultsForCurrentPage["readResults"] = ocr.analyzeResult.readResults[this.state.currentPage - 1];
            return ocrResultsForCurrentPage;
        }

        return {};
    }

    private isLabelDataChanged = (newProps: ICanvasProps, prevProps: ICanvasProps): boolean => {
        const newLabels = _.get(newProps, "selectedAsset.labelData.labels", []) as ILabel[];
        const prevLabels = _.get(prevProps, "selectedAsset.labelData.labels", []) as ILabel[];

        if (newLabels.length !== prevLabels.length) {
            return true;
        } else if (newLabels.length > 0) {
            const newFieldNames = newLabels.map((label) => label.label);
            const prevFieldNames = prevLabels.map((label) => label.label);
            return !_.isEqual(newFieldNames.sort(), prevFieldNames.sort());
        }

        return false;
    }

    private getBoundingBoxTextFromRegion = (formRegion: IFormRegion, boundingBoxIndex: number) => {
        // get value from formRegion.text
        const regionValues = formRegion.text && formRegion.text.split(" ");
        if (regionValues && regionValues.length > boundingBoxIndex) {
            return regionValues[boundingBoxIndex];
        }

        // cannot find any, return empty string.
        return "";
    }

    private loadLabelData = (asset: IAsset) => {
        if (asset.id === this.state.currentAsset.asset.id &&
            this.state.currentAsset.labelData != null) {
            const regionsFromLabelData = this.convertLabelDataToRegions(this.state.currentAsset.labelData);
            if (regionsFromLabelData.length > 0) {
                this.addRegionsToAsset(regionsFromLabelData);
            }
        }
    }

    private addLabelledDataToLayer = (regions: IRegion[]) => {
        if (!this.imageMap) {
            return;
        }

        const imageExtent = this.imageMap.getImageExtent();
        const labelRegions: IRegion[] = [];
        const drawnLabelRegions: IRegion[] = [];
        regions.forEach((region) => {
            if (region.category === FeatureCategory.DrawnRegion) {
                drawnLabelRegions.push(region);
            } else {
                labelRegions.push(region);
            }
        });
        const labelFeaturesToAdd = labelRegions.map((region) => this.convertRegionToFeature(region, imageExtent));
        const drawnLabelFeaturesToAdd = drawnLabelRegions.map((region) => this.convertRegionToFeature(region, imageExtent));
        this.imageMap.addLabelFeatures(labelFeaturesToAdd);
        this.imageMap.addDrawnLabelFeatures(drawnLabelFeaturesToAdd);

    }

    private showMultiPageFieldWarningIfNecessary = (tagName: string, regions: IRegion[]): boolean => {
        const existedRegionsWithSameTag = this.state.currentAsset.regions.filter(
            (region) => _.get(region, "tags[0]", "") === tagName);
        const regionsWithSameTag = existedRegionsWithSameTag.concat(regions);
        const pageCount = (new Set(regionsWithSameTag.map((region) => region.pageNumber))).size;
        if (pageCount > 1) {
            this.setState({
                isError: true,
                errorMessage: `Sorry, we don't support cross-page regions with the same tag.` +
                    ` You have regions with tag "${tagName}" across ${pageCount} pages.`,
            });
            return true;
        }

        return false;
    }

    private noOp = () => {
        // no operation
    }

    private getRegionOrder = (regionId): IRegionOrder => {
        let orderInfo: IRegionOrder = { page: 1, order: 0 };
        this.regionOrders.some((regions, pageNumber) => {
            const order = regions[regionId];
            if (order !== undefined) {
                orderInfo = { page: pageNumber + 1, order };
                return true;
            }
            return false;
        });

        return orderInfo;
    }

    private getNextIdByOrder = (id: string, currentPage: number, index?) => {
        const currentIdList = this.regionOrderById[currentPage - 1];
        const currentIndex = currentIdList.indexOf(id);
        let nextIndex;
        if (currentIndex === currentIdList.length - 1) {
            nextIndex = 0;
        } else {
            nextIndex = currentIndex + 1;
        }
        return currentIdList[nextIndex];
    }

    private getPrevIdByOrder = (id: string, currentPage: number) => {
        const currentIdList = this.regionOrderById[currentPage - 1];
        const currentIndex = currentIdList.indexOf(id);
        let prevIndex;
        if (currentIndex === 0) {
            prevIndex = currentIdList.length - 1;
        } else {
            prevIndex = currentIndex - 1;
        }
        return currentIdList[prevIndex];
    }

    private compareRegionOrder = (r1, r2) => {
        const order1 = this.getRegionOrder(r1.id);
        const order2 = this.getRegionOrder(r2.id);

        if (order1.page === order2.page) {
            return order1.order > order2.order ? 1 : -1;
        } else if (order1.page > order2.page) {
            return 1;
        } else {
            return -1;
        }
    }

    private buildRegionOrders = () => {
        // Build order index here instead of building it during 'drawOcr' for two reasons.
        // 1. Build order index for all pages at once. This allow us to support cross page
        //    tagging if it's supported by FR service.
        // 2. Avoid rebuilding order index when users switch back and forth between pages.
        const ocrs = this.state.ocr;
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

    private addCheckboxToRegionOrder = (
        checkboxes: any[],
        pageIndex: number,
        order: number,
        imageExtent: number[],
        ocrExtent: any[]) => {
        checkboxes.forEach((checkbox) => {
            const checkboxFeature = this.createBoundingBoxVectorFeature(
                checkbox.state, checkbox.boundingBox, imageExtent, ocrExtent, this.state.currentPage);
            this.regionOrders[pageIndex][checkboxFeature.getId()] = order++;
            this.regionOrderById[pageIndex].push(checkboxFeature.getId());
        });
    }

    private drawOcr = () => {
        const textFeatures = [];
        const tableBorderFeatures = [];
        const tableIconFeatures = [];
        const tableIconBorderFeatures = [];
        const checkboxFeatures = [];
        const ocrReadResults = this.state.ocrForCurrentPage["readResults"];
        const ocrPageResults = this.state.ocrForCurrentPage["pageResults"];
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

    private shouldDisplayOcrWord = (text: string) => {
        const regex = new RegExp(/^[_]+$/);
        return !text.match(regex);
    }

    private redrawFeatures = (features: Feature[]) => {
        features.forEach((feature) => feature.changed());
    }

    private createRegion(boundingBox: number[], text: string, tagName: string, pageNumber: number, labelType: string) {
        const xAxisValues = boundingBox.filter((value, index) => index % 2 === 0);
        const yAxisValues = boundingBox.filter((value, index) => index % 2 === 1);
        const left = Math.min(...xAxisValues);
        const top = Math.min(...yAxisValues);
        const right = Math.max(...xAxisValues);
        const bottom = Math.max(...yAxisValues);

        const points = [];
        for (let i = 0; i < boundingBox.length; i += 2) {
            points.push({
                x: boundingBox[i],
                y: boundingBox[i + 1],
            });
        }
        const tag: ITag = this.props.project.tags.find((tag) => tag.name === tagName);

        let regionCategory: string;
        if (labelType) {
            regionCategory = labelType;
        } else if (tag && tag.type === FieldType.SelectionMark) {
            regionCategory = FeatureCategory.Checkbox;
        } else {
            regionCategory = FeatureCategory.Text;
        }

        const newRegion = {
            id: this.createRegionIdFromBoundingBox(boundingBox, pageNumber),
            type: RegionType.Polygon,
            category: regionCategory,
            tags: [tagName],
            boundingBox: {
                height: bottom - top,
                width: right - left,
                left,
                top,
            },
            points,
            value: text,
            pageNumber,
        };
        return newRegion;
    }

    private switchToTargetPage = async (targetPage: number) => {
        if (this.state.pdfFile !== null) {
            await this.loadPdfPage(this.state.currentAsset.asset.id, this.state.pdfFile, targetPage);
        } else if (this.state.tiffImages.length !== 0) {
            this.loadTiffPage(this.state.tiffImages, targetPage);
        }
    }

    private shouldShowPreviousPageButton = () => {
        return (this.state.pdfFile !== null || this.state.tiffImages.length !== 0) && this.state.currentPage !== 1;
    }

    private shouldShowNextPageButton = () => {
        return (this.state.pdfFile !== null || this.state.tiffImages.length !== 0)
            && this.state.currentPage !== this.state.numPages;
    }

    private shouldShowMultiPageIndicator = () => {
        return (this.state.pdfFile !== null || this.state.tiffImages.length !== 0) && this.state.numPages > 1;
    }

    private createRegionIdFromBoundingBox = (boundingBox: number[], page: number): string => {
        return boundingBox.join(",") + ":" + page;
    }

    private handleLayerChange = async (layer: string) => {
        switch (layer) {
            case "text":
                this.imageMap.toggleTextFeatureVisibility();
                break;
            case "tables":
                this.imageMap.toggleTableFeatureVisibility();
                break;
            case "checkboxes":
                this.imageMap.toggleCheckboxFeatureVisibility();
                break;
            case "label":
                this.imageMap.toggleLabelFeatureVisibility();
                break;
            case "drawnRegions":
                this.imageMap.toggleDrawnRegionsFeatureVisibility();
                break;
        }
        const newLayers = Object.assign({}, this.state.layers);
        newLayers[layer] = !newLayers[layer];
        this.setState({
            layers: newLayers,
        });
    }

    private handleTableToolTipChange = async (display: string, width: number, height: number, top: number,
        left: number, rows: number, columns: number, featureID: string) => {
        if (!this.imageMap) {
            return;
        }

        if (featureID !== null && this.imageMap.getTableBorderFeatureByID(featureID).get("state") !== "selected") {
            this.imageMap.getTableBorderFeatureByID(featureID).set("state", "hovering");
            this.imageMap.getTableIconFeatureByID(featureID).set("state", "hovering");
        } else if (featureID === null && this.state.hoveringFeature &&
            this.imageMap.getTableBorderFeatureByID(this.state.hoveringFeature).get("state") !== "selected") {
            this.imageMap.getTableBorderFeatureByID(this.state.hoveringFeature).set("state", "rest");
            this.imageMap.getTableIconFeatureByID(this.state.hoveringFeature).set("state", "rest");
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

    private redrawAllFeatures = () => {
        if (!this.imageMap) {
            return;
        }

        this.redrawFeatures(this.imageMap.getAllFeatures());
        this.redrawFeatures(this.imageMap.getAllCheckboxFeatures());
        this.redrawFeatures(this.imageMap.getAllLabelFeatures());
        this.redrawFeatures(this.imageMap.getAllDrawnRegionFeatures());
        this.redrawFeatures(this.imageMap.getAllDrawnLabelFeatures());
    }

    private needUpdateAssetRegionsFromTags = (prevTags: ITag[], tags: ITag[]) => {
        // nothing change
        if (prevTags === tags) {
            return false;
        }

        // add/delete tag
        if (prevTags.length !== tags.length) {
            return false;
        }

        const prevNames = prevTags.map((tag) => tag.name).sort();
        const names = tags.map((tag) => tag.name).sort();

        // rename
        if (JSON.stringify(prevNames) !== JSON.stringify(names)) {
            return false;
        }

        const prevTypes = {};
        prevTags.forEach((tag) => prevTypes[tag.name] = tag.type);

        const types = {};
        tags.forEach((tag) => types[tag.name] = tag.type);

        for (const name of names) {
            const prevType = prevTypes[name];
            const type = types[name];
            if (prevType !== type
                && (prevType === FieldType.SelectionMark || type === FieldType.SelectionMark)) {
                // some tag change between checkbox and text
                return true;
            }
        }

        return false;
    }
    private handleRegionSelectByGroup = (selectedRegions: IRegion[]) => {
        if (selectedRegions.length === 0) {
            return;
        }

        const existingSelectedRegions = this.getSelectedRegions();
        existingSelectedRegions.filter((region) => region.category === FeatureCategory.Checkbox)
            .forEach((region) => this.removeFromSelectedRegions(region.id));
        this.addRegionsToAsset(selectedRegions);
        this.addRegionsToImageMap(selectedRegions);
        this.selectedRegionIds = this.selectedRegionIds.concat(selectedRegions.map((region) => region.id));
        const selectedRegionsToAdd = this.getSelectedRegions();
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged(selectedRegionsToAdd);
        }
    }

    private handleFeatureSelectByGroup = (feature: Feature): IRegion => {
        const regionId = feature.get("id");
        const polygon = regionId.split(",").map(parseFloat);

        let selectedRegion: IRegion;
        if (this.isRegionSelected(regionId)) {
            // return null if it's already in the group
            return null;
        } else if (this.getIndexOfCurrentRegions(regionId) !== -1) {
            selectedRegion = this.state.currentAsset.regions.find((region) => region.id === regionId);
            // Explicitly set pageNumber in order to fix incorrect page number
            selectedRegion.pageNumber = this.state.currentPage;

            if (selectedRegion.category === FeatureCategory.Checkbox) {
                return null;
            }
        } else {
            const regionBoundingBox = this.convertToRegionBoundingBox(polygon);
            const regionPoints = this.convertToRegionPoints(polygon);
            selectedRegion = {
                id: regionId,
                type: RegionType.Polygon,
                category: FeatureCategory.Text,
                tags: [],
                boundingBox: regionBoundingBox,
                points: regionPoints,
                value: feature.get("text"),
                pageNumber: this.state.currentPage,
            };
        }
        return selectedRegion
    }

    private handleToggleDrawRegionMode = () => {
        this.setState({
            drawRegionMode: !this.state.drawRegionMode
        });
    }

    private addDrawnRegionFeatureProps = (feature) => {
        const featureCoordinates = feature.getGeometry().getCoordinates()[0];
        const { featureId, boundingBox } = this.getFeatureIDAndBoundingBox(featureCoordinates);
        feature.setProperties({
            id: featureId,
            text: "",
            boundingbox: boundingBox,
            highlighted: false,
            isOcrProposal: false,
        });
        feature.setId(featureId);
        this.imageMap.addDrawnRegionFeatures([feature]);

        this.handleFeatureSelect(feature, false, FeatureCategory.DrawnRegion);
    }

    private handleIsSnapped = (snapped: boolean) => {
        if (this.state.isSnapped !== snapped) {
            this.setState({
                isSnapped: snapped,
            })
        }
    }

    private handleVertexDrag = (dragging: boolean) => {
        if (this.state.isVertexDragging !== dragging) {
            this.setState({
                isVertexDragging: dragging,
            })
        }
    }

    private handleDrawing = (drawing: boolean) => {
        if (this.state.isDrawing !== drawing) {
            this.setState({
                isDrawing: drawing,
            })
        }
    }

    private handleIsPointerOnImage = (isPointerOnImage: boolean) => {
        if (this.state.isPointerOnImage !== isPointerOnImage) {
            this.setState({
                isPointerOnImage,
            });
        }
    }

    private getFeatureIDAndBoundingBox = (featureCoordinates) => {
        const imageExtent = this.imageMap.getImageExtent();
        const ocrExtent = [0, 0, this.state.ocrForCurrentPage.readResults.width, this.state.ocrForCurrentPage.readResults.height];
        const ocrPage = this.state.currentPage;
        const imageWidth = imageExtent[2] - imageExtent[0];
        const imageHeight = imageExtent[3] - imageExtent[1];
        const ocrWidth = ocrExtent[2] - ocrExtent[0];
        const ocrHeight = ocrExtent[3] - ocrExtent[1];
        const boundingBox = [];
        featureCoordinates.forEach((coordinate, index) => {
            boundingBox.push(coordinate[0] / imageWidth * ocrWidth);
            boundingBox.push(((1 - (coordinate[1] / imageHeight)) * ocrHeight));
        });
        const polygonPoints: number[] = [];
        for (let i = 0; i < boundingBox.length; i += 2) {
            polygonPoints.push(boundingBox[i] / ocrWidth);
            polygonPoints.push(boundingBox[i + 1] / ocrHeight);
        }
        const featureId = this.createRegionIdFromBoundingBox(polygonPoints, ocrPage);
        return { featureId, boundingBox }
    }

    private modifySelectedRegion = (existingRegionId, newRegionId) => {
        const selectedRegionIndex = this.getIndexOfSelectedRegionIndex(existingRegionId);
        if (selectedRegionIndex !== -1) {
            this.selectedRegionIds[selectedRegionIndex] = newRegionId;
        }
    }

    private modifyAssetRegion = (existingRegionId, newRegionId) => {
        const regionsAfterModify = this.state.currentAsset.regions.map((assetRegion) => {
            if (existingRegionId === assetRegion.id) {
                return {
                    ...assetRegion,
                    id: newRegionId,
                    boundingBox: this.convertToRegionBoundingBox(newRegionId.split(",").map(parseFloat)),
                    points: this.convertToRegionPoints(newRegionId.split(",").map(parseFloat))
                } as IRegion;
            } else {
                return assetRegion;
            }
        });
        this.updateAssetRegions(regionsAfterModify);
    }

    private updateFeatureAfterModify = (features) => {
        features.forEach((feature) => {
            const originalFeatureId = feature.getId();
            const featureCoordinates = feature.getGeometry().getCoordinates()[0];
            if (this.imageMap.modifyStartFeatureCoordinates[originalFeatureId] !== featureCoordinates.join(",")) {
                const { featureId, boundingBox } = this.getFeatureIDAndBoundingBox(featureCoordinates);
                feature.setProperties({
                    id: featureId,
                    boundingbox: boundingBox,
                });
                feature.setId(featureId);
                this.modifySelectedRegion(originalFeatureId, featureId);
                this.modifyAssetRegion(originalFeatureId, featureId);
            }
        });
        this.imageMap.modifyStartFeatureCoordinates = {};
    }
}
