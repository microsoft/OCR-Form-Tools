// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Feature, MapBrowserEvent, DrawEvent, View, Style} from "ol";
import { Extent, getCenter } from "ol/extent";
import { defaults as defaultInteractions, DragPan, Draw, Snap, Modify, Interaction } from "ol/interaction.js";
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
import { FeatureCategory, EditorMode } from "../../../../models/applicationState";

interface IImageMapProps {
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    imageAngle?: number;

    featureStyler?: any;
    generatorFeatureStyler?: any;
    tableBorderFeatureStyler?: any;
    tableIconFeatureStyler?: any;
    tableIconBorderFeatureStyler?: any;
    checkboxFeatureStyler?: any;
    labelFeatureStyler?: any;

    enableFeatureSelection?: boolean;
    handleFeatureSelect?: (feature: any, isTaggle: boolean, category: FeatureCategory) => void;
    hoveringFeature?: string;
    editorMode?: EditorMode;
    handleGeneratorRegionCompleted?: (drawEvent: DrawEvent) => void;
    handleGeneratorRegionSelect?: (feature?: any) => void;

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
    private checkboxVectorLayer: VectorLayer;
    private labelVectorLayer: VectorLayer;
    private generatorVectorLayer: VectorLayer;

    private mapElement: HTMLDivElement | null = null;

    private imageExtent: number[];

    private countPointerDown: number = 0;
    private isSwiping: boolean = false;

    private readonly TEXT_VECTOR_LAYER_NAME = "textVectorLayer";
    private readonly TABLE_BORDER_VECTOR_LAYER_NAME = "tableBorderVectorLayer";
    private readonly TABLE_ICON_VECTOR_LAYER_NAME = "tableIconVectorLayer";
    private readonly TABLE_ICON_BORDER_VECTOR_LAYER_NAME = "tableIconBorderVectorLayer";
    private readonly CHECKBOX_VECTOR_LAYER_NAME = "checkboxBorderVectorLayer";
    private readonly LABEL_VECTOR_LAYER_NAME = "labelledVectorLayer";
    private readonly GENERATOR_VECTOR_LAYER_NAME = "generatorVectorLayer";

    private ignorePointerMoveEventCount: number = 5;
    private pointerMoveEventCount: number = 0;

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

