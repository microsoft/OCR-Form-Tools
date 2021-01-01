// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {Feature, MapBrowserEvent, View} from "ol";
import {Extent, getCenter} from "ol/extent";
import {defaults as defaultInteractions, DragPan, Interaction, DragBox, Snap} from "ol/interaction.js";
import PointerInteraction from 'ol/interaction/Pointer';
import Draw from "ol/interaction/Draw.js";
import Style from "ol/style/Style";
import Collection from 'ol/Collection';
import {shiftKeyOnly, never} from 'ol/events/condition';
import {Modify} from "ol/interaction";
import Polygon from "ol/geom/Polygon";
import ImageLayer from "ol/layer/Image";
import Layer from "ol/layer/Layer";
import VectorLayer from "ol/layer/Vector";
import Map from "ol/Map";
import Projection from "ol/proj/Projection";
import Static from "ol/source/ImageStatic.js";
import VectorSource from "ol/source/Vector";
import * as React from "react";
import "./styles.css";
import Utils from "./utils";
import {FeatureCategory, IRegion} from "../../../../models/applicationState";

interface IImageMapProps {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    imageAngle?: number;

    featureStyler?: (feature) => Style;
    tableBorderFeatureStyler?: (feature) => Style;
    tableIconFeatureStyler?: (feature, resolution) => Style;
    tableIconBorderFeatureStyler?: (feature) => Style;
    checkboxFeatureStyler?: (feature) => Style;
    labelFeatureStyler?: (feature) => Style;
    drawRegionStyler?: () => Style;
    drawnRegionStyler?: (feature) => Style;
    modifyStyler?: () => Style;

    initEditorMap?: boolean;
    initPredictMap?: boolean;
    initLayoutMap?: boolean;

    enableFeatureSelection?: boolean;
    handleFeatureSelect?: (feature: any, isTaggle: boolean, category: FeatureCategory) => void;
    handleFeatureDoubleClick?: (feature: any, isTaggle: boolean, category: FeatureCategory) => void;
    groupSelectMode?: boolean;
    handleIsPointerOnImage?: (isPointerOnImage: boolean) => void;
    isPointerOnImage?: boolean;
    drawRegionMode?: boolean;
    isSnapped?: boolean;
    handleIsSnapped?: (snapped: boolean) => void;
    handleVertexDrag?: (dragging: boolean) => void;
    isVertexDragging?: boolean;
    handleDrawing?: (drawing: boolean) => void;
    isDrawing?: boolean;
    handleRegionSelectByGroup?: (selectedRegions: IRegion[]) => void;
    handleFeatureSelectByGroup?: (feature) => IRegion;
    hoveringFeature?: string;
    onMapReady: () => void;
    handleTableToolTipChange?: (display: string, width: number, height: number, top: number,
        left: number, rows: number, columns: number, featureID: string) => void;
    addDrawnRegionFeatureProps?: (feature) => void;
    updateFeatureAfterModify?: (features) => any;

}

export class ImageMap extends React.Component<IImageMapProps> {
    private map: Map;
    private imageLayer: ImageLayer;
    private textVectorLayer: VectorLayer;
    private tableBorderVectorLayer: VectorLayer;
    private tableIconVectorLayer: VectorLayer;
    private tableIconBorderVectorLayer: VectorLayer;
    private checkboxVectorLayer: VectorLayer;
    private labelVectorLayer: VectorLayer;
    private drawRegionVectorLayer: VectorLayer;
    private drawnLabelVectorLayer: VectorLayer;

    private mapElement: HTMLDivElement | null = null;

    private dragPan: DragPan;
    private draw: Draw;
    private dragBox: DragBox;
    private modify: Modify;
    private snap: Snap;

    private drawnFeatures: Collection = new Collection([], { unique: true });
    public modifyStartFeatureCoordinates: any = {};

    private imageExtent: number[];

    private countPointerDown: number = 0;
    private isSwiping: boolean = false;

    private readonly IMAGE_LAYER_NAME = "imageLayer";
    private readonly TEXT_VECTOR_LAYER_NAME = "textVectorLayer";
    private readonly TABLE_BORDER_VECTOR_LAYER_NAME = "tableBorderVectorLayer";
    private readonly TABLE_ICON_VECTOR_LAYER_NAME = "tableIconVectorLayer";
    private readonly TABLE_ICON_BORDER_VECTOR_LAYER_NAME = "tableIconBorderVectorLayer";
    private readonly CHECKBOX_VECTOR_LAYER_NAME = "checkboxBorderVectorLayer";
    private readonly LABEL_VECTOR_LAYER_NAME = "labelledVectorLayer";
    private readonly DRAWN_REGION_LABEL_VECTOR_LAYER_NAME = "drawnRegionLabelledVectorLayer";
    private readonly DRAWN_REGION_VECTOR_LAYER_NAME = "drawnRegionVectorLayer";

    private ignorePointerMoveEventCount: number = 5;
    private pointerMoveEventCount: number = 0;

