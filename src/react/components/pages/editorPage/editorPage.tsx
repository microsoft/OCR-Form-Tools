// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import _ from "lodash";
import React, { RefObject } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import SplitPane from "react-split-pane";
import { bindActionCreators } from "redux";
import { PrimaryButton } from "@fluentui/react";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { strings, interpolate } from "../../../../common/strings";
import {
    AssetState, AssetType, EditorMode, FieldType,
    IApplicationState, IAppSettings, IAsset, IAssetMetadata,
    ILabel, IProject, IRegion, ISize, ITag, FeatureCategory, FieldFormat,
} from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { AssetPreview, ContentSource } from "../../common/assetPreview/assetPreview";
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import { TagInput } from "../../common/tagInput/tagInput";
import { tagIndexKeys } from "../../common/tagInput/tagIndexKeys";
import Canvas from "./canvas";
import { TableView } from "./tableView"
import CanvasHelpers from "./canvasHelpers";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import Alert from "../../common/alert/alert";
import Confirm from "../../common/confirm/confirm";
import { OCRService } from "../../../../services/ocrService";
import { throttle } from "../../../../common/utils";
import { constants } from "../../../../common/constants";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { getPrimaryGreenTheme, getPrimaryRedTheme } from "../../../../common/themes";
import { toast } from "react-toastify";
import { PredictService } from "../../../../services/predictService";
import { AssetService } from "../../../../services/assetService";

/**
 * Properties for Editor Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 * @member applicationActions - Application setting actions
 */
export interface IEditorPageProps extends RouteComponentProps, React.Props<EditorPage> {
    project: IProject;
    recentProjects: IProject[];
    appSettings: IAppSettings;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

/**
 * State for Editor Page
 */
export interface IEditorPageState {
    /** Array of assets in project */
    assets: IAsset[];
    /** The editor mode to set for canvas tools */
    editorMode: EditorMode;
    /** The selected asset for the primary editing experience */
    selectedAsset?: IAssetMetadata;
    /** Currently selected region on current asset */
    selectedRegions?: IRegion[];
    /** Most recently selected tag */
    selectedTag: string;
    /** Tags locked for region labeling */
    lockedTags: string[];
    /** Size of the asset thumbnails to display in the side bar */
    thumbnailSize: ISize;
    /**
     * Whether or not the editor is in a valid state
     * State is invalid when a region has not been tagged
     */
    isValid: boolean;
    /** Whether the show invalid region warning alert should display */
    showInvalidRegionWarning: boolean;
    /** Show tags when loaded */
    tagsLoaded: boolean;
    /** The currently hovered TagInputItemLabel */
    hoveredLabel: ILabel;
    /** Whether the task for loading all OCRs is running */
    isRunningOCRs?: boolean;
    /** Whether OCR is running in the main canvas */
    isCanvasRunningOCR?: boolean;
    isCanvasRunningAutoLabeling?: boolean;
    isError?: boolean;
    errorTitle?: string;
    errorMessage?: string;
    tableToView: object;
    tableToViewId: string;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        project: state.currentProject,
        appSettings: state.appSettings,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
        appTitleActions: bindActionCreators(appTitleActions, dispatch),
    };
}

