// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Feature, MapBrowserEvent, View } from "ol";
import { Extent, getCenter } from "ol/extent";
import { defaults as defaultInteractions, DragPan, DragRotateAndZoom, Interaction } from "ol/interaction.js";
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
import { isControlled } from "office-ui-fabric-react";

interface IImageMapProps {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    imageAngle?: number;

    featureStyler?: any;

    enableFeatureSelection?: boolean;
    handleFeatureSelect?: (feature: any, isTaggle: boolean) => void;

    onMapReady: () => void;
}

export class ImageMap extends React.Component<IImageMapProps> {
    public map: Map;
    private imageLayer: ImageLayer;
    private vectorLayer: VectorLayer;

    private mapElement: HTMLDivElement | null = null;

    private imageExtent: number[];

    private countPointerDown: number = 0;
    private isSwiping: boolean = false;

    private readonly VECTOR_LAYER_NAME = "vectorLayer";

    private ignorePointerMoveEventCount: number = 5;
    private pointerMoveEventCount: number = 0;

    private vectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.VECTOR_LAYER_NAME,
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
     * Add one feature to the map
     */
    public addFeature = (feature: Feature) => {
        this.vectorLayer.getSource().addFeature(feature);
    }

    /**
     * Add features to the map
     */
    public addFeatures = (features: Feature[]) => {
        this.vectorLayer.getSource().addFeatures(features);
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
        return this.vectorLayer.getSource().getFeatures();
    }

    /**
     * Remove specific feature object from the map
     */
    public removeFeature = (feature: Feature) => {
        this.vectorLayer.getSource().removeFeature(feature);
    }

    /**
     * Remove all features from the map
     */
    public removeAllFeatures = () => {
        this.vectorLayer.getSource().clear();
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
        this.vectorLayer.getSource().forEachFeatureInExtent(extent, (feature) => {
            features.push(feature);
        });
        return features;
    }

    private initMap = () => {
        const projection = this.createProjection(this.imageExtent);

        this.imageLayer = new ImageLayer({
            source: this.createImageSource(this.props.imageUri, projection, this.imageExtent),
        });

        const options: any = {};
        options.name = this.VECTOR_LAYER_NAME;
        options.style = this.props.featureStyler;
        options.source = new VectorSource();
        this.vectorLayer = new VectorLayer(options);

        this.map = new Map({
            controls: [] ,
            interactions: defaultInteractions({ doubleClickZoom: false,
                pinchRotate: false }).extend([new DragRotateAndZoom()]),
            target: "map",
            layers: [this.imageLayer, this.vectorLayer],
            view: this.createMapView(projection, this.imageExtent),
        });

        this.map.on("pointerdown", this.handlePointerDown);
        this.map.on("pointermove", this.handlePointerMove);
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

        const isPointerOnFeature = this.map.hasFeatureAtPixel(
            this.map.getEventPixel(event.originalEvent),
            this.vectorLayerFilter);

        if (isPointerOnFeature && this.props.handleFeatureSelect) {
            const eventPixel = this.map.getEventPixel(event.originalEvent);
            this.map.forEachFeatureAtPixel(
                eventPixel,
                (feature) => {
                    if (this.props.handleFeatureSelect) {
                        this.props.handleFeatureSelect(feature, true /*isTaggle*/);
                    }
                },
                this.vectorLayerFilter);
        }

        this.setDragPanInteraction(!isPointerOnFeature /*dragPanEnabled*/);
        this.isSwiping = isPointerOnFeature;
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
                    this.props.handleFeatureSelect(feature, false /*isTaggle*/);
                }
            },
            this.vectorLayerFilter);
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
