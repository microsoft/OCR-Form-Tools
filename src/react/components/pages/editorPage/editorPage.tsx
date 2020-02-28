// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import _ from "lodash";
import React, { RefObject } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import SplitPane from "react-split-pane";
import { bindActionCreators } from "redux";
import { PrimaryButton } from "office-ui-fabric-react";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { strings } from "../../../../common/strings";
import {
    AssetState, AssetType, EditorMode, IApplicationState,
    IAppSettings, IAsset, IAssetMetadata, IProject, IRegion,
    ISize, ITag,
    ILabel,
} from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { AssetPreview } from "../../common/assetPreview/assetPreview";
import { KeyboardBinding } from "../../common/keyboardBinding/keyboardBinding";
import { KeyEventType } from "../../common/keyboardManager/keyboardManager";
import { TagInput } from "../../common/tagInput/tagInput";
import { tagIndexKeys } from "../../common/tagInput/tagIndexKeys";
import Canvas from "./canvas";
import CanvasHelpers from "./canvasHelpers";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import Alert from "../../common/alert/alert";
import Confirm from "../../common/confirm/confirm";
import { OCRService } from "../../../../services/ocrService";
import { throttle } from "../../../../common/utils";
import { constants } from "../../../../common/constants";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";
import { getPrimaryGreenTheme, getPrimaryRedTheme } from "../../../../common/themes";
import { SkipButton } from "../../shell/skipButton";

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
    /** The currently hovered TagInputItemLabel */
    hoveredLabel: ILabel;
    /** Whether the task for loading all OCRs is running */
    isRunningOCRs?: boolean;
    /** Whether OCR is running in the main canvas */
    isCanvasRunningOCR?: boolean;
    isError?: boolean;
    errorTitle?: string;
    errorMessage?: string;
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
        hoveredLabel: null,
    };

    private tagInputRef: RefObject<TagInput>;

    private loadingProjectAssets: boolean = false;
    private canvas: RefObject<Canvas> = React.createRef();
    private renameTagConfirm: React.RefObject<Confirm> = React.createRef();
    private renameCanceled: () => void;
    private deleteTagConfirm: React.RefObject<Confirm> = React.createRef();
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
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }

        if (this.props.project && prevProps.project && this.props.project.tags !== prevProps.project.tags) {
            this.updateRootAssets();
        }
    }

    public componentWillUnmount() {
        this.isUnmount = true;
        window.removeEventListener("focus", this.onFocused);
    }

    public render() {
        const { project } = this.props;
        const { assets, selectedAsset, isRunningOCRs, isCanvasRunningOCR } = this.state;
        const rootAssets = assets.filter((asset) => !asset.parent);

        const labels = (selectedAsset &&
            selectedAsset.labelData &&
            selectedAsset.labelData.labels) || [];

        const needRunOCRButton = assets.some((asset) => asset.state === AssetState.NotVisited);

        if (!project) {
            return (<div>Loading...</div>);
        }

        return (
            <div className="editor-page" id="pageEditor">
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
                    minSize={175}
                    maxSize={175}
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
                            assets={rootAssets}
                            selectedAsset={selectedAsset ? selectedAsset.asset : null}
                            onBeforeAssetSelected={this.onBeforeAssetSelected}
                            onAssetSelected={this.selectAsset}
                            thumbnailSize={this.state.thumbnailSize}
                        />
                    </div>
                    <div className="editor-page-content" onClick={this.onPageClick}>
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
                                        editorMode={this.state.editorMode}
                                        project={this.props.project}
                                        lockedTags={this.state.lockedTags}
                                        hoveredLabel={this.state.hoveredLabel}>
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
                                ref = {this.tagInputRef}
                            />
                        </div>
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
                <SkipButton skipTo = "pageEditor">{strings.common.skipToMainContent}</SkipButton>
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
     * This can either be a parent or child asset
     */
    private onAssetMetadataChanged = async (assetMetadata: IAssetMetadata): Promise<void> => {
        // Comment out below code as we allow regions without tags, it would make labeler's work easier.

        const initialState = assetMetadata.asset.state;

        // The root asset can either be the actual asset being edited (ex: VideoFrame) or the top level / root
        // asset selected from the side bar (image/video).
        const rootAsset = { ...(assetMetadata.asset.parent || assetMetadata.asset) };

        if (this.isTaggableAssetType(assetMetadata.asset)) {
            assetMetadata.asset.state = _.get(assetMetadata, "labelData.labels.length", 0) > 0 ?
                AssetState.Tagged :
                AssetState.Visited;
        } else if (assetMetadata.asset.state === AssetState.NotVisited) {
            assetMetadata.asset.state = AssetState.Visited;
        }

        // Update root asset if not already in the "Tagged" state
        // This is primarily used in the case where a Video Frame is being edited.
        // We want to ensure that in this case the root video asset state is accurately
        // updated to match that state of the asset.
        if (rootAsset.id === assetMetadata.asset.id) {
            rootAsset.state = assetMetadata.asset.state;
        } else {
            const rootAssetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, rootAsset);

            if (rootAssetMetadata.asset.state !== AssetState.Tagged) {
                rootAssetMetadata.asset.state = assetMetadata.asset.state;
                await this.props.actions.saveAssetMetadata(this.props.project, rootAssetMetadata);
            }

            rootAsset.state = rootAssetMetadata.asset.state;
        }

        // Only update asset metadata if state changes or is different
        if (initialState !== assetMetadata.asset.state || this.state.selectedAsset !== assetMetadata) {
            await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
            if (this.props.project.lastVisitedAssetId === assetMetadata.asset.id) {
                this.setState({selectedAsset: assetMetadata});
            }
        }

        await this.props.actions.saveProject(this.props.project);

        // Find and update the root asset in the internal state
        // This forces the root assets that are displayed in the sidebar to
        // accurately show their correct state (not-visited, visited or tagged)
        const assets = [...this.state.assets];
        const assetIndex = assets.findIndex((asset) => asset.id === rootAsset.id);
        if (assetIndex > -1) {
            assets[assetIndex] = {
                ...rootAsset,
            };
        }

        this.setState({ assets, isValid: true });

        // Workaround for if component is unmounted
        if (!this.isUnmount) {
            this.props.appTitleActions.setTitle(`${this.props.project.name} - [ ${rootAsset.name} ]`);
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
        await this.props.actions.saveProject(project);
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

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.warn("Error computing asset size");
        }

        this.setState({
            selectedAsset: assetMetadata,
        }, async () => {
            await this.onAssetMetadataChanged(assetMetadata);
        });
    }

    private loadProjectAssets = async (): Promise<void> => {
        if (this.loadingProjectAssets) {
            return;
        }

        this.loadingProjectAssets = true;

        const rootAssets: IAsset[] = _(await this.props.actions.loadAssets(this.props.project))
            .uniqBy((asset) => asset.id)
            .value();

        if (this.state.assets.length === rootAssets.length
            && this.state.assets.map((asset) => asset.id).join(",") === rootAssets.map((asset) => asset.id).join(",")) {
            this.loadingProjectAssets = false;
            return;
        }

        const lastVisited = rootAssets.find((asset) => asset.id === this.props.project.lastVisitedAssetId);

        this.setState({
            assets: rootAssets,
        }, async () => {
            if (rootAssets.length > 0) {
                await this.selectAsset(lastVisited ? lastVisited : rootAssets[0]);
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
    private updateRootAssets = () => {
        const updatedAssets = [...this.state.assets];
        updatedAssets.forEach((asset) => {
            const projectAsset = _.get(this.props, "project.assets[asset.id]", null);
            if (projectAsset) {
                asset.state = projectAsset.state;
            }
        });

        this.setState({ assets: updatedAssets });
    }

    private onLabelEnter = (label: ILabel) => {
        this.setState({hoveredLabel: label});
    }

    private onLabelLeave = (label: ILabel) => {
        this.setState({hoveredLabel: null});
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
            if (selectedAsset) {
                this.setState({
                    selectedAsset,
                });
            }
        }
    }
}