    private imageLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.IMAGE_LAYER_NAME,
    };

    private textVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.TEXT_VECTOR_LAYER_NAME,
    };

    private checkboxLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.CHECKBOX_VECTOR_LAYER_NAME,
    };

    private tableIconBorderVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.TABLE_ICON_BORDER_VECTOR_LAYER_NAME,
    };

    private labelVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.LABEL_VECTOR_LAYER_NAME,
    };

    private drawnLabelVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.DRAWN_REGION_LABEL_VECTOR_LAYER_NAME,
    };

    private drawnRegionVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.DRAWN_REGION_VECTOR_LAYER_NAME,
    };

    constructor(props: IImageMapProps) {
        super(props);

        this.imageExtent = [0, 0, this.props.imageWidth, this.props.imageHeight];
    }

    public componentDidMount() {
        if (this.props.initEditorMap) {
            this.initEditorMap();
        } else if (this.props.initPredictMap) {
            this.initPredictMap();
        }
        else if (this.props.initLayoutMap) {
            this.initLayoutMap();
        }
    }

    public componentDidUpdate(prevProps: IImageMapProps) {
        if (this.props.initEditorMap || this.props.initLayoutMap) {
            if (this.props?.drawRegionMode) {
                this.removeInteraction(this.dragBox);
                this.initializeDraw();
                this.addInteraction(this.draw);
                this.initializeModify();
                this.addInteraction(this.modify);
                this.addInteraction(this.snap);
                if (this.props?.isPointerOnImage) {
                    if (this.props.isSnapped) {
                        this.removeInteraction(this.draw);
                    }
                    if (this.props.isDrawing) {
                        this.removeInteraction(this.snap);
                    }
                } else {
                    this.removeInteraction(this.draw);
                    this.removeInteraction(this.modify);
                    this.removeInteraction(this.snap);
                }
            } else {
                this.removeInteraction(this.draw);
                this.addInteraction(this.dragBox);
                this.initializeModify();
                this.addInteraction(this.modify);
                this.addInteraction(this.snap);
                if (!this.props?.isPointerOnImage) {
                    this.removeInteraction(this.modify);
                    this.removeInteraction(this.dragBox);
                }
            }

            if (!this.props.isPointerOnImage && prevProps.isPointerOnImage && this.props.isVertexDragging) {
                this.cancelModify();
            }
        }

        if (prevProps.imageUri !== this.props.imageUri || prevProps.imageAngle !== this.props.imageAngle) {
            this.imageExtent = [0, 0, this.props.imageWidth, this.props.imageHeight];
            this.setImage(this.props.imageUri, this.imageExtent);
        }
    }

    public render() {
        return (
            <div
                onMouseLeave={this.handlePonterLeaveImageMap}
                onMouseEnter={this.handlePointerEnterImageMap}
                className="map-wrapper"
            >
                <div style={{ cursor: this.getCursor() }} id="map" className="map" ref={(el) => this.mapElement = el} />
            </div>
        );
    }

    public resetAllLayerVisibility = () => {
        this.toggleCheckboxFeatureVisibility(true);
        this.toggleLabelFeatureVisibility(true);
        this.toggleTableFeatureVisibility(true);
        this.toggleTextFeatureVisibility(true);
        this.toggleDrawnRegionsFeatureVisibility(true);
    }

    /**
     * Hide/Display table features
     */
    public toggleTableFeatureVisibility = (visible: boolean = false) => {
        this.tableBorderVectorLayer.setVisible(visible || !this.tableBorderVectorLayer.getVisible());
        this.tableIconVectorLayer.setVisible(visible || !this.tableIconVectorLayer.getVisible());
        this.tableIconBorderVectorLayer.setVisible(visible || !this.tableIconBorderVectorLayer.getVisible());
    }

    public toggleLabelFeatureVisibility = (visible: boolean = false) => {
        this.labelVectorLayer.setVisible(visible || !this.labelVectorLayer.getVisible());
        let drawLabelVectorLayerVisibility = this.drawnLabelVectorLayer.getVisible();
        this.drawnLabelVectorLayer.setVisible(visible || !drawLabelVectorLayerVisibility);
        drawLabelVectorLayerVisibility = this.drawnLabelVectorLayer.getVisible();
        const drawnLabelFeatures = this.getAllDrawnLabelFeatures();
        if (!drawLabelVectorLayerVisibility) {
            drawnLabelFeatures?.forEach((feature) => {
                this.removeFromDrawnFeatures(feature);
            });
        } else {
            drawnLabelFeatures?.forEach((feature) => {
                this.pushToDrawnFeatures(feature);
            });
        }

    }

    public toggleDrawnRegionsFeatureVisibility = (visible: boolean = false) => {
        let drawRegionVectorLayerVisibility = this.drawRegionVectorLayer.getVisible();
        this.drawRegionVectorLayer.setVisible(visible || !drawRegionVectorLayerVisibility);
        drawRegionVectorLayerVisibility = this.drawRegionVectorLayer.getVisible();
        const drawnRegionFeatures = this.getAllDrawnRegionFeatures();
        if (!drawRegionVectorLayerVisibility) {
            drawnRegionFeatures?.forEach((feature) => {
                this.removeFromDrawnFeatures(feature);
            });
        } else {
            drawnRegionFeatures?.forEach((feature) => {
                this.pushToDrawnFeatures(feature);
            });
        }
    }

    private pushToDrawnFeatures = (feature, drawnFeatures: Collection = this.drawnFeatures) => {
        const itemAlreadyExists = drawnFeatures.getArray().indexOf(feature) !== -1
        if (!itemAlreadyExists) {
            drawnFeatures.push(feature);
        }
    }

    private removeFromDrawnFeatures = (feature, drawnFeatures: Collection = this.drawnFeatures) => {
        const itemAlreadyExists = drawnFeatures.getArray().indexOf(feature) !== -1
        if (itemAlreadyExists) {
            drawnFeatures.remove(feature);
        }
    }

    /**
     * Hide/Display checkbox features
     */
    public toggleCheckboxFeatureVisibility = (visible: boolean = false) => {
        this.checkboxVectorLayer.setVisible(visible || !this.checkboxVectorLayer.getVisible());
    }

    public getResolutionForZoom = (zoom: number) => {
        if (this.map && this.map.getView()) {
            return this.map.getView().getResolutionForZoom(zoom);
        } else {
            return null;
        }
    }

    /**
     * Hide/Display text features
     */
    public toggleTextFeatureVisibility = (visible: boolean = false) => {
        this.textVectorLayer.setVisible(visible || !this.textVectorLayer.getVisible());
    }

    /**
     * Add one text feature to the map
     */
    public addFeature = (feature: Feature) => {
        this.textVectorLayer.getSource().addFeature(feature);
    }

    public addCheckboxFeature = (feature: Feature) => {
        this.checkboxVectorLayer.getSource().addFeature(feature);
    }

    public addLabelFeature = (feature: Feature) => {
        this.labelVectorLayer.getSource().addFeature(feature);
    }

    public addDrawnLabelFeature = (feature: Feature) => {
        this.drawnLabelVectorLayer.getSource().addFeature(feature);
    }

    public addTableBorderFeature = (feature: Feature) => {
        this.tableBorderVectorLayer.getSource().addFeature(feature);
    }

    public addTableIconFeature = (feature: Feature) => {
        this.tableIconVectorLayer.getSource().addFeature(feature);
    }

    public addTableIconBorderFeature = (feature: Feature) => {
        this.tableIconBorderVectorLayer.getSource().addFeature(feature);
    }

    /**
     * Add features to the map
     */
    public addFeatures = (features: Feature[]) => {
        this.textVectorLayer.getSource().addFeatures(features);
    }

    public addCheckboxFeatures = (features: Feature[]) => {
        this.checkboxVectorLayer.getSource().addFeatures(features);
    }

    public addLabelFeatures = (features: Feature[]) => {
        this.labelVectorLayer.getSource().addFeatures(features);
    }

    public addDrawnLabelFeatures = (features: Feature[]) => {
        this.drawnLabelVectorLayer.getSource().addFeatures(features);
    }

    public addTableBorderFeatures = (features: Feature[]) => {
        this.tableBorderVectorLayer.getSource().addFeatures(features);
    }

    public addTableIconFeatures = (features: Feature[]) => {
        this.tableIconVectorLayer.getSource().addFeatures(features);
    }

    public addTableIconBorderFeatures = (features: Feature[]) => {
        this.tableIconBorderVectorLayer.getSource().addFeatures(features);
    }

    public addDrawnRegionFeatures = (features: Feature[]) => {
        this.drawRegionVectorLayer.getSource().addFeatures(features);
    }

    /**
     * Add interaction to the map
     */
    public addInteraction = (interaction: Interaction) => {
        if (undefined === this.map.getInteractions().array_.find((existingInteraction) => {
            return interaction.constructor === existingInteraction.constructor;
        })) {
            this.map.addInteraction(interaction);
        }
    }

    /**
     * Get all features from the map
     */
    public getAllFeatures = () => {
        return this.textVectorLayer.getSource().getFeatures();
    }

    public getAllCheckboxFeatures = () => {
        return this.checkboxVectorLayer.getSource().getFeatures();
    }

    public getAllLabelFeatures = () => {
        return this.labelVectorLayer.getSource().getFeatures();
    }

    public getAllDrawnLabelFeatures = () => {
        return this.drawnLabelVectorLayer.getSource().getFeatures();
    }

    public getAllDrawnRegionFeatures = () => {
        return this.drawRegionVectorLayer.getSource().getFeatures();
    }

    public getFeatureByID = (featureID) => {
        return this.textVectorLayer.getSource().getFeatureById(featureID);
    }

    public getCheckboxFeatureByID = (featureID) => {
        return this.checkboxVectorLayer.getSource().getFeatureById(featureID);
    }

    public getTableBorderFeatureByID = (featureID) => {
        return this.tableBorderVectorLayer.getSource().getFeatureById(featureID);
    }

    public getTableIconFeatureByID = (featureID) => {
        return this.tableIconVectorLayer.getSource().getFeatureById(featureID);
    }

    public getTableIconBorderFeatureByID = (featureID) => {
        return this.tableIconBorderVectorLayer.getSource().getFeatureById(featureID);
    }

    public getDrawnRegionFeatureByID = (featureID) => {
        return this.drawRegionVectorLayer.getSource().getFeatureById(featureID);
    }

    public getLabelFeatureByID = (featureID) => {
        return this.labelVectorLayer.getSource().getFeatureById(featureID);
    }

    public getDrawnLabelFeatureByID = (featureID) => {
        return this.drawnLabelVectorLayer.getSource().getFeatureById(featureID);
    }

    /**
     * Remove specific feature object from the map
     */
    public removeFeature = (feature: Feature) => {
        if (feature && this.getFeatureByID(feature.getId())) {
            this.textVectorLayer.getSource().removeFeature(feature);
        }
    }

    public removeCheckboxFeature = (feature: Feature) => {
        if (feature && this.getCheckboxFeatureByID(feature.getId())) {
            this.checkboxVectorLayer.getSource().removeFeature(feature);
        }
    }

    public removeLabelFeature = (feature: Feature) => {
        if (feature && this.getLabelFeatureByID(feature.getId())) {
            this.labelVectorLayer.getSource().removeFeature(feature);
        }
    }

    public removeDrawnLabelFeature = (feature: Feature) => {
        if (feature && this.getDrawnLabelFeatureByID(feature.getId())) {
            this.drawnLabelVectorLayer.getSource().removeFeature(feature);
        }
    }

    public removeDrawnRegionFeature = (feature: Feature) => {
        if (feature && this.getDrawnRegionFeatureByID(feature.getId())) {
            this.drawRegionVectorLayer.getSource().removeFeature(feature);
        }
    }

    /**
     * Remove all features from the map
     */
    public removeAllFeatures = () => {
        if (this.props.handleTableToolTipChange) {
            this.props.handleTableToolTipChange("none", 0, 0, 0, 0, 0, 0, null);
        }
        this.textVectorLayer?.getSource().clear();
        this.tableBorderVectorLayer?.getSource().clear();
        this.tableIconVectorLayer?.getSource().clear();
        this.tableIconBorderVectorLayer?.getSource().clear();
        this.checkboxVectorLayer?.getSource().clear();
        this.labelVectorLayer?.getSource().clear();
        if (this.props.initEditorMap) {
            this.clearDrawnRegions();
        }
    }

    private clearDrawnRegions = () => {
        this.drawRegionVectorLayer?.getSource().clear();
        this.drawnLabelVectorLayer?.getSource().clear();

        this.drawnFeatures = new Collection([], { unique: true });

        this.drawRegionVectorLayer.getSource().on("addfeature", (evt) => {
            this.pushToDrawnFeatures(evt.feature, this.drawnFeatures);
        });
        this.drawRegionVectorLayer.getSource().on("removefeature", (evt) => {
            this.removeFromDrawnFeatures(evt.feature, this.drawnFeatures);
        });
        this.drawnLabelVectorLayer.getSource().on("addfeature", (evt) => {
            this.pushToDrawnFeatures(evt.feature, this.drawnFeatures);
        });
        this.drawnLabelVectorLayer.getSource().on("removefeature", (evt) => {
            this.removeFromDrawnFeatures(evt.feature, this.drawnFeatures);
        });

        this.removeInteraction(this.snap);
        this.initializeSnap();
        this.addInteraction(this.snap)
        this.removeInteraction(this.modify);
        this.initializeModify();
        this.addInteraction(this.modify);
    }

    public removeAllLabelFeatures = () => {
        this.labelVectorLayer?.getSource().clear();
    }

    public removeAllDrawnLabelFeatures = () => {
        this.getAllDrawnLabelFeatures().forEach((feature) => {
            this.removeFromDrawnFeatures(feature);
        });
        this.drawnLabelVectorLayer?.getSource().clear();
    }

    /**
     * Remove interaction from the map
     */
    public removeInteraction = (interaction: Interaction) => {
        const existingInteraction = this.map.getInteractions().array_.find((existingInteraction) => {
            return interaction.constructor === existingInteraction.constructor;
        });

        if (existingInteraction !== undefined) {
            this.map.removeInteraction(existingInteraction);
        }
    }

    public updateSize = () => {
        if (this.map) {
            this.map.updateSize();
        }

    }

    /**
     * Get the image extent (left, top, right, bottom)
     */
    public getImageExtent = () => {
        return this.imageExtent;
    }

    /**
     * Get features at specific extend
     */
    public getFeaturesInExtent = (extent: Extent): Feature[] => {
        const features: Feature[] = [];
        this.textVectorLayer.getSource().forEachFeatureInExtent(extent, (feature) => {
            features.push(feature);
        });
        return features;
    }

    public zoomIn = () => {
        this.map.getView().setZoom(this.map.getView().getZoom() + 0.3);
    }

    public zoomOut = () => {
        this.map.getView().setZoom(this.map.getView().getZoom() - 0.3);
    }

    public resetZoom = () => {
        this.map.getView().setZoom(0);
    }

    private initPredictMap = () => {
        const projection = this.createProjection(this.imageExtent);
        const layers = this.initializePredictLayers(projection);
        this.initializeMap(projection, layers);
        this.initializeDragPan();
    }

    private initEditorMap = () => {
        const projection = this.createProjection(this.imageExtent);
        const layers = this.initializeEditorLayers(projection);
        this.initializeMap(projection, layers);

        this.map.on("pointerdown", this.handlePointerDown);
        this.map.on("pointermove", this.handlePointerMove);
        this.map.on("pointermove", this.handlePointerMoveOnTableIcon);
        this.map.on("pointerup", this.handlePointerUp);
        this.map.on("dblclick", this.handleDoubleClick);

        this.initializeDefaultSelectionMode();
        this.initializeDragPan();
    }

    private initLayoutMap = () => {
        const projection = this.createProjection(this.imageExtent);
        const layers = this.initializeEditorLayers(projection);
        this.initializeMap(projection, layers);

        this.map.on("pointerdown", this.handlePointerDown);
        this.map.on("pointermove", this.handlePointerMove);
        this.map.on("pointermove", this.handlePointerMoveOnTableIcon);
        this.map.on("pointerup", this.handlePointerUp);
        this.map.on("dblclick", this.handleDoubleClick);

        this.initializeDefaultSelectionMode();
        this.initializeDragPan();

    }

    private setImage = (imageUri: string, imageExtent: number[]) => {
        const projection = this.createProjection(imageExtent);
        this.imageLayer.setSource(this.createImageSource(imageUri, projection, imageExtent));
        const mapView = this.createMapView(projection, imageExtent);
        this.map.setView(mapView);
    }

    private createProjection = (imageExtend: number[]) => {
        return new Projection({
            code: "xkcd-image",
            units: "pixels",
            extent: imageExtend,
        });
    }

    private createMapView = (projection: Projection, imageExtend: number[]) => {
        const minZoom = this.getMinimumZoom();
        const rotation = (this.props.imageAngle)
            ? Utils.degreeToRadians((this.props.imageAngle + 360) % 360)
            : 0;

        return new View({
            projection,
            center: getCenter(imageExtend),
            rotation,
            zoom: minZoom,
            minZoom,
        });
    }

    private createImageSource = (imageUri: string, projection: Projection, imageExtend: number[]) => {
        return new Static({
            url: imageUri,
            projection,
            imageExtent: imageExtend,
        });
    }

    private getMinimumZoom = () => {
        // In openlayers, the image will be projected into 256x256 pixels,
        // and image will be 2x larger at each zoom level.
        // https://openlayers.org/en/latest/examples/min-zoom.html

        const containerAspectRatio = (this.mapElement)
            ? (this.mapElement.clientHeight / this.mapElement.clientWidth) : 1;
        const imageAspectRatio = this.props.imageHeight / this.props.imageWidth;
        if (imageAspectRatio > containerAspectRatio) {
            // Fit to width
            return Math.LOG2E * Math.log(this.mapElement!.clientHeight / 256);
        } else {
            // Fit to height
            return Math.LOG2E * Math.log(this.mapElement!.clientWidth / 256);
        }
    }

    private handlePointerDown = (event: MapBrowserEvent) => {
        if (this.props.isSnapped) {
            this.props.handleVertexDrag(true);
            return;
        }

        if (!this.props.enableFeatureSelection) {
            return;
        }

        const eventPixel = this.map.getEventPixel(event.originalEvent);

        const filter = this.getLayerFilterAtPixel(eventPixel);

        const isPixelOnFeature = !!filter;
        if (isPixelOnFeature && !this.props.isSnapped) {
            this.setDragPanInteraction(false);
        }

        if (filter && this.props.handleFeatureSelect) {
            this.map.forEachFeatureAtPixel(
                eventPixel,
                (feature) => {
                    this.props.handleFeatureSelect(feature, true, filter.category);
                },
                filter.layerfilter,
            );
        }
    }
    private handleDoubleClick = (event: MapBrowserEvent) => {
        const eventPixel = this.map.getEventPixel(event.originalEvent);

        const filter = this.getLayerFilterAtPixel(eventPixel);
        if (filter && this.props.handleFeatureDoubleClick) {
            this.map.forEachFeatureAtPixel(
                eventPixel,
                (feature) => {
                    this.props.handleFeatureDoubleClick(feature, true, filter.category);
                },
                filter.layerfilter,
            );
        }
    }

    private getLayerFilterAtPixel = (eventPixel: any) => {
        const isPointerOnLabelledFeature = this.map.hasFeatureAtPixel(
            eventPixel,
            this.labelVectorLayerFilter);
        if (isPointerOnLabelledFeature) {
            return {
                layerfilter: this.labelVectorLayerFilter,
                category: FeatureCategory.Label,
            };
        }
        const isPointerOnCheckboxFeature = this.map.hasFeatureAtPixel(
            eventPixel,
            this.checkboxLayerFilter);
        if (isPointerOnCheckboxFeature) {
            return {
                layerfilter: this.checkboxLayerFilter,
                category: FeatureCategory.Checkbox,
            };
        }
        const isPointerOnTextFeature = this.map.hasFeatureAtPixel(
            eventPixel,
            this.textVectorLayerFilter);
        if (isPointerOnTextFeature) {
            return {
                layerfilter: this.textVectorLayerFilter,
                category: FeatureCategory.Text,
            };
        }
        const isPointerOnDrawnRegionFeature = this.map.hasFeatureAtPixel(
            eventPixel,
            this.drawnRegionVectorLayerFilter);
        if (isPointerOnDrawnRegionFeature) {
            return {
                layerfilter: this.drawnRegionVectorLayerFilter,
                category: FeatureCategory.DrawnRegion,
            };
        }
        const isPointerOnDrawnLabelFeature = this.map.hasFeatureAtPixel(
            eventPixel,
            this.drawnLabelVectorLayerFilter);
        if (isPointerOnDrawnLabelFeature) {
            return {
                layerfilter: this.drawnLabelVectorLayerFilter,
                category: FeatureCategory.DrawnRegion,
            };
        }
        return null;
    }

    private handlePointerMoveOnTableIcon = (event: MapBrowserEvent) => {
        if (this.props.handleTableToolTipChange) {
            const eventPixel = this.map.getEventPixel(event.originalEvent);
            const isPointerOnTableIconFeature = this.map.hasFeatureAtPixel(eventPixel, this.tableIconBorderVectorLayerFilter);
            if (isPointerOnTableIconFeature) {
                const features = this.map.getFeaturesAtPixel(eventPixel, this.tableIconBorderVectorLayerFilter);
                if (features.length > 0) {
                    const feature = features[0];
                    if (feature && this.props.hoveringFeature !== feature.get("id")) {
                        const geometry = feature.getGeometry();
                        const coordinates = geometry.getCoordinates();
                        if (coordinates && coordinates.length > 0) {
                            const pixels = [];
                            pixels.push(this.map.getPixelFromCoordinate(coordinates[0][0]));
                            pixels.push(this.map.getPixelFromCoordinate(coordinates[0][1]));
                            pixels.push(this.map.getPixelFromCoordinate(coordinates[0][2]));
                            pixels.push(this.map.getPixelFromCoordinate(coordinates[0][3]));
                            const flattenedLines = [].concat(...pixels);
                            const xAxisValues = flattenedLines.filter((value, index) => index % 2 === 0);
                            const yAxisValues = flattenedLines.filter((value, index) => index % 2 === 1);
                            const left = Math.min(...xAxisValues);
                            const top = Math.min(...yAxisValues);
                            const right = Math.max(...xAxisValues);
                            const bottom = Math.max(...yAxisValues);
                            const width = right - left;
                            const height = bottom - top;
                            this.props.handleTableToolTipChange("block", width + 2, height + 2, top + 43, left - 1, feature.get("rows"), feature.get("columns"), feature.get("id"));
                        }
                    }
                }
            } else {
                if (this.props.hoveringFeature !== null) {
                    this.props.handleTableToolTipChange("none", 0, 0, 0, 0, 0, 0, null);
                }
            }
        }
    }

    private handlePointerMove = (event: MapBrowserEvent) => {
        if (this.shouldIgnorePointerMove()) {
            return;
        }

        // disable vertical scrolling for iOS Safari
        event.preventDefault();

        const eventPixel = this.map.getEventPixel(event.originalEvent);
        this.map.forEachFeatureAtPixel(
            eventPixel,
            (feature) => {
                if (this.props.handleFeatureSelect) {
                    this.props.handleFeatureSelect(feature, false /*isTaggle*/, FeatureCategory.Text);
                }
            },
            this.textVectorLayerFilter);
    }

    private handlePointerUp = () => {
        if (this.props.isDrawing) {
            this.props.handleDrawing(false);
            return;
        }

        if (this.props.isVertexDragging) {
            this.props.handleVertexDrag(false);
            return;
        }

        if (!this.props.enableFeatureSelection) {
            return;
        }

        this.setDragPanInteraction(true);
        this.removeInteraction(this.modify);
        this.initializeModify();
        this.addInteraction(this.modify)
    }

    private setDragPanInteraction = (dragPanEnabled: boolean) => {
        if (dragPanEnabled) {
            this.addInteraction(this.dragPan)
            this.setSwiping(false);
        } else {
            this.removeInteraction(this.dragPan)
            this.setSwiping(true);
        }
    }

    public setSwiping = (swiping: boolean) => {
        this.isSwiping = swiping;
    }

    private shouldIgnorePointerMove = () => {
        if (!this.props.enableFeatureSelection) {
            return true;
        }

        if (!this.isSwiping) {
            return true;
        }

        return false;
    }

    public cancelDrawing = () => {
        this.removeInteraction(this.draw)
        this.initializeDraw();
        this.addInteraction(this.draw);
    }

    public cancelModify = () => {
        Object.entries(this.modifyStartFeatureCoordinates).forEach((featureCoordinate) => {
            let feature = this.getDrawnRegionFeatureByID(featureCoordinate[0]);
            if (!feature) {
                feature = this.getDrawnLabelFeatureByID(featureCoordinate[0]);
            }
            if (feature.getGeometry().flatCoordinates.join(",") !== featureCoordinate[1]) {
                const oldFlattenedCoordinates = (featureCoordinate[1] as string).split(",").map(parseFloat);
                const oldCoordinates = [];
                for (let i = 0; i < oldFlattenedCoordinates.length; i += 2) {
                    oldCoordinates.push([
                        oldFlattenedCoordinates[i],
                        oldFlattenedCoordinates[i + 1],
                    ]);
                }
                feature.getGeometry().setCoordinates([oldCoordinates]);
            }
        });
        this.modifyStartFeatureCoordinates = {};
        this.removeInteraction(this.modify);
        this.initializeModify();
        this.addInteraction(this.modify);
        this.props.handleIsSnapped(false);
    }

    private initializeDefaultSelectionMode = () => {
        this.initializeSnapCheck();
        this.initializePointerOnImageCheck();
        this.initializeDragBox();
        this.initializeModify();
        this.initializeSnap();
        this.initializeDraw();
        this.addInteraction(this.dragBox);
        this.addInteraction(this.modify);
        this.addInteraction(this.snap);
    }

    private initializeDraw = () => {
        const boundingExtent = (coordinates) => {
            const extent = createEmpty();
            coordinates.forEach((coordinate) => {
                extendCoordinate(extent, coordinate);
            });
            return extent;
        }

        const createEmpty = () => {
            return [Infinity, Infinity, -Infinity, -Infinity];
        }

        const extendCoordinate = (extent, coordinate) => {
            if (coordinate[0] < extent[0]) {
                extent[0] = coordinate[0];
            }
            if (coordinate[0] > extent[2]) {
                extent[2] = coordinate[0];
            }
            if (coordinate[1] < extent[1]) {
                extent[1] = coordinate[1];
            }
            if (coordinate[1] > extent[3]) {
                extent[3] = coordinate[1];
            }
        }

        this.draw = new Draw({
            source: this.drawRegionVectorLayer.getSource(),
            style: this.props.drawRegionStyler,
            geometryFunction: (coordinates, optGeometry) => {
                const extent = boundingExtent(/** @type {LineCoordType} */(coordinates));
                const boxCoordinates = [[
                    [extent[0], extent[3]],
                    [extent[2], extent[3]],
                    [extent[2], extent[1]],
                    [extent[0], extent[1]]
                ]];
                let geometry = optGeometry;
                if (geometry) {
                    geometry.setCoordinates(boxCoordinates);
                } else {
                    geometry = new Polygon(boxCoordinates);
                }
                return geometry;
            },
            freehand: true,
            stopClick: true,
        });

        this.draw.on('drawstart', (drawEvent) => {
            this.props.handleDrawing(true);
        });

        this.draw.on('drawend', (drawEvent) => {
            this.props.addDrawnRegionFeatureProps(drawEvent.feature);
        });

    }

    private initializeModify = () => {
        this.modify = new Modify({
            deleteCondition: never,
            insertVertexCondition: never,
            style: this.props.modifyStyler,
            features: this.drawnFeatures,
        });

        this.modify.handleUpEvent_old = this.modify.handleUpEvent;
        this.modify.handleUpEvent = function (evt) {
            try {
                this.handleUpEvent_old(evt);
            } catch (ex) {
                // do nothing
            }
        }

        this.modify.on('modifystart', (modifyEvent) => {
            const features = modifyEvent.features.getArray();
            let featureCoordinates = [];
            features.forEach((feature) => {
                feature.getGeometry().getCoordinates()[0].forEach((coordinate) => {
                    featureCoordinates.push(coordinate[0])
                    featureCoordinates.push(coordinate[1])
                });
                this.modifyStartFeatureCoordinates[feature.getId()] = featureCoordinates.join(",");
                featureCoordinates = [];
            });
        });

        this.modify.on('modifyend', (modifyEvent) => {
            const features = modifyEvent.features.getArray();
            this.props.updateFeatureAfterModify(features);
        });

    }

    private initializeSnap = () => {
        this.snap = new Snap({
            edge: false,
            vertex: true,
            features: this.drawnFeatures,
        });
    }

    private initializeDragPan = () => {
        this.dragPan = new DragPan();
        this.setDragPanInteraction(true);
    }

    private initializeDragBox = () => {
        this.dragBox = new DragBox({
            condition: shiftKeyOnly,
            className: "ol-dragbox-style",
        });;

        this.dragBox.on('boxend', () => {
            const featureMap = {};
            const extent = this.dragBox.getGeometry().getExtent();
            const regionsToAdd: IRegion[] = [];
            if (this.labelVectorLayer.getVisible()) {
                this.labelVectorLayer.getSource().forEachFeatureInExtent(extent, (feature) => {
                    const selectedRegion = this.props.handleFeatureSelectByGroup(feature);
                    if (selectedRegion) {
                        featureMap[feature.get("id")] = true;
                        regionsToAdd.push(selectedRegion);
                    }
                });
            }
            if (this.textVectorLayer.getVisible()) {
                this.textVectorLayer.getSource().forEachFeatureInExtent(extent, (feature) => {
                    const selectedRegion = this.props.handleFeatureSelectByGroup(feature);
                    if (selectedRegion && !featureMap.hasOwnProperty(feature.get("id"))) {
                        regionsToAdd.push(selectedRegion);
                    }
                });
            }
            if (regionsToAdd.length > 0) {
                this.props.handleRegionSelectByGroup(regionsToAdd);
            }
        });
    }

    private initializeSnapCheck = () => {
        const snapCheck = new Interaction({
            handleEvent: (evt: MapBrowserEvent) => {
                if (!this.props.isVertexDragging && this.props.handleIsSnapped) {
                    this.props.handleIsSnapped(this.snap.snapTo(evt.pixel, evt.coordinate, evt.map).snapped && this.props.isPointerOnImage)
                }
                return true;
            }
        });
        this.addInteraction(snapCheck);
    }

    private initializePointerOnImageCheck = () => {
        const checkIfPointerOnMap = new PointerInteraction({
            handleEvent: (evt: MapBrowserEvent) => {
                const eventPixel = this.map.getEventPixel(evt.originalEvent);
                const test = this.map.forEachLayerAtPixel(
                    eventPixel,
                    () => {
                        return true
                    },
                    this.imageLayerFilter);

                if (this.props.handleIsPointerOnImage) {
                    if (!Boolean(test) && this.props.isPointerOnImage) {
                        this.props.handleIsPointerOnImage(false);
                    } else if (!this.props.isPointerOnImage && Boolean(test)) {
                        this.props.handleIsPointerOnImage(true);
                    }
                }
                return true
            }
        });
        this.addInteraction(checkIfPointerOnMap);
    }

    private getCursor = () => {
        if (this.props.initEditorMap) {
            if (this.props.isVertexDragging) {
                return "grabbing";
            } else if (this.props.isSnapped) {
                return "grab";
            } else if (this.props?.groupSelectMode || this.props?.drawRegionMode) {
                if (this.props.isPointerOnImage) {
                    return "crosshair";
                } else {
                    return "default";
                }
            } else {
                return "default";
            }
        } else {
            return "default";
        }
    }

    private handlePonterLeaveImageMap = () => {
        if (this.props.initEditorMap) {
            if (this.props.isDrawing) {
                this.cancelDrawing();
            }
            if(this.props.handleIsPointerOnImage) {
                this.props.handleIsPointerOnImage(false);
            }
        }
    }

    private handlePointerEnterImageMap = () => {
        this.setDragPanInteraction(true);
    }

    private initializeEditorLayers = (projection: Projection) => {
        this.initializeImageLayer(projection);
        this.initializeTextLayer();
        this.initializeTableLayers();
        this.initializeCheckboxLayers();
        this.initializeLabelLayer();
        this.initializeDrawnRegionLabelLayer();
        this.initializeDrawnRegionLayer();
        return [this.imageLayer, this.textVectorLayer, this.tableBorderVectorLayer, this.tableIconBorderVectorLayer,
        this.tableIconVectorLayer, this.checkboxVectorLayer, this.drawRegionVectorLayer, this.labelVectorLayer,
        this.drawnLabelVectorLayer];
    }

    private initializePredictLayers = (projection: Projection) => {
        this.initializeImageLayer(projection);
        this.initializeTextLayer();
        this.initializeLabelLayer();
        return [this.imageLayer, this.textVectorLayer, this.labelVectorLayer];
    }

    private initializeImageLayer = (projection: Projection) => {
        this.imageLayer = new ImageLayer({
            source: this.createImageSource(this.props.imageUri, projection, this.imageExtent),
            name: this.IMAGE_LAYER_NAME,
        });
    }

    private initializeTextLayer = () => {
        const textOptions: any = {};
        textOptions.name = this.TEXT_VECTOR_LAYER_NAME;
        textOptions.style = this.props.featureStyler;
        textOptions.source = new VectorSource();
        this.textVectorLayer = new VectorLayer(textOptions);
    }

    private initializeTableLayers = () => {
        const tableBorderOptions: any = {};
        tableBorderOptions.name = this.TABLE_BORDER_VECTOR_LAYER_NAME;
        tableBorderOptions.style = this.props.tableBorderFeatureStyler;
        tableBorderOptions.source = new VectorSource();
        this.tableBorderVectorLayer = new VectorLayer(tableBorderOptions);

        const tableIconOptions: any = {};
        tableIconOptions.name = this.TABLE_ICON_VECTOR_LAYER_NAME;
        tableIconOptions.style = this.props.tableIconFeatureStyler;
        tableIconOptions.updateWhileAnimating = true;
        tableIconOptions.updateWhileInteracting = true;
        tableIconOptions.source = new VectorSource();
        this.tableIconVectorLayer = new VectorLayer(tableIconOptions);

        const tableIconBorderOptions: any = {};
        tableIconBorderOptions.name = this.TABLE_ICON_BORDER_VECTOR_LAYER_NAME;
        tableIconBorderOptions.style = this.props.tableIconBorderFeatureStyler;
        tableIconBorderOptions.source = new VectorSource();
        this.tableIconBorderVectorLayer = new VectorLayer(tableIconBorderOptions);
    }

    private initializeCheckboxLayers = () => {
        const checkboxOptions: any = {};
        checkboxOptions.name = this.CHECKBOX_VECTOR_LAYER_NAME;
        checkboxOptions.style = this.props.checkboxFeatureStyler;
        checkboxOptions.source = new VectorSource();
        this.checkboxVectorLayer = new VectorLayer(checkboxOptions);
    }

    private initializeDrawnRegionLayer = () => {
        const drawnRegionOptions: any = {};
        drawnRegionOptions.name = this.DRAWN_REGION_VECTOR_LAYER_NAME;
        drawnRegionOptions.style = this.props.drawnRegionStyler;
        drawnRegionOptions.source = new VectorSource();

        drawnRegionOptions.source.on("addfeature", (evt) => {
            this.pushToDrawnFeatures(evt.feature);
        });

        drawnRegionOptions.source.on("removefeature", (evt) => {
            this.removeFromDrawnFeatures(evt.feature);
        });

        this.drawRegionVectorLayer = new VectorLayer(drawnRegionOptions);
    }

    private initializeLabelLayer = () => {
        const labelOptions: any = {};
        labelOptions.name = this.LABEL_VECTOR_LAYER_NAME;
        labelOptions.style = this.props.labelFeatureStyler;
        labelOptions.source = new VectorSource();
        this.labelVectorLayer = new VectorLayer(labelOptions);
    }

    private initializeDrawnRegionLabelLayer = () => {
        const drawnRegionLabelOptions: any = {};
        drawnRegionLabelOptions.name = this.DRAWN_REGION_VECTOR_LAYER_NAME;
        drawnRegionLabelOptions.style = this.props.labelFeatureStyler;
        drawnRegionLabelOptions.source = new VectorSource();

        drawnRegionLabelOptions.source.on('addfeature', (evt) => {
            if (this.drawnLabelVectorLayer.getVisible()) {
                this.pushToDrawnFeatures(evt.feature)
            }
        });

        drawnRegionLabelOptions.source.on('removefeature', (evt) => {
            this.removeFromDrawnFeatures(evt.feature)

        });

        this.drawnLabelVectorLayer = new VectorLayer(drawnRegionLabelOptions);
    }

    private initializeMap = (projection, layers) => {
        this.map = new Map({
            controls: [],
            interactions: defaultInteractions({
                shiftDragZoom: false,
                doubleClickZoom: false,
                pinchRotate: false,
            }),
            target: "map",
            layers,
            view: this.createMapView(projection, this.imageExtent),
        });
    }
}
