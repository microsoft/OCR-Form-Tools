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
import { strings } from "../../../../common/strings";
import {
    AssetState, AssetType, EditorMode, IApplicationState,
    IAppSettings, IAsset, IAssetMetadata, IProject, IRegion,
    ISize, ITag,
    ILabel,
    IGenerator,
    IGeneratorRegion,
    IGeneratorSettings,
} from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import {AssetPreview, ContentSource} from "../../common/assetPreview/assetPreview";
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import { TagInput } from "../../common/tagInput/tagInput";
import { tagIndexKeys } from "../../common/tagInput/tagIndexKeys";
import Canvas from "./canvas";
import { TableView } from "./tableView"
import CanvasHelpers from "./canvasHelpers";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import GeneratorPane from "../../common/generators/generatorPane";
import Alert from "../../common/alert/alert";
import Confirm from "../../common/confirm/confirm";
import { OCRService } from "../../../../services/ocrService";
import { throttle } from "../../../../common/utils";
import { constants } from "../../../../common/constants";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { getPrimaryGreenTheme, getPrimaryRedTheme } from "../../../../common/themes";
import { SkipButton } from "../../shell/skipButton";
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
    // * Note - this IS kept in store. Probably should refactor this into props
    assets: IAsset[];
    /** The editor mode to set for canvas tools */
    editorMode: EditorMode;
    /** The selected asset for the primary editing experience */
    // * Note - this is not kept in store, but almost always synced with storage
    // * Probably important to keep it this way for offline editing
    selectedAsset?: IAssetMetadata;
    /** Currently selected region on current asset */
    selectedRegions?: IRegion[];
    /** Most recently active generator */
    selectedGeneratorIndex: number;
    /** The currently hovered GeneratorEditor */
    hoveredGenerator: IGenerator;
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
    /** Used for tag pane */
    assetsLoaded: boolean;
    /** Used for generator pane */
    assetMetadataLoaded: boolean;
    /** The currently hovered TagInputItemLabel */
    hoveredLabel: ILabel;
    /** Whether the task for loading all OCRs is running */
    isRunningOCRs?: boolean;
    /** Whether OCR is running in the main canvas */
    isCanvasRunningOCR?: boolean;
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
        selectedGeneratorIndex: -1,
        hoveredGenerator: null,
        thumbnailSize: { width: 175, height: 155 },
        isValid: true,
        showInvalidRegionWarning: false,
        assetsLoaded: false,
        assetMetadataLoaded: true, // TODO implement actions
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
    private deleteGeneratorConfirm: React.RefObject<Confirm> = React.createRef();
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

    public async componentDidUpdate(prevProps: Readonly<IEditorPageProps>, prevState: Readonly<IEditorPageState>) {
        if (this.props.project) {
            if (this.state.assets.length === 0) {
                await this.loadProjectAssets();
            } else {
                this.updateAssetsState();
            }
        }
        // Only save generators on asset not changed because onAssetMetadataChanged is a fragmented bit of update logic that will also trigger this (when we change assets)
        if (this.state.selectedAsset?.asset.name === prevState.selectedAsset?.asset.name &&
            this.state.selectedAsset?.generators && prevState.selectedAsset?.generators &&
            (this.state.selectedAsset.generators !== prevState.selectedAsset.generators
            || this.state.selectedAsset.generatorSettings !== prevState.selectedAsset.generatorSettings)
        ) {
            // ! this is what happens when project asset metadata isn't tracked in state
            const assetService = new AssetService(this.props.project);
            await assetService.saveGenerators(this.state.selectedAsset);
            // While we wait, client and storage break sync - rapid updates will prob break things
        }
    }

    public componentWillUnmount() {
        this.isUnmount = true;
        window.removeEventListener("focus", this.onFocused);
    }

    public render() {
        const { project } = this.props;
        if (!project) {
            return (<div>Loading...</div>);
        } // TODO localization
        const { assets, selectedAsset, isRunningOCRs, isCanvasRunningOCR } = this.state;
        const needRunOCRButton = assets.some((asset) => asset.state === AssetState.NotVisited);

        const labels = (selectedAsset &&
            selectedAsset.labelData &&
            selectedAsset.labelData.labels) || [];
        const generators = (selectedAsset && selectedAsset.generators) || [];
        const generatorSettings = (selectedAsset && selectedAsset.generatorSettings) || {
            generateCount: 40
        };

        const formattedItems = [...this.props.project.tags, ...generators];
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
                                onClick={this.loadAllOCRs}
                                disabled={this.state.isRunningOCRs}>
                                {this.state.isRunningOCRs ?
                                    <div>
                                        <Spinner
                                            size={SpinnerSize.small}
                                            label="Running OCR"
                                            ariaLive="off"
                                            labelPosition="right"
                                        />
                                    </div> : "Run OCR on all files"
                                }
                            </PrimaryButton>
                        </div>}
                        <EditorSideBar
                            assets={assets}
                            selectedAsset={selectedAsset ? selectedAsset.asset : null}
                            onBeforeAssetSelected={this.onBeforeAssetSelected}
                            onAssetSelected={this.selectAsset}
                            onAssetLoaded={this.onAssetPreviewLoaded}
                            thumbnailSize={this.state.thumbnailSize}
                        />
                    </div>
                    <div className="editor-page-content" onClick={this.onPageClick}>
                        <SplitPane split = "vertical"
                            primary = "second"
                            maxSize = {625}
                            minSize = {290}
                            pane1Style = {{height: "100%"}}
                            pane2Style = {{height: "auto"}}
                            resizerStyle = {{width: "5px", margin: "0px", border: "2px", background: "transparent"}}
                            onChange = {() => this.resizeCanvas()}>
                            <div className="editor-page-content-main" >
                                <div className="editor-page-content-main-body" onClick = {this.onPageContainerClick}>
                                    {selectedAsset &&
                                        <Canvas
                                            ref={this.canvas}
                                            selectedAsset={this.state.selectedAsset}
                                            onAssetMetadataChanged={this.onAssetMetadataChanged}
                                            onCanvasRendered={this.onCanvasRendered}
                                            onSelectedRegionsChanged={this.onSelectedRegionsChanged}
                                            onRunningOCRStatusChanged={this.onCanvasRunningOCRStatusChanged}
                                            onTagChanged={this.onTagChanged}
                                            activeGeneratorRegionId={this.getActiveGeneratorId()}
                                            hoveredGenerator={this.state.hoveredGenerator}
                                            editorMode={this.state.editorMode}
                                            setEditorMode={this.setEditorMode}
                                            generators={generators}
                                            formattedItems={formattedItems}
                                            addGenerator={this.addGeneratorRegion}
                                            deleteGenerators={this.confirmGeneratorsDeleted}
                                            onSelectedGeneratorRegion={this.onSelectedGenerator}
                                            project={this.props.project}
                                            lockedTags={this.state.lockedTags}
                                            hoveredLabel={this.state.hoveredLabel}
                                            setTableToView={this.setTableToView}
                                            closeTableView={this.closeTableView}>
                                            <AssetPreview
                                                controlsEnabled={this.state.isValid}
                                                onBeforeAssetChanged={this.onBeforeAssetSelected}
                                                asset={this.state.selectedAsset.asset} />
                                        </Canvas>
                                    }
                                </div>
                            </div>
                            <div className="editor-page-right-sidebar">
                                <SplitPane split="horizontal"
                                    primary="first"
                                    pane1Style = {{width: "100%", overflow: "auto"}}
                                    pane2Style = {{width: "auto", overflow: "auto"}}
                                    minSize = {200}
                                    resizerStyle = {{height: "5px", margin: "0px", border: "2px", background: "transparent"}}>
                                    <div style={{
                                        width: "100%"
                                    }}>
                                        <TagInput
                                            tagsLoaded={this.state.assetsLoaded}
                                            tags={this.props.project.tags}
                                            namedItems={formattedItems}
                                            lockedTags={this.state.lockedTags}
                                            selectedRegions={this.state.selectedRegions}
                                            labels={labels}
                                            onChange={this.onTagsChanged}
                                            onLockedTagsChange={this.onLockedTagsChanged}
                                            onTagClick={this.onTagClicked}
                                            onCtrlTagClick={this.onCtrlTagClicked}
                                            onRename={this.confirmTagRename}
                                            onTagDeleted={this.confirmTagDeleted}
                                            onLabelEnter={this.onLabelEnter}
                                            onLabelLeave={this.onLabelLeave}
                                            onTagChanged={this.onTagChanged}
                                            ref = {this.tagInputRef}
                                        />
                                        <Confirm title={strings.editorPage.tags.rename.title}
                                            ref={this.renameTagConfirm}
                                            message={strings.editorPage.tags.rename.confirmation}
                                            confirmButtonTheme={getPrimaryRedTheme()}
                                            onCancel={this.onTagRenameCanceled}
                                            onConfirm={this.onTagRenamed} />
                                        <Confirm title={strings.editorPage.tags.delete.title}
                                            ref={this.deleteTagConfirm}
                                            message={strings.editorPage.tags.delete.confirmation}
                                            confirmButtonTheme={getPrimaryRedTheme()}
                                            onConfirm={this.onTagDeleted} />
                                    </div>
                                    <div style={{
                                        width: "100%"
                                    }}>
                                        <GeneratorPane
                                            generatorsLoaded={!!this.state.selectedAsset}
                                            generators={generators}
                                            assetGeneratorSettings={generatorSettings}
                                            setGeneratorSettings={this.setGeneratorSettings}
                                            namedItems={formattedItems}
                                            selectedIndex={this.state.selectedGeneratorIndex}
                                            onSelectedGenerator={this.onSelectedGenerator}
                                            onGeneratorsChanged={this.onGeneratorsChanged}
                                            onGeneratorsDeleted={this.confirmGeneratorsDeleted}
                                            onEditorEnter={this.onGeneratorEnter}
                                            onEditorLeave={this.onGeneratorLeave}
                                            onGenerateClick={this.onGenerateClick}
                                            />
                                        <Confirm title={"Delete Generator"}
                                            ref={this.deleteGeneratorConfirm}
                                            message={"Are you sure you want to delete?"}
                                            confirmButtonTheme={getPrimaryRedTheme()}
                                            onConfirm={this.onGeneratorsDeleted} />
                                    </div>
                                </SplitPane>

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
            this.setState({ selectedAsset });
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

    private confirmGeneratorsDeleted = (ctx: IGenerator[]): void => {
        this.deleteGeneratorConfirm.current.open(ctx);
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
        if (tag) {
            this.onTagClicked(tag);
        }
    }

    /**
     * Returns a value indicating whether the current asset is taggable
     */
    private isTaggableAssetType = (asset: IAsset): boolean => {
        return asset.type !== AssetType.Unknown;
    }

    /**
     * Raised when the selected asset has been changed.
     * This can either be a parent or child asset.
     * Returns when selectedAsset and asset are fully updated.
     */
    private onAssetMetadataChanged = async (assetMetadata: IAssetMetadata): Promise<void> => {
        // Comment out below code as we allow regions without tags, it would make labeler's work easier.
        // TODO what does the comment above mean?

        // Visit state update
        const initialState = assetMetadata.asset.state;

        const asset = { ...assetMetadata.asset };

        if (this.isTaggableAssetType(assetMetadata.asset)) {
            assetMetadata.asset.state = _.get(assetMetadata, "labelData.labels.length", 0) > 0 ?
                AssetState.Tagged :
                AssetState.Visited;
        } else if (assetMetadata.asset.state === AssetState.NotVisited) {
            assetMetadata.asset.state = AssetState.Visited;
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

        // Only update asset metadata if state changes or is different
        if (initialState !== assetMetadata.asset.state || this.state.selectedAsset !== assetMetadata) {
            // * Note - this is actually a tag update, store doesn't hold assetMetadata...
            await this.props.actions.updatedAssetMetadata(this.props.project, this.state.selectedAsset, assetMetadata);
            // * Hence why we "update" (not really update) and save in separate actions
            await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
            if (this.props.project.lastVisitedAssetId === assetMetadata.asset.id) {
                this.setState({selectedAsset: assetMetadata});
            }
        }
    }

    private onAssetPreviewLoaded = (asset: IAsset, contentSource: ContentSource) => {
        const assets = [...this.state.assets];
        const assetIndex = assets.findIndex((item) => item.id === asset.id);
        if (assetIndex > -1) {
            const assets = [...this.state.assets];
            const item = {...assets[assetIndex]};
            item.cachedImage = (contentSource as HTMLImageElement).src;
            assets[assetIndex] = item;
            this.setState({assets});
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

        const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, asset);

        // TODO why do we need to recalculate asset size all the time?
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
            // * We update here just to manage the visit state update
            await this.onAssetMetadataChanged(assetMetadata);
            await this.props.actions.saveProject(this.props.project, false, false);
        });
    }

    private loadProjectAssets = async (): Promise<void> => {
        if (this.loadingProjectAssets) {
            return;
        }

        this.loadingProjectAssets = true;

        const assets: IAsset[] = _(await this.props.actions.loadAssets(this.props.project))
            .uniqBy((asset) => asset.id)
            .value();

        if (this.state.assets.length === assets.length
            && JSON.stringify(this.state.assets) === JSON.stringify(assets)) {
            this.loadingProjectAssets = false;
            this.setState({ assetsLoaded: true });
            return;
        }

        const lastVisited = assets.find((asset) => asset.id === this.props.project.lastVisitedAssetId);

        this.setState({
            assets,
        }, async () => {
            // TODO why saveProject? Didn't we just load it?
            await this.props.actions.saveProject(this.props.project, false, true);
            this.setState({ assetsLoaded: true });
            if (assets.length > 0) {
                await this.selectAsset(lastVisited ? lastVisited : assets[0]);
            }
            this.loadingProjectAssets = false;
        });
    }

    private loadAllOCRs = async () => {
        if (this.state.isRunningOCRs) {
            return;
        }

        const { project } = this.props;
        const ocrService = new OCRService(project);
        if (this.state.assets) {
            this.setState({ isRunningOCRs: true });
            try {
                await throttle(
                    constants.maxConcurrentServiceRequests,
                    this.state.assets.filter((asset) => asset.state === AssetState.NotVisited).map((asset) => asset.id),
                    async (assetId) => {
                        // Get the latest version of asset.
                        const asset = this.state.assets.find((asset) => asset.id === assetId);
                        if (asset && asset.state === AssetState.NotVisited) {
                            try {
                                this.updateAssetState(asset.id, true);
                                await ocrService.getRecognizedText(asset.path, asset.name);
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
                });
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
        this.setState({hoveredLabel: label});
    }

    private onLabelLeave = (label: ILabel) => {
        this.setState({hoveredLabel: null});
    }

    private onGeneratorEnter = (hoveredGenerator: IGenerator) => {
        this.setState({ hoveredGenerator });
    }

    private onGeneratorLeave = (generator: IGenerator) => {
        this.setState({ hoveredGenerator: null });
    }

    private onGenerateClick = () => {
        this.canvas.current.generate(this.state.selectedAsset.generators);
    }

    private onCanvasRunningOCRStatusChanged = (isCanvasRunningOCR: boolean) => {
        this.setState({ isCanvasRunningOCR });
    }

    private onFocused = () => {
        this.loadProjectAssets();
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

    private setEditorMode = (newMode: EditorMode) => {
        this.setState({
            editorMode: newMode
        });
    }

    private setGeneratorSettings = (settingUpdate: Partial<IGeneratorSettings>) => {
        const generatorSettings = {
            ...this.state.selectedAsset.generatorSettings,
            ...settingUpdate,
        };

        this.setState({
            selectedAsset: { ...this.state.selectedAsset, generatorSettings }
        });
    }

    private addGeneratorRegion = (region: IGenerator) => {
        const generators = [ ...this.state.selectedAsset.generators, region];
        this.onGeneratorsChanged(generators, generators.length - 1);
    }

    private onSelectedGenerator = (selectedGenerator?: IGeneratorRegion) => {
        if (!selectedGenerator) {
            this.setState({
                selectedGeneratorIndex: -1,
            });
            return;
        }
        // TODO only update on revision change - not sure about the UX here
        // https://stackoverflow.com/questions/25993044/openlayers3-is-it-possible-to-combine-modify-draw-select-operations
        // find and update the old one in case we modified
        // the canvas will provide location information on update only, since it only handles the click event
        const generators = [...this.state.selectedAsset.generators];
        const oldRegionIndex = generators.findIndex(r => r.id === selectedGenerator.id);
        const newRegion = { ...generators[oldRegionIndex], ...selectedGenerator };
        generators[oldRegionIndex] = newRegion;
        this.onGeneratorsChanged(generators, oldRegionIndex);
    }

    private onGeneratorsChanged = (newGenerators?: IGenerator[], index?: number) => {
        const generators = [...newGenerators]; // make a copy just in case
        const selectedGeneratorIndex = index == null ? this.state.selectedGeneratorIndex : index;
        this.setState({
            selectedAsset: { ...this.state.selectedAsset, generators },
            selectedGeneratorIndex
        });
    }

    private onGeneratorsDeleted = (regions: IGeneratorRegion | IGeneratorRegion[]) => {
        const deletedRegions = Array.isArray(regions) ? regions : [regions];
        // this may come from a component update (which should be registered here)
        // or a canvas delete (which is a bubble up)
        const oldGenerators = [...this.state.selectedAsset.generators];
        const newGenerators = oldGenerators.filter(g => deletedRegions.findIndex(r => r.id === g.id) === -1);
        this.onGeneratorsChanged(newGenerators, -1);
    }

    private getActiveGeneratorId = () => {
        const generator = this.state.selectedAsset.generators[this.state.selectedGeneratorIndex];
        return generator?.id;
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
}
