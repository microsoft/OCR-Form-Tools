// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Feature, MapBrowserEvent, View } from "ol";
import { Extent, getCenter } from "ol/extent";
import { defaults as defaultInteractions, DragPan, Interaction } from "ol/interaction.js";
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

interface IImageMapProps {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    imageAngle?: number;

    featureStyler?: any;
    tableBorderFeatureStyler?: any;
    tableIconFeatureStyler?: any;
    tableIconBorderFeatureStyler?: any;

    enableFeatureSelection?: boolean;
    handleTextFeatureSelect?: (feature: any, isTaggle: boolean) => void;
    hoveringFeature?: string;

    onMapReady: () => void;
    handleTableToolTipChange?: (display: string, width: number, height: number, top: number,
                                left: number, rows: number, columns: number, featureID: string) => void;

}

export class ImageMap extends React.Component<IImageMapProps> {
    private map: Map;
    private imageLayer: ImageLayer;
    private textVectorLayer: VectorLayer;
    private tableBorderVectorLayer: VectorLayer;
    private tableIconVectorLayer: VectorLayer;
    private tableIconBorderVectorLayer: VectorLayer;

    private mapElement: HTMLDivElement | null = null;

    private imageExtent: number[];

    private countPointerDown: number = 0;
    private isSwiping: boolean = false;

    private readonly TEXT_VECTOR_LAYER_NAME = "textVectorLayer";
    private readonly TABLE_BORDER_VECTOR_LAYER_NAME = "tableBorderVectorLayer";
    private readonly TABLE_ICON_VECTOR_LAYER_NAME = "tableIconVectorLayer";
    private readonly TABLE_ICON_BORDER_VECTOR_LAYER_NAME = "tableIconBorderVectorLayer";

    private ignorePointerMoveEventCount: number = 5;
    private pointerMoveEventCount: number = 0;

    private textVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.TEXT_VECTOR_LAYER_NAME,
    };

    private tableIconBorderVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.TABLE_ICON_BORDER_VECTOR_LAYER_NAME,
    };

    constructor(props: IImageMapProps) {
        super(props);

        this.imageExtent = [0, 0, this.props.imageWidth, this.props.imageHeight];
    }

    public componentDidMount() {
        this.initMap();
    }

    public componentDidUpdate(prevProps: IImageMapProps) {
        if (prevProps.imageUri !== this.props.imageUri) {
            this.imageExtent = [0, 0, this.props.imageWidth, this.props.imageHeight];
            this.setImage(this.props.imageUri, this.imageExtent);
        }
    }

    public render() {
        return (
            <div className="map-wrapper">
                <div id="map" className="map" ref={(el) => this.mapElement = el}></div>
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

    public getResolutionForZoom = (zoom: number) => {
        return this.map.getView().getResolutionForZoom(zoom);
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

    public addTableBorderFeatures = (features: Feature[]) => {
        this.tableBorderVectorLayer.getSource().addFeatures(features);
    }

    public addTableIconFeatures = (features: Feature[]) => {
        this.tableIconVectorLayer.getSource().addFeatures(features);
    }

    public addTableIconBorderFeatures = (features: Feature[]) => {
        this.tableIconBorderVectorLayer.getSource().addFeatures(features);
    }

    /**
     * Add interaction to the map
     */
    public addInteraction = (interaction: Interaction) => {
        this.map.addInteraction(interaction);
    }

    /**
     * Get all features from the map
     */
    public getAllFeatures = () => {
        return this.textVectorLayer.getSource().getFeatures();
    }

    public getFeatureByID = (featureID) => {
        return this.textVectorLayer.getSource().getFeatureById(featureID);
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

    /**
     * Remove specific feature object from the map
     */
    public removeFeature = (feature: Feature) => {
        this.textVectorLayer.getSource().removeFeature(feature);
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

    }

    /**
     * Remove interaction from the map
     */
    public removeInteraction = (interaction: Interaction) => {
        this.map.removeInteraction(interaction);
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

        this.map = new Map({
            controls: [] ,
            interactions: defaultInteractions({ doubleClickZoom: false,
                pinchRotate: false }),
            target: "map",
            layers: [
                this.imageLayer,
                this.textVectorLayer,
                this.tableBorderVectorLayer,
                this.tableIconVectorLayer,
                this.tableIconBorderVectorLayer,
            ],
            view: this.createMapView(projection, this.imageExtent),
        });

        this.map.on("pointerdown", this.handlePointerDown);
        this.map.on("pointermove", this.handlePointerMove);
        this.map.on("pointermove", this.handlePointerMoveOnTableIcon);
        this.map.on("pointerup", this.handlePointerUp);
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

        const isPointerOnTextFeature = this.map.hasFeatureAtPixel(
            eventPixel,
            this.textVectorLayerFilter);

        if (isPointerOnTextFeature && this.props.handleTextFeatureSelect) {
            this.map.forEachFeatureAtPixel(
                eventPixel,
                (feature) => {
                    if (this.props.handleTextFeatureSelect) {
                        this.props.handleTextFeatureSelect(feature, true /*isTaggle*/);
                    }
                },
                this.textVectorLayerFilter);
        }
        this.setDragPanInteraction(!isPointerOnTextFeature /*dragPanEnabled*/);
        this.isSwiping = isPointerOnTextFeature;
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
                if (this.props.handleTextFeatureSelect) {
                    this.props.handleTextFeatureSelect(feature, false /*isTaggle*/);
                }
            },
            this.textVectorLayerFilter);
    }

    private handlePointerUp = () => {
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
}