    private generatorVectorLayerFilter = {
        layerFilter: (layer: Layer) => layer.get("name") === this.GENERATOR_VECTOR_LAYER_NAME,
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

        if (this.props.editorMode && prevProps.editorMode !== this.props.editorMode) {
            this.map.getInteractions().forEach((interaction) => {
                if (interaction instanceof Draw || interaction instanceof Snap || interaction instanceof Modify) {
                    interaction.setActive(this.props.editorMode === EditorMode.GeneratorRect);
                    if (this.props.editorMode !== EditorMode.GeneratorRect &&
                        interaction instanceof Draw) {
                        interaction.abortDrawing_();
                    }
                }
                // TODO - fire a mousemove so that we can avoid the point jump interaction.handleEvent(); // pointer uses this to update
            });
            if (this.isDrawing()) {
                this.setDragPanInteraction(false);
            }
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

    public toggleLabelFeatureVisibility = () => {
        this.labelVectorLayer.setVisible(!this.labelVectorLayer.getVisible());
    }

    /**
     * Hide/Display checkbox features
     */
    public toggleCheckboxFeatureVisibility = () => {
        this.checkboxVectorLayer.setVisible(!this.checkboxVectorLayer.getVisible());
    }

    public toggleGeneratorRegionVisibility = () => {
        this.generatorVectorLayer.setVisible(!this.generatorVectorLayer.getVisible());
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

    /**
     * Add interaction to the map
     */
    public addInteraction = (interaction: Interaction) => {
        this.map.addInteraction(interaction);
    }

    /**
     * Get all features from the map
     */
    public getAllTextFeatures = () => {
        return this.textVectorLayer.getSource().getFeatures();
    }

    public getAllGeneratorFeatures = () => {
        return this.generatorVectorLayer.getSource().getFeatures();
    }

    public getAllCheckboxFeatures = () => {
        return this.checkboxVectorLayer.getSource().getFeatures();
    }

    public getAllLabelFeatures = () => {
        return this.labelVectorLayer.getSource().getFeatures();
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

    public removeGeneratorFeature = (feature: Feature) => {
        this.generatorVectorLayer.getSource().removeFeature(feature);
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
        this.generatorVectorLayer.getSource().clear();
    }

    public removeAllLabelFeatures = () => {
        this.labelVectorLayer.getSource().clear();
    }

    /**
     * Remove interaction from the map
     */
    public removeInteraction = (interaction: Interaction) => {
        this.map.removeInteraction(interaction);
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

        const generatorOptions: any = {};
        generatorOptions.name = this.GENERATOR_VECTOR_LAYER_NAME;
        generatorOptions.style = this.props.generatorFeatureStyler;
        generatorOptions.source = new VectorSource();
        this.generatorVectorLayer = new VectorLayer(generatorOptions);

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
                this.checkboxVectorLayer,
                this.labelVectorLayer,
                this.generatorVectorLayer,
            ],
            view: this.createMapView(projection, this.imageExtent),
        });

        this.map.on("change", (e: any) => {
            console.log(e); // Er, I'm not sure.
        })

        const draw = new Draw({
            source: generatorOptions.source, // using the label source doesn't appear to work either
            type: "Polygon", // using Point doesn't work either
        });
        // TODO handle delete
        const snap = new Snap({source: generatorOptions.source});
        const modify = new Modify({source: generatorOptions.source});
        draw.setActive(false);
        snap.setActive(false);
        modify.setActive(false);

        draw.on("drawend", this.props.handleGeneratorRegionCompleted);
        // modify.on("modifystart", this.props.handleGeneratorRegionModified); // Do we need to update the object itself? Or will the reference update?
        this.addInteraction(draw);
        this.addInteraction(snap);
        this.addInteraction(modify);

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

        if (this.isDrawing()) {
            // If we're actively drawing, no selection.
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
                    if (filter.layerfilter === this.generatorVectorLayerFilter) {
                        // This definitely isn't meant to handle more than one feature
                        this.props.handleGeneratorRegionSelect(feature); // TODO debounce
                    } else {
                        this.props.handleFeatureSelect(feature, true, filter.category);
                    }
                },
                filter.layerfilter,
            );
        }
        const isPixelOnFeature = !!filter;
        if (!isPixelOnFeature) {
            this.props.handleGeneratorRegionSelect(); // selected no generator region
        }

        this.setDragPanInteraction(!isPixelOnFeature /*dragPanEnabled*/);
        this.isSwiping = isPixelOnFeature;
    }

    private getLayerFilterAtPixel = (eventPixel: any) => {
        const isPointerOnGeneratorFeature = this.map.hasFeatureAtPixel(
            eventPixel,
            this.generatorVectorLayerFilter);
        if (isPointerOnGeneratorFeature) {
            return {
                layerfilter: this.generatorVectorLayerFilter,
                category: FeatureCategory.Generator,
            };
        }
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
        if (!this.props.enableFeatureSelection) {
            return;
        }

        if (this.isDrawing()) {
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

    private isDrawing = () => this.props.editorMode && this.props.editorMode === EditorMode.GeneratorRect;

    private shouldIgnorePointerMove = () => {
        if (!this.props.enableFeatureSelection) {
            return true;
        }

        if (!this.isSwiping) {
            return true;
        }

        if (this.isDrawing()) {
            return true;
        }

        if (this.ignorePointerMoveEventCount > this.pointerMoveEventCount) {
            ++this.pointerMoveEventCount;
            return true;
        }

        return false;
    }
}