/**
 * @name - Editor Page
 * @description - Page for adding/editing/removing tags to assets
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class EditorPage extends React.Component<IEditorPageProps, IEditorPageState> {
    public state: IEditorPageState = {
        selectedTag: null,
        lockedTags: [],
        assets: [],
        editorMode: EditorMode.Select,
        thumbnailSize: { width: 175, height: 155 },
        isValid: true,
        showInvalidRegionWarning: false,
        tagsLoaded: false,
        hoveredLabel: null,
        tableToView: null,
        tableToViewId: null,
    };

    private tagInputRef: RefObject<TagInput>;

    private loadingProjectAssets: boolean = false;
    private canvas: RefObject<Canvas> = React.createRef();
    private renameTagConfirm: React.RefObject<Confirm> = React.createRef();
    private renameCanceled: () => void;
    private deleteTagConfirm: React.RefObject<Confirm> = React.createRef();
    private deleteDocumentConfirm: React.RefObject<Confirm> = React.createRef();
    private isUnmount: boolean = false;

    constructor(props) {
        super(props);
        this.tagInputRef = React.createRef();
    }

    public async componentDidMount() {
        window.addEventListener("focus", this.onFocused);

        this.isUnmount = false;
        const projectId = this.props.match.params["projectId"];
        if (this.props.project) {
            await this.loadProjectAssets();
            this.props.appTitleActions.setTitle(this.props.project.name);
        } else if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }
        document.title = strings.editorPage.title + " - " + strings.appName;
    }

    public async componentDidUpdate(prevProps: Readonly<IEditorPageProps>) {
        if (this.props.project) {
            if (this.state.assets.length === 0) {
                await this.loadProjectAssets();
            } else {
                this.updateAssetsState();
            }
        }
    }

    public componentWillUnmount() {
        this.isUnmount = true;
        window.removeEventListener("focus", this.onFocused);
    }

    public render() {
        const { project } = this.props;
        const { assets, selectedAsset, isRunningOCRs, isCanvasRunningOCR, isCanvasRunningAutoLabeling } = this.state;

        const labels = (selectedAsset &&
            selectedAsset.labelData &&
            selectedAsset.labelData.labels) || [];

        const needRunOCRButton = assets.some((asset) => asset.state === AssetState.NotVisited);

        if (!project) {
            return (<div>Loading...</div>);
        }

        return (
            <div className="editor-page skipToMainContent" id="pageEditor">
                {this.state.tableToView !== null &&
                    <TableView
                        handleTableViewClose={this.handleTableViewClose}
                        tableToView={this.state.tableToView}
                    />
                }
                {
                    tagIndexKeys.map((index) =>
                        (<KeyboardBinding
                            displayName={strings.editorPage.tags.hotKey.apply}
                            key={index}
                            keyEventType={KeyEventType.KeyDown}
                            accelerators={[`${index}`]}
                            icon={"fa-tag"}
                            handler={this.handleTagHotKey} />))
                }
                <SplitPane split="vertical"
                    defaultSize={this.state.thumbnailSize.width}
                    minSize={150}
                    maxSize={325}
                    paneStyle={{ display: "flex" }}
                    onChange={this.onSideBarResize}
                    onDragFinished={this.onSideBarResizeComplete}>
                    <div className="editor-page-sidebar bg-lighter-1">
                        {needRunOCRButton && <div>
                            <PrimaryButton
                                theme={getPrimaryGreenTheme()}
                                className="editor-page-sidebar-run-ocr"
                                type="button"
                                onClick={() => this.loadOcrForNotVisited()}
                                disabled={this.isBusy()}>
                                {this.state.isRunningOCRs ?
                                    <div>
                                        <Spinner
                                            size={SpinnerSize.small}
                                            label="Running OCR"
                                            ariaLive="off"
                                            labelPosition="right"
                                        />
                                    </div> : "Run OCR on unvisited documents"
                                }
                            </PrimaryButton>
                        </div>}
                        <EditorSideBar
                            assets={assets}
                            selectedAsset={selectedAsset ? selectedAsset.asset : null}
                            onBeforeAssetSelected={this.onBeforeAssetSelected}
                            onAssetSelected={this.selectAsset}
                            onAssetLoaded={this.onAssetLoaded}
                            thumbnailSize={this.state.thumbnailSize}
                        />
                    </div>
                    <div className="editor-page-content" onClick={this.onPageClick}>
                        <SplitPane split="vertical"
                            primary="second"
                            maxSize={625}
                            minSize={290}
                            pane1Style={{ height: "100%" }}
                            pane2Style={{ height: "auto" }}
                            resizerStyle={{ width: "5px", margin: "0px", border: "2px", background: "transparent" }}
                            onChange={() => this.resizeCanvas()}>
                            <div className="editor-page-content-main" >
                                <div className="editor-page-content-main-body" onClick={this.onPageContainerClick}>
                                    {selectedAsset &&
                                        <Canvas
                                            ref={this.canvas}
                                            selectedAsset={this.state.selectedAsset}
                                            onAssetMetadataChanged={this.onAssetMetadataChanged}
                                            onCanvasRendered={this.onCanvasRendered}
                                            onSelectedRegionsChanged={this.onSelectedRegionsChanged}
                                            onRunningOCRStatusChanged={this.onCanvasRunningOCRStatusChanged}
                                            onRunningAutoLabelingStatusChanged={this.onCanvasRunningAutoLabelingStatusChanged}
                                            onTagChanged={this.onTagChanged}
                                            onAssetDeleted={this.confirmDocumentDeleted}
                                            editorMode={this.state.editorMode}
                                            project={this.props.project}
                                            lockedTags={this.state.lockedTags}
                                            hoveredLabel={this.state.hoveredLabel}
                                            setTableToView={this.setTableToView}
                                            closeTableView={this.closeTableView}
                                            runOcrForAllDocs={this.loadOcrForNotVisited}
                                            appSettings={this.props.appSettings}
                                        >
                                            <AssetPreview
                                                controlsEnabled={this.state.isValid}
                                                onBeforeAssetChanged={this.onBeforeAssetSelected}
                                                asset={this.state.selectedAsset.asset} />
                                        </Canvas>
                                    }
                                </div>
                            </div>
                            <div className="editor-page-right-sidebar">
                                <TagInput
                                    tagsLoaded={this.state.tagsLoaded}
                                    tags={this.props.project.tags}
                                    lockedTags={this.state.lockedTags}
                                    selectedRegions={this.state.selectedRegions}
                                    labels={labels}
                                    onChange={this.onTagsChanged}
                                    onLockedTagsChange={this.onLockedTagsChanged}
                                    onTagClick={this.onTagClicked}
                                    onCtrlTagClick={this.onCtrlTagClicked}
                                    onTagRename={this.confirmTagRename}
                                    onTagDeleted={this.confirmTagDeleted}
                                    onLabelEnter={this.onLabelEnter}
                                    onLabelLeave={this.onLabelLeave}
                                    onTagChanged={this.onTagChanged}
                                    ref={this.tagInputRef}
                                />
                                <Confirm
                                    title={strings.editorPage.tags.rename.title}
                                    ref={this.renameTagConfirm}
                                    message={strings.editorPage.tags.rename.confirmation}
                                    confirmButtonTheme={getPrimaryRedTheme()}
                                    onCancel={this.onTagRenameCanceled}
                                    onConfirm={this.onTagRenamed}
                                />
                                <Confirm
                                    title={strings.editorPage.tags.delete.title}
                                    ref={this.deleteTagConfirm}
                                    message={strings.editorPage.tags.delete.confirmation}
                                    confirmButtonTheme={getPrimaryRedTheme()}
                                    onConfirm={this.onTagDeleted}
                                />
                                {this.state.selectedAsset &&
                                    <Confirm
                                        title={strings.editorPage.asset.delete.title}
                                        ref={this.deleteDocumentConfirm}
                                        message={
                                            strings.editorPage.asset.delete.confirmation +
                                            "\"" + this.state.selectedAsset.asset.name + "\"?"
                                        }
                                        confirmButtonTheme={getPrimaryRedTheme()}
                                        onConfirm={this.onAssetDeleted}
                                    />
                                }
                            </div>
                        </SplitPane>
                    </div>
                </SplitPane>
                <Alert
                    show={this.state.showInvalidRegionWarning}
                    title={strings.editorPage.messages.enforceTaggedRegions.title}
                    // tslint:disable-next-line:max-line-length
                    message={strings.editorPage.messages.enforceTaggedRegions.description}
                    onClose={() => this.setState({ showInvalidRegionWarning: false })}
                />
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
                <PreventLeaving
                    when={isRunningOCRs || isCanvasRunningOCR}
                    message={"An OCR operation is currently in progress, are you sure you want to leave?"}
                />
                <PreventLeaving
                    when={isCanvasRunningAutoLabeling}
                    message={"An AutoLabeling option is currently in progress, are you sure you want to leave?"} />
            </div>
        );
    }

    // call function from child
    private onPageContainerClick = () => {
        // workaround: tagInput will not lost focus with olmap,
        // so we fire the blur event manually here
        this.tagInputRef.current.triggerNewTagBlur();
    }

    // tslint:disable-next-line:no-empty
    private onPageClick = () => {
    }

    /**
     * Called when the asset side bar is resized
     * @param newWidth The new sidebar width
     */
    private onSideBarResize = (newWidth: number) => {
        this.setState({
            thumbnailSize: {
                width: newWidth,
                height: newWidth / (4 / 3),
            },
        });
        this.resizeCanvas()
    }

    /**
     * Called when the asset sidebar has been completed
     */
    private onSideBarResizeComplete = () => {
        const appSettings = {
            ...this.props.appSettings,
            thumbnailSize: this.state.thumbnailSize,
        };

        this.props.applicationActions.saveAppSettings(appSettings);
    }

    /**
     * Called when a tag from footer is clicked
     * @param tag Tag clicked
     */
    private onTagClicked = (tag: ITag): void => {
        this.setState({
            selectedTag: tag.name,
            lockedTags: [],
        }, () => this.canvas.current.applyTag(tag.name));
    }

    /**
     * Open confirm dialog for tag renaming
     */
    private confirmTagRename = (tag: ITag, newTag: ITag, cancelCallback: () => void): void => {
        this.renameCanceled = cancelCallback;
        this.renameTagConfirm.current.open(tag, newTag);
    }

    /**
     * Renames tag in assets and project, and saves files
     * @param tag Tag to be renamed
     * @param newTag Tag with the new name
     */
    private onTagRenamed = async (tag: ITag, newTag: ITag): Promise<void> => {
        this.renameCanceled = null;
        const assetUpdates = await this.props.actions.updateProjectTag(this.props.project, tag, newTag);
        const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);

        if (selectedAsset) {
            if (selectedAsset) {
                this.setState({ selectedAsset });
            }
        }
    }

    private onTagRenameCanceled = () => {
        if (this.renameCanceled) {
            this.renameCanceled();
            this.renameCanceled = null;
        }
    }

    /**
     * Open Confirm dialog for tag deletion
     */
    private confirmTagDeleted = (tagName: string): void => {
        this.deleteTagConfirm.current.open(tagName);
    }

    /**
     * Open Confirm dialog for document deletion
     */
    private confirmDocumentDeleted = (): void => {
        this.deleteDocumentConfirm.current.open();
    }

    /**
     * Removes tag from assets and projects and saves files
     * @param tagName Name of tag to be deleted
     */
    private onTagDeleted = async (tagName: string): Promise<void> => {
        const assetUpdates = await this.props.actions.deleteProjectTag(this.props.project, tagName);

        const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);
        if (selectedAsset) {
            this.setState({ selectedAsset });
        }
    }

    private onCtrlTagClicked = (tag: ITag): void => {
        const locked = this.state.lockedTags;
        this.setState({
            selectedTag: tag.name,
            lockedTags: CanvasHelpers.toggleTag(locked, tag.name),
        }, () => this.canvas.current.applyTag(tag.name));
    }

    private getTagFromKeyboardEvent = (event: KeyboardEvent): ITag => {
        const index = tagIndexKeys.indexOf(event.key);
        const tags = this.props.project.tags;
        if (index >= 0 && index < tags.length) {
            return tags[index];
        }
        return null;
    }

    /**
     * Listens for {number key} and calls `onTagClicked` with tag corresponding to that number
     * @param event KeyDown event
     */
    private handleTagHotKey = (event: KeyboardEvent): void => {
        const tag = this.getTagFromKeyboardEvent(event);
        const selection = this.canvas.current.getSelectedRegions();

        if (tag && selection.length) {
            const { format, type, documentCount, name } = tag;
            const tagCategory = this.tagInputRef.current.getTagCategory(tag.type);
            const category = selection[0].category;
            const labels = this.state.selectedAsset.labelData.labels;
            const isTagLabelTypeDrawnRegion = this.tagInputRef.current.labelAssignedDrawnRegion(labels, tag.name);
            const labelAssigned = this.tagInputRef.current.labelAssigned(labels, name);

            if (labelAssigned && ((category === FeatureCategory.DrawnRegion) !== isTagLabelTypeDrawnRegion)) {
                if (isTagLabelTypeDrawnRegion) {
                    toast.warn(interpolate(strings.tags.warnings.notCompatibleWithDrawnRegionTag, { otherCatagory: category }));
                } else if (tagCategory === FeatureCategory.Checkbox) {
                    toast.warn(interpolate(strings.tags.warnings.notCompatibleWithDrawnRegionTag, { otherCatagory: FeatureCategory.Checkbox }));
                } else {
                    toast.warn(interpolate(strings.tags.warnings.notCompatibleWithDrawnRegionTag, { otherCatagory: FeatureCategory.Text }));
                }
                return;
            } else if (tagCategory === category || category === FeatureCategory.DrawnRegion ||
                (documentCount === 0 && type === FieldType.String && format === FieldFormat.NotSpecified)) {
                if (tagCategory === FeatureCategory.Checkbox && labelAssigned) {
                    toast.warn(strings.tags.warnings.checkboxPerTagLimit);
                    return;
                }
                this.onTagClicked(tag);
            } else {
                toast.warn(strings.tags.warnings.notCompatibleTagType, { autoClose: 7000 });
            }
        }
        // do nothing if region was not selected
    }

    /**
     * Returns a value indicating whether the current asset is taggable
     */
    private isTaggableAssetType = (asset: IAsset): boolean => {
        return asset.type !== AssetType.Unknown;
    }

    /**
     * Raised when the selected asset has been changed.
     * This can either be a parent or child asset
     */
    private onAssetMetadataChanged = async (assetMetadata: IAssetMetadata): Promise<void> => {
        // Comment out below code as we allow regions without tags, it would make labeler's work easier.

        const initialState = assetMetadata.asset.state;

        const asset = { ...assetMetadata.asset };

        if (this.isTaggableAssetType(assetMetadata.asset)) {
            assetMetadata.asset.state = _.get(assetMetadata, "labelData.labels.length", 0) > 0 ?
                AssetState.Tagged :
                AssetState.Visited;
        } else if (assetMetadata.asset.state === AssetState.NotVisited) {
            assetMetadata.asset.state = AssetState.Visited;
        }

        // Only update asset metadata if state changes or is different
        if (initialState !== assetMetadata.asset.state || this.state.selectedAsset !== assetMetadata) {
            if (this.state.selectedAsset.labelData && this.state.selectedAsset.labelData.labels &&
                assetMetadata.labelData && assetMetadata.labelData.labels &&
                assetMetadata.labelData.labels.toString() !== this.state.selectedAsset.labelData.labels.toString()) {
                await this.updatedAssetMetadata(assetMetadata);
            }
            await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
            if (this.props.project.lastVisitedAssetId === assetMetadata.asset.id) {
                this.setState({ selectedAsset: assetMetadata });
            }
        }

        // Find and update the root asset in the internal state
        // This forces the root assets that are displayed in the sidebar to
        // accurately show their correct state (not-visited, visited or tagged)
        const assets = [...this.state.assets];
        const assetIndex = assets.findIndex((a) => a.id === asset.id);
        if (assetIndex > -1) {
            assets[assetIndex] = {
                ...asset,
            };
        }

        this.setState({ assets, isValid: true });

        // Workaround for if component is unmounted
        if (!this.isUnmount) {
            this.props.appTitleActions.setTitle(`${this.props.project.name} - [ ${asset.name} ]`);
        }
    }

    private onAssetLoaded = (asset: IAsset, contentSource: ContentSource) => {
        const assets = [...this.state.assets];
        const assetIndex = assets.findIndex((item) => item.id === asset.id);
        if (assetIndex > -1) {
            const assets = [...this.state.assets];
            const item = { ...assets[assetIndex] };
            item.cachedImage = (contentSource as HTMLImageElement).src;
            assets[assetIndex] = item;
            this.setState({ assets });
        }
    }

    /**
     * Raised when the asset binary has been painted onto the canvas tools rendering canvas
     */
    private onCanvasRendered = async (canvas: HTMLCanvasElement) => {
        // When active learning auto-detect is enabled
        // run predictions when asset changes
    }

    private onSelectedRegionsChanged = (selectedRegions: IRegion[]) => {
        this.setState({ selectedRegions });
    }

    private onTagsChanged = async (tags) => {
        const project = {
            ...this.props.project,
            tags,
        };
        await this.props.actions.saveProject(project, true, false);
    }

    private onLockedTagsChanged = (lockedTags: string[]) => {
        this.setState({ lockedTags });
    }

    private onBeforeAssetSelected = (): boolean => {
        if (!this.state.isValid) {
            this.setState({ showInvalidRegionWarning: true });
        }

        return this.state.isValid;
    }

    private selectAsset = async (asset: IAsset): Promise<void> => {
        // Nothing to do if we are already on the same asset.
        if (this.state.selectedAsset && this.state.selectedAsset.asset.id === asset.id) {
            return;
        }

        if (!this.state.isValid) {
            this.setState({ showInvalidRegionWarning: true });
            return;
        }
        if (this.state.isCanvasRunningAutoLabeling) {
            return;
        }

        const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, asset);

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.warn("Error computing asset size");
        }

        this.setState({
            tableToView: null,
            tableToViewId: null,
            selectedAsset: assetMetadata,
        }, async () => {
            await this.onAssetMetadataChanged(assetMetadata);
            await this.props.actions.saveProject(this.props.project, false, false);
        });
    }

    private loadProjectAssets = async (): Promise<void> => {
        if (this.loadingProjectAssets) {
            return;
        }

        this.loadingProjectAssets = true;

        try {
            const assets = _(await this.props.actions.loadAssets(this.props.project))
                .uniqBy((asset) => asset.id)
                .value();
            if (this.state.assets.length === assets.length
                && JSON.stringify(this.state.assets) === JSON.stringify(assets)) {
                this.loadingProjectAssets = false;
                this.setState({ tagsLoaded: true });
                return;
            }

            const lastVisited = assets.find((asset) => asset.id === this.props.project.lastVisitedAssetId);

            this.setState({
                assets,
            }, async () => {
                await this.props.actions.saveProject(this.props.project, false, true);
                this.setState({ tagsLoaded: true });
                if (assets.length > 0) {
                    await this.selectAsset(lastVisited ? lastVisited : assets[0]);
                }
                this.loadingProjectAssets = false;
            });
        } catch (error) {
            throw Error(error);
        }
    }
    private isBusy = (): boolean => {
        return this.state.isRunningOCRs || this.state.isCanvasRunningOCR || this.state.isCanvasRunningAutoLabeling;
    }

    public loadOcrForNotVisited = async (runForAll?: boolean) => {
        if (this.isBusy()) {
            return;
        }
        const { project } = this.props;
        const ocrService = new OCRService(project);
        if (this.state.assets) {
            this.setState({ isRunningOCRs: true });
            try {
                await throttle(
                    constants.maxConcurrentServiceRequests,
                    this.state.assets
                        .filter((asset) => runForAll ? asset : asset.state === AssetState.NotVisited)
                        .map((asset) => asset.id),
                    async (assetId) => {
                        // Get the latest version of asset.
                        const asset = this.state.assets.find((asset) => asset.id === assetId);
                        if (asset && (asset.state === AssetState.NotVisited || runForAll)) {
                            try {
                                this.updateAssetState(asset.id, true);
                                await ocrService.getRecognizedText(asset.path, asset.name, undefined, runForAll);
                                this.updateAssetState(asset.id, false, AssetState.Visited);
                            } catch (err) {
                                this.updateAssetState(asset.id, false);
                                this.setState({
                                    isError: true,
                                    errorTitle: err.title,
                                    errorMessage: err.message,
                                });
                            }
                        }
                    }
                );
            } finally {
                this.setState({ isRunningOCRs: false });
            }
        }
    }

    private updateAssetState = (id: string, isRunningOCR: boolean, assetState?: AssetState) => {
        this.setState((state) => ({
            assets: state.assets.map((asset) => {
                if (asset.id === id) {
                    const updatedAsset = { ...asset, isRunningOCR };
                    if (assetState !== undefined && asset.state === AssetState.NotVisited) {
                        updatedAsset.state = assetState;
                    }
                    return updatedAsset;
                } else {
                    return asset;
                }
            }),
        }), () => {
            if (this.state.selectedAsset && id === this.state.selectedAsset.asset.id) {
                const asset = this.state.assets.find((asset) => asset.id === id);
                if (asset) {
                    this.setState({
                        selectedAsset: { ...this.state.selectedAsset, asset: { ...asset } },
                    });
                }
            }
        });
    }

    /**
     * Updates the root asset list from the project assets
     */
    private updateAssetsState = () => {
        const updatedAssets = [...this.state.assets];
        let needUpdate = false;
        updatedAssets.forEach((asset) => {
            const projectAsset = _.get(this.props, "project.assets[asset.id]", null);
            if (projectAsset) {
                if (asset.state !== projectAsset.state) {
                    needUpdate = true;
                    asset.state = projectAsset.state;
                }
            }
        });

        if (needUpdate) {
            this.setState({ assets: updatedAssets });
        }
    }

    private onLabelEnter = (label: ILabel) => {
        this.setState({ hoveredLabel: label });
    }

    private onLabelLeave = (label: ILabel) => {
        this.setState({ hoveredLabel: null });
    }

    private onCanvasRunningOCRStatusChanged = (isCanvasRunningOCR: boolean) => {
        this.setState({ isCanvasRunningOCR });
    }
    private onCanvasRunningAutoLabelingStatusChanged = (isCanvasRunningAutoLabeling: boolean) => {
        this.setState({ isCanvasRunningAutoLabeling });
    }
    private onFocused = () => {
        this.loadProjectAssets();
    }

    private onAssetDeleted = () => {
        this.props.actions.deleteAsset(this.props.project, this.state.selectedAsset).then(() => {
            this.loadProjectAssets();
        });
    }

    private onTagChanged = async (oldTag: ITag, newTag: ITag) => {
        const assetUpdates = await this.props.actions.updateProjectTag(this.props.project, oldTag, newTag);
        const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);

        if (selectedAsset) {
            this.setState({
                selectedAsset,
            });
        }
    }

    private setTableToView = async (tableToView, tableToViewId) => {
        if (this.state.tableToViewId) {
            this.canvas.current.setTableState(this.state.tableToViewId, "rest");
        }
        this.canvas.current.setTableState(tableToViewId, "selected");
        this.setState({
            tableToView,
            tableToViewId,
        });
    }

    private handleTableViewClose = () => {
        this.closeTableView("rest");
    }

    private closeTableView = (state: string) => {
        if (this.state.tableToView) {
            this.canvas.current.setTableState(this.state.tableToViewId, state);
            this.setState({
                tableToView: null,
                tableToViewId: null,
            });
        }
    }

    private resizeCanvas = () => {
        if (this.canvas.current) {
            this.canvas.current.updateSize();
        }
    }

    private async updatedAssetMetadata(assetMetadata: IAssetMetadata) {
        const assetDocumentCountDifference = {};
        const updatedAssetLabels = {};
        const currentAssetLabels = {};
        assetMetadata.labelData.labels.forEach((label) => {
            updatedAssetLabels[label.label] = true;
        });
        this.state.selectedAsset.labelData.labels.forEach((label) => {
            currentAssetLabels[label.label] = true;
        });
        Object.keys(currentAssetLabels).forEach((label) => {
            if (!updatedAssetLabels[label]) {
                assetDocumentCountDifference[label] = -1;
            }
        });
        Object.keys(updatedAssetLabels).forEach((label) => {
            if (!currentAssetLabels[label]) {
                assetDocumentCountDifference[label] = 1;
            }
        });
        await this.props.actions.updatedAssetMetadata(this.props.project, assetDocumentCountDifference);
    }
}
