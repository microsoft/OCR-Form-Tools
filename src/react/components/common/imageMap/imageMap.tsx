// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Feature, MapBrowserEvent, View } from "ol";
import { Extent, getCenter } from "ol/extent";
import { defaults as defaultInteractions, DragPan, Interaction, DragBox, Snap, Select } from "ol/interaction.js";
import PointerInteraction from 'ol/interaction/Pointer';
import Draw, { createBox } from "ol/interaction/Draw.js";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import { shiftKeyOnly, never, always } from 'ol/events/condition';
import { Modify } from "ol/interaction";
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
import { FeatureCategory, IRegion } from "../../../../models/applicationState";
import { toast } from "react-toastify";

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
    drawRegionStyler?: (feature) => Style;

    enableFeatureSelection?: boolean;
    handleFeatureSelect?: (feature: any, isTaggle: boolean, category: FeatureCategory) => void;
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

    private mapElement: HTMLDivElement | null = null;

    private draw: Draw;
    private dragBox: DragBox;
    private select: Select;
    private modify: Modify;
    private snap: Snap;

    public modifyStartFeatureCoordinates: any = {};

    private cursor: string = "default";

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
    private readonly DRAWN_REGION_VECTOR_LAYER_NAME = "drawnRegionVectorLayer";

    private ignorePointerMoveEventCount: number = 5;
    private pointerMoveEventCount: number = 0;

    public getTextVectorLayer = () => {
        return this.textVectorLayer;
    }

    public getCheckboxVectorLayer = () => {
        return this.checkboxVectorLayer;
    }

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

    private drawnRegionVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.DRAWN_REGION_VECTOR_LAYER_NAME,
    };

    constructor(props: IImageMapProps) {
        super(props);

        this.imageExtent = [0, 0, this.props.imageWidth, this.props.imageHeight];
    }

    public componentDidMount() {
        this.initMap();
    }

    public componentDidUpdate(prevProps: IImageMapProps) {
        if (this.props?.drawRegionMode) {
            this.removeInteraction(this.dragBox)
            this.initializeDraw();
            this.addInteraction(this.draw);
            this.initializeModify();
            this.addInteraction(this.modify);
            this.addInteraction(this.snap);
            if (this.props?.isPointerOnImage) {
                if (this.props.isSnapped) {
                    this.removeInteraction(this.draw)
                }
                if (this.props.isDrawing) {
                    this.removeInteraction(this.snap)
                }
            } else {
                    this.removeInteraction(this.draw);
                    this.removeInteraction(this.modify)
                    this.removeInteraction(this.snap)
            }
        } else {
            this.removeInteraction(this.draw);
            this.addInteraction(this.dragBox);
            this.initializeModify();
            if (this.drawRegionVectorLayer.getVisible()) {
                this.addInteraction(this.modify);
                this.addInteraction(this.snap);
            }
            if (!this.props?.isPointerOnImage) {
                this.removeInteraction(this.modify)
                this.removeInteraction(this.dragBox);
            }
        }

        if (!this.props.isPointerOnImage && prevProps.isPointerOnImage && this.props.isVertexDragging) {
            Object.entries(this.modifyStartFeatureCoordinates).forEach((featureCoordinate) => {
                const feature = this.getDrawnRegionFeatureByID(featureCoordinate[0]);
                // feature.get
                if (feature.getGeometry().flatCoordinates.join(",") !== featureCoordinate[1]) {
                    const oldFlattenedCoordinates = (featureCoordinate[1] as string).split(",").map(parseFloat)
                    const oldCoordinates = []
                    for (let i = 0; i < oldFlattenedCoordinates.length; i += 2) {
                        oldCoordinates.push([
                            oldFlattenedCoordinates[i],
                            oldFlattenedCoordinates[i + 1],
                        ]);
                    }
                    feature.getGeometry().setCoordinates([oldCoordinates]);
                }
            })
            this.modifyStartFeatureCoordinates = {};
        }

        if (prevProps.imageUri !== this.props.imageUri) {
            this.imageExtent = [0, 0, this.props.imageWidth, this.props.imageHeight];
            this.setImage(this.props.imageUri, this.imageExtent);
        }
    }

    public render() {
        if (this.props.isVertexDragging) {
            this.cursor = "grabbing";
        } else if (this.props.isSnapped) {
            this.cursor = "grab";
        } else if (this.props?.groupSelectMode || this.props?.drawRegionMode) {
            if (this.props.isPointerOnImage) {
                this.cursor = "crosshair";
            } else {
                this.cursor = "default";
            }
        } else {
            this.cursor = "default";
        }
        return (
            <div onMouseLeave={() => {
                if(this.props.isDrawing) {
                    this.cancelDrawing()
                }
                this.props.handleIsPointerOnImage(false)
                }} className="map-wrapper">
                <div style={{cursor: this.cursor}} id="map" className="map" ref={(el) => this.mapElement = el}></div>
            </div>
        );
    }

    /**
     * Hide/Display table features
     */
    public toggleTableFeatureVisibility = () => {
        this.tableBorderVectorLayer.setVisible(!this.tableBorderVectorLayer.getVisible());
        this.tableIconVectorLayer.setVisible(!this.tableIconVectorLayer.getVisible());
        this.tableIconBorderVectorLayer.setVisible(!this.tableIconBorderVectorLayer.getVisible());
    }

    public toggleLabelFeatureVisibility = () => {
        this.labelVectorLayer.setVisible(!this.labelVectorLayer.getVisible());
    }

    public toggleDrawnRegionsFeatureVisibility = () => {
        const drawRegionVectorLayerVisibility = this.drawRegionVectorLayer.getVisible();
        this.drawRegionVectorLayer.setVisible(!drawRegionVectorLayerVisibility);
        if (drawRegionVectorLayerVisibility) {
            this.removeInteraction(this.modify)
            this.removeInteraction(this.snap);
        } else {
            this.addInteraction(this.modify)
            this.addInteraction(this.snap)
        }
    }

    /**
     * Hide/Display checkbox features
     */
    public toggleCheckboxFeatureVisibility = () => {
        this.checkboxVectorLayer.setVisible(!this.checkboxVectorLayer.getVisible());
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
    public toggleTextFeatureVisibility = () => {
        this.textVectorLayer.setVisible(!this.textVectorLayer.getVisible());
    }

    /**
     * Add one feature to the map
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
            return interaction.constructor.name === existingInteraction.constructor.name
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

    /**
     * Remove specific feature object from the map
     */
    public removeFeature = (feature: Feature) => {
        this.textVectorLayer.getSource().removeFeature(feature);
    }

    public removeCheckboxFeature = (feature: Feature) => {
        this.checkboxVectorLayer.getSource().removeFeature(feature);
    }

    public removeLabelFeature = (feature: Feature) => {
        this.labelVectorLayer.getSource().removeFeature(feature);
    }

    public removeDrawnRegionFeature = (feature: Feature) => {
        this.drawRegionVectorLayer.getSource().removeFeature(feature);
    }

    /**
     * Remove all features from the map
     */
    public removeAllFeatures = () => {
        if (this.props.handleTableToolTipChange) {
            this.props.handleTableToolTipChange("none", 0, 0, 0, 0, 0, 0, null);
        }
        this.textVectorLayer.getSource().clear();
        this.tableBorderVectorLayer.getSource().clear();
        this.tableIconVectorLayer.getSource().clear();
        this.tableIconBorderVectorLayer.getSource().clear();
        this.checkboxVectorLayer.getSource().clear();
        this.labelVectorLayer.getSource().clear();
        this.drawRegionVectorLayer.getSource().clear();
    }

    public removeAllLabelFeatures = () => {
        this.labelVectorLayer.getSource().clear();
    }

    /**
     * Remove interaction from the map
     */
    public removeInteraction = (interaction: Interaction) => {
        const existingInteraction = this.map.getInteractions().array_.find((existingInteraction) => {
            return interaction.constructor.name === existingInteraction.constructor.name
        }) 
        
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

    private initMap = () => {
        const projection = this.createProjection(this.imageExtent);

        this.imageLayer = new ImageLayer({
            source: this.createImageSource(this.props.imageUri, projection, this.imageExtent),
            name: this.IMAGE_LAYER_NAME,
        });

        const textOptions: any = {};
        textOptions.name = this.TEXT_VECTOR_LAYER_NAME;
        textOptions.style = this.props.featureStyler;
        textOptions.source = new VectorSource();
        this.textVectorLayer = new VectorLayer(textOptions);

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

        const checkboxOptions: any = {};
        checkboxOptions.name = this.CHECKBOX_VECTOR_LAYER_NAME;
        checkboxOptions.style = this.props.checkboxFeatureStyler;
        checkboxOptions.source = new VectorSource();
        this.checkboxVectorLayer = new VectorLayer(checkboxOptions);

        const labelOptions: any = {};
        labelOptions.name = this.LABEL_VECTOR_LAYER_NAME;
        labelOptions.style = this.props.labelFeatureStyler;
        labelOptions.source = new VectorSource();
        this.labelVectorLayer = new VectorLayer(labelOptions);

        const drawnRegionOptions: any = {};
        drawnRegionOptions.name = this.DRAWN_REGION_VECTOR_LAYER_NAME;
        drawnRegionOptions.style = this.props.drawRegionStyler;
        drawnRegionOptions.source = new VectorSource();
        this.drawRegionVectorLayer = new VectorLayer(drawnRegionOptions);

        this.map = new Map({
            controls: [] ,
            interactions: defaultInteractions({
                shiftDragZoom: false,
                doubleClickZoom: false,
                pinchRotate: false,
            }),
            target: "map",
            layers: [
                this.imageLayer,
                this.textVectorLayer,
                this.tableBorderVectorLayer,
                this.tableIconVectorLayer,
                this.tableIconBorderVectorLayer,
                this.checkboxVectorLayer,
                this.drawRegionVectorLayer,
                this.labelVectorLayer,
            ],
            view: this.createMapView(projection, this.imageExtent),
        });

        this.map.on("pointerdown", this.handlePointerDown);
        this.map.on("pointermove", this.handlePointerMove);
        this.map.on("pointermove", this.handlePointerMoveOnTableIcon);
        this.map.on("pointerup", this.handlePointerUp);

        if (this.props.handleIsSnapped) {

            let getSnapCoordinateInteraction = new Interaction({
                handleEvent: (evt: MapBrowserEvent) => {
                    if (!this.props.isVertexDragging) {
                        this.props.handleIsSnapped(this.snap.snapTo(evt.pixel, evt.coordinate, evt.map).snapped && this.props.isPointerOnImage)
                    }
                    return true;
                }
            });

            this.addInteraction(getSnapCoordinateInteraction);

            let checkIfPointerOnMap = new PointerInteraction({
                handleEvent: (evt: MapBrowserEvent) => {
                    const eventPixel = this.map.getEventPixel(evt.originalEvent);
                    const test = this.map.forEachLayerAtPixel(
                        eventPixel,
                        () => {
                            return true
                        },
                        this.imageLayerFilter);
                    if (!Boolean(test) && this.props.isPointerOnImage) {
                        this.props.handleIsPointerOnImage(false);
                    } else if (!this.props.isPointerOnImage && Boolean(test)) {
                        this.props.handleIsPointerOnImage(true);
                    }
                    return true
                }
            });

            this.addInteraction(checkIfPointerOnMap);
        }
        this.initializeSelectionMode();
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

        this.countPointerDown += 1;
        if (this.countPointerDown >= 2) {
            this.setDragPanInteraction(true /*dragPanEnabled*/);
            this.isSwiping = false;
            return;
        }

        const eventPixel =  this.map.getEventPixel(event.originalEvent);

        const filter = this.getLayerFilterAtPixel(eventPixel);

        if (filter && this.props.handleFeatureSelect) {
            this.map.forEachFeatureAtPixel(
                eventPixel,
                (feature) => {
                    this.props.handleFeatureSelect(feature, true, filter.category);
                },
                filter.layerfilter,
            );
        }
        const isPixelOnFeature = !!filter;
        this.setDragPanInteraction(!isPixelOnFeature /*dragPanEnabled*/);
        this.isSwiping = isPixelOnFeature;
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
                layerfilter : this.textVectorLayerFilter,
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
        return null;
    }

    private handlePointerMoveOnTableIcon = (event: MapBrowserEvent) => {
        if (this.props.handleTableToolTipChange) {
            const eventPixel = this.map.getEventPixel(event.originalEvent);
            const isPointerOnTableIconFeature = this.map.hasFeatureAtPixel(eventPixel,
                                                                           this.tableIconBorderVectorLayerFilter);
            if (isPointerOnTableIconFeature) {
                const features = this.map.getFeaturesAtPixel( eventPixel, this.tableIconBorderVectorLayerFilter);
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
                            this.props.handleTableToolTipChange("block", width + 2, height + 2, top + 43, left - 1,
                                                                feature.get("rows"), feature.get("columns"),
                                                                feature.get("id"));
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
        // }

        if (!this.props.enableFeatureSelection) {
            return;
        }

        this.countPointerDown -= 1;
        if (this.countPointerDown === 0) {
            this.setDragPanInteraction(true /*dragPanEnabled*/);
            this.isSwiping = false;
            this.pointerMoveEventCount = 0;
        }
    }

    private setDragPanInteraction = (dragPanEnabled: boolean) => {
        this.map.getInteractions().forEach((interaction) => {
            if (interaction instanceof DragPan) {
                interaction.setActive(dragPanEnabled);
            }
        });
    }

    private shouldIgnorePointerMove = () => {
        if (!this.props.enableFeatureSelection) {
            return true;
        }

        if (!this.isSwiping) {
            return true;
        }

        if (this.ignorePointerMoveEventCount > this.pointerMoveEventCount) {
            ++this.pointerMoveEventCount;
            return true;
        }

        return false;
    }

    private tableIconFeatureStyler = (feature, resolution) => {
        if (this.props.isSnapped) {
            return new Style({
                image: new Icon({
                    opacity: 0.6,
                    scale: this.getResolutionForZoom(4),
                    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAABcCAYAAADj79JYAAAEjklEQVR4Xu2cu89NWRTAf5+MoJhiKFCLyDQzOg06NCrjOY9Cg3hEPCIalUZkkIlH0EwymBmPUWnQMc10MxrEHyAKFAqEIMu3T5y5Oefc/ThnfXvLOt397tp7rfXba6+99t7nuxPYo0pgQlWbKcOAKweBATfgygSU1VmEG3BlAsrqLMINuDIBZXUW4QZcmYCyOotwA65MQFmdRbgBVyagrM4i3IArE1BWZxFuwJUJKKsrMcLF5o2O05/Ae2VmSepKAy72bgBOO693AJdLgl4S8Drs2Q74M6Ao6KUAb4JdTe2ioJcAvAt2cdBzB96WRnY60qeAotJLzsDH5WxhXi2gxUDPFfg42FUp6CuXVMr12ThH4KEQQ+X75BfcV27AY+HFtgsGltogN+DTgO+BM8CXQEjJNwr9BbAd+B14lwqqr/a5ARe/xKZNwM/A3sCdZAX9OLAf+CO3XWiOwCvoc4EnEcDEp9i2fQVyaz+5Ah/c8alSYMCVyRtwA95KQCqYecACYKarPF4BD1w1U8S5uHaEi751gMDzPceeAawGdgPLWobjLvALcAN47RG0VTUj5eLViIXZQ0WziCbwep08HdjmUbYtBg474D5OCvBDwL8dwlXZeRZ4o32ergW8aSf4GFgP/N0CZzlwHljkQ7om8xDYAtxpabcUuALMn4pLDA3gMdvur4FfgSU1aJI2TjiQsgOVR04JZWD2jKSbf4DNwP0G6DH2BI55u/jQwGOc+wo453K9WC5b9KPAMeBliyuzgH3AAXckIGKSm7cCz3OCPiTwGNjCZg3wVw3SQQf77Zgw+8JBP1KT+w643tIu1r6kaB8KeKwzcmAlN/I/Oa+6orTJ8dHZccEtijJLmp5YO6OhDwE8xYlvgGvAQudRV4S2OV2fIY+AtcC9DkIp9gaD7xt4qvErgFvOi//cFZpUHSGPVDVS43/rGq0Ebo/pINVub/v6BN5ktExln3q7MvgH4KL7cBOQz0+9vZkUnANcAla5dj+6z+O6qdfnktrkCTmPH9f/x+/7BC67R3kF7WTtJv1zAL4LkFfqernE6BN4NYApN+mWUrzmyf+FUvKhLZoRwFMi3crCSOAp0OsLp/STsvHpWjBTZmI0lr5z+KghMU7Z1j56OCcbxkCXXP5brZaWfuzwKmAg7HjWwRo6pdTHpA7dLiACojVFVKDbFVsKQcW2Mljygo8cbNklsiL4olVp5vCiQfVlvAHvi6RnP7kCr/K1vczpOZApYtW5tL2unELRs+3oJUDIBcDo5ir0LN7TxDSx3FJK0yWGD/S244NeLw/SUH865+ijnz77CD17CZXv09bgvnKL8MoBX4i+csFghmqQK3CfU0aRSbnOG4ppZ785A++Cbv/6PWC4NKWNUXU+C+uAJvp3nXuEd+X06rtiYFdT1n94playuAWyCVcpEd4U6fK3on4NqLQIr0O3Hxmb2mxTjvbSUko5ZFssNeDKQ2jADbgyAWV1FuEGXJmAsjqLcAOuTEBZnUW4AVcmoKzOItyAKxNQVmcRbsCVCSirswg34MoElNVZhBtwZQLK6j4AgoeUbKT4onIAAAAASUVORK5CYII=",
                }),
            });
        } else {
            return new Style({
                image: null,
            });
        }
    }

    public cancelDrawing = (pendCancel: boolean = false) => {
        this.removeInteraction(this.draw)
        this.initializeDraw();
        this.addInteraction(this.draw);
    }

    public initializeSelectionMode = () => {
        // this.initializeSelect();
        this.initializeDragBox();
        this.initializeModify();
        this.initializeSnap();
        this.initializeDraw();
        this.addInteraction(this.modify);
        this.addInteraction(this.snap);
        // this.addInteraction(this.select);
    }

    private initializeDraw = () => {
        this.draw = new Draw({
            source: this.drawRegionVectorLayer.getSource(),
            style: new Style({
                image: null,
                stroke: new Stroke({
                    color: "#a3f0ff",
                    width: 1,
                }),
                fill: new Fill({
                    color: "rgba(163, 240, 255, 0.2)",
                }),
            }),
            geometryFunction: createBox(),
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
            source: this.drawRegionVectorLayer.getSource(),
            deleteCondition: never,
            insertVertexCondition: never,
            style: this.tableIconFeatureStyler,
        });  

        this.modify.handleUpEvent_old = this.modify.handleUpEvent;
        this.modify.handleUpEvent = function (evt) {
            try {
                this.handleUpEvent_old(evt);
            } catch(ex) {
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
            source: this.drawRegionVectorLayer.getSource(),
            edge: false,
            vertex: true,
        });
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
}
