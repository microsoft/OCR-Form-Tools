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
    ILabel, IProject, IRegion, ISize, ITag, FeatureCategory, TagInputMode, FieldFormat, ITableTag, ITableRegion, AssetLabelingState, ITableConfigItem, TableVisualizationHint
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
import { OCRService, OcrStatus } from "../../../../services/ocrService";
import { getTagCategory, throttle } from "../../../../common/utils";
import { constants } from "../../../../common/constants";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { getPrimaryBlueTheme, getPrimaryGreenTheme, getPrimaryRedTheme } from "../../../../common/themes";
import { toast } from "react-toastify";
import { PredictService } from "../../../../services/predictService";
import { AssetService } from "../../../../services/assetService";
import clone from "rfdc";

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
    isRunningAutoLabelings?: boolean;
    /** Whether OCR is running in the main canvas */
    isCanvasRunningOCR?: boolean;
    isCanvasRunningAutoLabeling?: boolean;
    isError?: boolean;
    errorTitle?: string;
    errorMessage?: string;
    tableToView: object;
    tableToViewId: string;
    tagInputMode: TagInputMode;
    selectedTableTagToLabel: ITableTag;
    selectedTableTagBody: ITableRegion[][][];
    rightSplitPaneWidth?: number;
    reconfigureTableConfirm?: boolean;
    pageNumber: number;
    highlightedTableCellRegions: ITableRegion[];
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
        tagInputMode: TagInputMode.Basic,
        selectedTableTagToLabel: null,
        selectedTableTagBody: [[]],
        pageNumber: 1,
        highlightedTableCellRegions: null,
    };

    private tagInputRef: RefObject<TagInput>;

    private loadingProjectAssets: boolean = false;
    private canvas: RefObject<Canvas> = React.createRef();
    private renameTagConfirm: React.RefObject<Confirm> = React.createRef();
    private renameCanceled: () => void;
    private deleteTagConfirm: React.RefObject<Confirm> = React.createRef();
    private deleteDocumentConfirm: React.RefObject<Confirm> = React.createRef();
    private reconfigTableConfirm: React.RefObject<Confirm> = React.createRef();
    private replaceConfirmRef = React.createRef<Confirm>();


    private isUnmount: boolean = false;
    public initialRightSplitPaneWidth: number;
    private isOCROrAutoLabelingBatchRunning = false;

    constructor(props) {
        super(props);
        this.tagInputRef = React.createRef();
    }

    public async componentDidMount() {
        window.addEventListener("focus", this.onFocused);

        this.isUnmount = false;
        this.isOCROrAutoLabelingBatchRunning = false;
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
        const { selectedAsset, isRunningOCRs, isCanvasRunningOCR, isCanvasRunningAutoLabeling, isRunningAutoLabelings } = this.state;
        const assets = this.state.assets.sort((a, b) => a.name.localeCompare(b.name));

        const labels = (selectedAsset &&
            selectedAsset.labelData &&
            selectedAsset.labelData.labels) || [];
        const tableLabels = (selectedAsset &&
            selectedAsset.labelData &&
            selectedAsset.labelData.tableLabels) || [];

        const needRunOCRButton = assets.some((asset) => asset.state === AssetState.NotVisited);

        if (!project) {
            return (<div>Loading...</div>);
        }

        const isBasicInputMode = this.state.tagInputMode === TagInputMode.Basic;
        this.initialRightSplitPaneWidth = isBasicInputMode ? 290 : 520;

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
                <SplitPane
                    split="vertical"
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
                                            label="Running Layout"
                                            ariaLive="off"
                                            labelPosition="right"
                                        />
                                    </div> : "Run Layout on unvisited documents"
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
                            maxSize={isBasicInputMode ? 400 : 700}
                            minSize={this.initialRightSplitPaneWidth}
                            className={"right-vertical_splitPane"}
                            pane1Style={{ height: "100%" }}
                            pane2Style={{ height: "auto" }}
                            resizerStyle={{
                                width: "5px",
                                margin: "0px",
                                border: "2px",
                            }}
                            onChange={(width) => {
                                if (!isBasicInputMode) {
                                    this.setState({ rightSplitPaneWidth: width > 700 ? 700 : width }, () => {
                                        this.resizeCanvas();
                                    });
                                    this.resizeCanvas();
                                }
                            }}>
                            <div className="editor-page-content-main" >
                                <div className="editor-page-content-main-body" onClick={this.onPageContainerClick}>
                                    {selectedAsset &&

                                        <Canvas
                                            ref={this.canvas}
                                            selectedAsset={this.state.selectedAsset}
                                            onAssetMetadataChanged={this.onAssetMetadataChanged}
                                            onCanvasRendered={this.onCanvasRendered}
                                            onSelectedRegionsChanged={this.onSelectedRegionsChanged}
                                            onRegionDoubleClick={this.onRegionDoubleClick}
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
                                            isRunningOCRs={this.state.isRunningOCRs}
                                            onPageLoaded={this.onPageLoaded}
                                            runAutoLabelingOnNextBatch={this.runAutoLabelingOnNextBatch}
                                            appSettings={this.props.appSettings}
                                            handleLabelTable={this.handleLabelTable}
                                            highlightedTableCell={this.state.highlightedTableCellRegions}
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
                                    encoded={constants.supportedLabelsSchemas.has(selectedAsset?.labelData?.$schema)}
                                    tableLabels={tableLabels}
                                    pageNumber={this.state.pageNumber}
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
                                    setTagInputMode={this.setTagInputMode}
                                    tagInputMode={this.state.tagInputMode}
                                    handleLabelTable={this.handleLabelTable}
                                    selectedTableTagToLabel={this.state.selectedTableTagToLabel}
                                    handleTableCellClick={this.handleTableCellClick}
                                    handleTableCellMouseEnter={this.handleTableCellMouseEnter}
                                    handleTableCellMouseLeave={this.handleTableCellMouseLeave}
                                    selectedTableTagBody={this.state.selectedTableTagBody}
                                    splitPaneWidth={this.state.rightSplitPaneWidth}
                                    reconfigureTableConfirm={this.reconfigureTableConfirm}
                                    addRowToDynamicTable={this.addRowToDynamicTable}
                                    onTagDoubleClick={this.onLabelDoubleClicked}
                                />
                                <Confirm
                                    title={strings.editorPage.tags.rename.title}
                                    loadMessage={"Renaming..."}
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
                                <Confirm
                                    title={strings.tags.regionTableTags.confirm.reconfigure.title}
                                    loadMessage={"Reconfiguring..."}
                                    ref={this.reconfigTableConfirm}
                                    message={strings.tags.regionTableTags.confirm.reconfigure.message}
                                    confirmButtonTheme={getPrimaryBlueTheme()}
                                    onConfirm={this.reconfigureTable}
                                />
                                <Confirm
                                    title={strings.tags.warnings.replaceAllExitingLabelsTitle}
                                    ref={this.replaceConfirmRef}
                                    message={strings.tags.warnings.replaceAllExitingLabels}
                                    confirmButtonTheme={getPrimaryRedTheme()}
                                    onConfirm={this.onTableTagClicked}
                                />

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
                    message={strings.editorPage.warningMessage.PreventLeavingWhileRunningOCR}
                />
                <PreventLeaving
                    when={isCanvasRunningAutoLabeling || isRunningAutoLabelings}
                    message={strings.editorPage.warningMessage.PreventLeavingRunningAutoLabeling} />
            </div>
        );
    }

    // call function from child
    private onPageContainerClick = () => {
        // workaround: tagInput will not lost focus with olmap,
        // so we fire the blur event manually here
        this.tagInputRef.current.triggerNewTagBlur();
        this.tagInputRef.current.triggerRenameTagBlur();
    }

    // tslint:disable-next-line:no-empty
    private onPageClick = () => {
    }

    private setTagInputMode = (tagInputMode: TagInputMode, selectedTableTagToLabel: ITableTag = this.state.selectedTableTagToLabel, selectedTableTagBody: ITableRegion[][][] = this.state.selectedTableTagBody) => {
        // this.resizeCanvas();

        this.setState({
            selectedTableTagBody,
            selectedTableTagToLabel,
            tagInputMode,
        }, () => {
            this.resizeCanvas();
        });

    }

    private handleLabelTable = (tagInputMode: TagInputMode = this.state.tagInputMode, selectedTableTagToLabel: ITableTag = this.state.selectedTableTagToLabel) => {

        if (selectedTableTagToLabel == null || !this.state.selectedAsset) {
            return;
        }

        let rowKeys;
        let columnKeys;
        if (selectedTableTagToLabel.type === FieldType.Object) {
            if (selectedTableTagToLabel.visualizationHint === TableVisualizationHint.Vertical) {
                columnKeys = selectedTableTagToLabel.definition.fields;
                rowKeys = selectedTableTagToLabel.fields;
            } else {
                columnKeys = selectedTableTagToLabel.fields;
                rowKeys = selectedTableTagToLabel.definition.fields;

            }
        } else {
            rowKeys = null;
            columnKeys = selectedTableTagToLabel.definition.fields;
        }

        const selectedTableTagBody = new Array(rowKeys?.length || 1);
        if (this.state.selectedTableTagToLabel?.name === selectedTableTagToLabel?.name && selectedTableTagToLabel.type === FieldType.Array) {
            for (let i = 1; i < this.state.selectedTableTagBody.length; i++) {
                selectedTableTagBody.push(undefined)
            }
        }
        for (let i = 0; i < selectedTableTagBody.length; i++) {
            selectedTableTagBody[i] = new Array(columnKeys.length);
        }

        const tagAssets = clone()(this.state.selectedAsset.regions).filter((region) => region.tags[0] === selectedTableTagToLabel.name) as ITableRegion[];
        tagAssets.forEach((region => {
            let rowIndex: number;
            if (selectedTableTagToLabel.type === FieldType.Array) {
                rowIndex = Number(region.rowKey.slice(1));
            } else {
                rowIndex = rowKeys.findIndex(rowKey => rowKey.fieldKey === region.rowKey)
            }
            for (let i = selectedTableTagBody.length; i <= rowIndex; i++) {
                selectedTableTagBody.push(new Array(columnKeys.length));
            }
            const colIndex = columnKeys.findIndex(colKey => colKey.fieldKey === region.columnKey)
            if (selectedTableTagBody[rowIndex][colIndex] != null) {
                selectedTableTagBody[rowIndex][colIndex].push(region)
            } else {
                selectedTableTagBody[rowIndex][colIndex] = [region]
            }
        }));

        this.setState({
            selectedTableTagToLabel,
            selectedTableTagBody,
        }, () => {

            this.setTagInputMode(tagInputMode);
        });

    }

    private addRowToDynamicTable = () => {
        const selectedTableTagBody = clone()(this.state.selectedTableTagBody)
        selectedTableTagBody.push(Array(this.state.selectedTableTagToLabel.definition.fields.length));
        this.setState({ selectedTableTagBody });
    }

    private handleTableCellClick = (rowIndex: number, columnIndex: number) => {
        if (!this.state.selectedRegions || this.state.selectedRegions.length === 0) {
            return;
        }

        if (this.state?.selectedTableTagBody?.[rowIndex]?.[columnIndex]?.length > 0) {
            const selectionRegionCatagory = this.state.selectedRegions[0].category;
            const cellCatagory = this.state.selectedTableTagBody[rowIndex][columnIndex][0].category;
            if (selectionRegionCatagory !== cellCatagory && (selectionRegionCatagory === FeatureCategory.DrawnRegion || cellCatagory === FeatureCategory.DrawnRegion)) {
                this.replaceConfirmRef.current.open(this.state.selectedTableTagToLabel, rowIndex, columnIndex);
                return;
            }
        }

        this.onTableTagClicked(this.state.selectedTableTagToLabel, rowIndex, columnIndex);
    }

    private handleTableCellMouseEnter = (regions) => {
        this.setState({ highlightedTableCellRegions: regions });
    }

    private handleTableCellMouseLeave = () => {
        this.setState({ highlightedTableCellRegions: null });
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
        this.resizeCanvas();
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

    private onTableTagClicked = (tag: ITag, rowIndex: number, columnIndex: number): void => {
        this.setState({
            selectedTag: tag.name,
            lockedTags: [],
        }, () => this.canvas.current.applyTag(tag.name, rowIndex, columnIndex));
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
        if (tag.type === FieldType.Object || tag.type === FieldType.Array) {
            const assetUpdates = await this.props.actions.reconfigureTableTag(this.props.project, tag.name, newTag.name, newTag.type, newTag.format, (newTag as ITableTag).visualizationHint, undefined, undefined, undefined, undefined);
            const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);
            if (selectedAsset) {
                this.setState({
                    selectedAsset,
                    selectedTableTagToLabel: null,
                    selectedTableTagBody: null,
                }, () => {
                    this.canvas.current.temp();
                });
            }
        } else {
            const assetUpdates = await this.props.actions.updateProjectTag(this.props.project, tag, newTag);
            const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);

            if (selectedAsset) {
                if (selectedAsset) {
                    this.setState({ selectedAsset });
                }
            }
        }
        this.renameTagConfirm.current.close();
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
    private confirmTagDeleted = (tagName: string, tagType: FieldType, tagFormat: FieldFormat): void => {
        this.deleteTagConfirm.current.open(tagName, tagType, tagFormat);
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
    private onTagDeleted = async (tagName: string, tagType: FieldType, tagFormat: FieldFormat): Promise<void> => {
        const assetUpdates = await this.props.actions.deleteProjectTag(this.props.project, tagName, tagType, tagFormat);

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
        if (index >= 0 && index < tags.length && (tags[index].type !== FieldType.Array || tags[index].type !== FieldType.Object)) {
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
        const selection = this.canvas?.current?.getSelectedRegions();

        if (tag && selection.length) {
            const { format, type, documentCount, name } = tag;
            const tagCategory = getTagCategory(tag.type);
            const category = selection[0].category;
            const labels = this.state.selectedAsset.labelData?.labels;
            const isTagLabelTypeDrawnRegion = this.tagInputRef.current.labelAssignedDrawnRegion(labels, tag.name);
            const labelAssigned = this.tagInputRef.current.labelAssigned(labels, name);

            if (labelAssigned && ((category === FeatureCategory.DrawnRegion) !== isTagLabelTypeDrawnRegion)) {
                if (isTagLabelTypeDrawnRegion) {
                    toast.warn(interpolate(strings.tags.warnings.notCompatibleWithDrawnRegionTag, { otherCategory: category }));
                } else if (tagCategory === FeatureCategory.Checkbox) {
                    toast.warn(interpolate(strings.tags.warnings.notCompatibleWithDrawnRegionTag, { otherCategory: FeatureCategory.Checkbox }));
                } else {
                    toast.warn(interpolate(strings.tags.warnings.notCompatibleWithDrawnRegionTag, { otherCategory: FeatureCategory.Text }));
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
        assetMetadata = _.cloneDeep(assetMetadata);
        const initialState = assetMetadata.asset.state;

        const asset = { ...assetMetadata.asset };

        if (this.isTaggableAssetType(asset)
            && asset.state !== AssetState.NotVisited
            && asset.labelingState !== AssetLabelingState.AutoLabeled
            && asset.labelingState !== AssetLabelingState.AutoLabeledAndAdjusted) {
            const hasLabels = _.get(assetMetadata, "labelData.labels.length", 0) > 0;
            const hasTableLabels = _.get(assetMetadata, "labelData.tableLabels.length", 0) > 0;

            if (hasLabels && assetMetadata.labelData.labels.findIndex(item => item?.value?.length > 0) >= 0) {
                asset.state = AssetState.Tagged
            } else if (hasTableLabels && assetMetadata.labelData.tableLabels.findIndex(item => item.labels?.length > 0) >= 0) {
                asset.state = AssetState.Tagged
            } else {
                asset.state = AssetState.Visited;
            }
        }

        // Only update asset metadata if state changes or is different
        if (initialState !== asset.state || this.state.selectedAsset !== assetMetadata) {
            if (JSON.stringify(assetMetadata.labelData) !== JSON.stringify(this.state.selectedAsset.labelData)) {
                await this.updatedAssetMetadata(assetMetadata);
            }

            assetMetadata.asset = asset;

            const newMeta = await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);

            if (this.props.project.lastVisitedAssetId === asset.id) {
                // Get regions from label data since meta data will not have regions when loaded.
                newMeta.regions = this.canvas.current?.convertLabelDataToRegions(newMeta.labelData) || [];
                this.setState({ selectedAsset: newMeta });
            }
            if (this.compareAssetLabelsWithProjectTags(assetMetadata.labelData?.labels, this.props.project.tags)) {
                await this.props.actions.updateProjectTagsFromFiles(this.props.project, assetMetadata.asset.name);
            }
        }

        // Find and update the root asset in the internal state
        // This forces the root assets that are displayed in the sidebar to
        // accurately show their correct state (not-visited, visited or tagged)
        this.setState((state) => {
            const assets = [...state.assets];
            const assetIndex = assets.findIndex((a) => a.id === asset.id);
            if (assetIndex > -1) {
                assets[assetIndex] = {
                    ...asset,
                };
            }
            return { assets, isValid: true };
        }, () => {
            this.handleLabelTable();
        });
        // Workaround for if component is unmounted
        if (!this.isUnmount) {
            this.props.appTitleActions.setTitle(`${this.props.project.name} - [ ${asset.name} ]`);
        }
    }

    private onAssetLoaded = (asset: IAsset, contentSource: ContentSource) => {
        this.setState((preState) => {
            const assets: IAsset[] = [...preState.assets];
            const assetIndex = assets.findIndex((item) => item.id === asset.id);
            if (assetIndex > -1) {
                const item = { ...assets[assetIndex] };
                item.cachedImage = (contentSource as HTMLImageElement).src;
                assets[assetIndex] = item;
                return { assets };
            }
        });
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
    private onRegionDoubleClick = (region: IRegion) => {
        if (region.tags?.length > 0) {
            this.tagInputRef.current.focusTag(region.tags[0]);
        }
    }

    private onTagsChanged = async (tags) => {
        const project = {
            ...this.props.project,
            tags,
        };
        await this.props.actions.saveProject(project, true, false);
    }

    private onPageLoaded = async (pageNumber: number) => {
        this.setState({ pageNumber });
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
        if (this.state.isRunningAutoLabelings) {
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

        // Get regions from label data since meta data will not have regions when loaded.
        assetMetadata.regions = this.canvas.current?.convertLabelDataToRegions(assetMetadata.labelData) || [];

        this.setState({
            tableToView: null,
            tableToViewId: null,
            selectedAsset: assetMetadata,
        }, async () => {
            await this.onAssetMetadataChanged(assetMetadata);
            await this.props.actions.saveProject(this.props.project, false, false);
        });
    }

    private reconfigureTableConfirm = (originalTagName: string, tagName: string, tagType: FieldType.Array | FieldType.Object, tagFormat: FieldFormat, visualizationHint: TableVisualizationHint, deletedColumns: ITableConfigItem[], deletedRows: ITableConfigItem[], newRows: ITableConfigItem[], newColumns: ITableConfigItem[]) => {
        this.setState({ reconfigureTableConfirm: true });
        this.reconfigTableConfirm.current.open(originalTagName, tagName, tagType, tagFormat, visualizationHint, deletedColumns, deletedRows, newRows, newColumns);
    }

    private reconfigureTable = async (originalTagName: string, tagName: string, tagType: FieldType, tagFormat: FieldFormat, visualizationHint: TableVisualizationHint, deletedColumns: ITableConfigItem[], deletedRows: ITableConfigItem[], newRows: ITableConfigItem[], newColumns: ITableConfigItem[]) => {
        const assetUpdates = await this.props.actions.reconfigureTableTag(this.props.project, originalTagName, tagName, tagType, tagFormat, visualizationHint, deletedColumns, deletedRows, newRows, newColumns);
        const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);
        if (selectedAsset) {
            selectedAsset.regions = this.canvas.current?.convertLabelDataToRegions(selectedAsset.labelData) || [];
            this.setState({
                selectedAsset,
                selectedTableTagToLabel: null,
                selectedTableTagBody: null,
            }, () => {
                this.canvas.current.temp();
            });
        }
        this.reconfigTableConfirm.current?.close();
        this.setState({ tagInputMode: TagInputMode.Basic, reconfigureTableConfirm: false }, () => this.resizeCanvas());
        this.resizeCanvas();
    }

    private loadProjectAssets = async (): Promise<void> => {
        if (this.loadingProjectAssets) {
            return;
        }

        this.loadingProjectAssets = true;
        const replacer = (key, value) => {
            if (key === "cachedImage") {
                return undefined;
            }
            else {
                return value;
            }
        }
        try {
            const assets = _(await this.props.actions.loadAssets(this.props.project))
                .uniqBy((asset) => asset.id)
                .value();
            if (this.state.assets.length === assets.length
                && JSON.stringify(this.state.assets, replacer) === JSON.stringify(assets)) {
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
                this.isOCROrAutoLabelingBatchRunning = true;
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
                                this.updateAssetOCRAndAutoLabelingState({ id: asset.id, isRunningOCR: true });
                                const ocrResult = await ocrService.getRecognizedText(asset.path, asset.name, asset.mimeType, undefined, runForAll);
                                if (ocrResult) {
                                    this.updateAssetOCRAndAutoLabelingState({ id: asset.id, isRunningOCR: false });
                                    await this.props.actions.refreshAsset(this.props.project, asset.name);
                                }
                            } catch (err) {
                                this.updateAssetOCRAndAutoLabelingState({ id: asset.id, isRunningOCR: false });
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
                this.isOCROrAutoLabelingBatchRunning = false;
            }
        }
    }
    private runAutoLabelingOnNextBatch = async (batchSize: number) => {
        if (this.isBusy()) {
            return;
        }
        const { project } = this.props;
        const predictService = new PredictService(project);
        const assetService = new AssetService(project);

        if (this.state.assets) {
            this.setState({ isRunningAutoLabelings: true });
            const unlabeledAssetsBatch = [];
            for (let i = 0; i < this.state.assets.length && unlabeledAssetsBatch.length < batchSize; i++) {
                const asset = this.state.assets[i];
                if (asset.state === AssetState.NotVisited || asset.state === AssetState.Visited) {
                    unlabeledAssetsBatch.push(asset);
                }
            }
            const allAssets = _.cloneDeep(this.props.project.assets);
            try {
                this.isOCROrAutoLabelingBatchRunning = true;
                await throttle(constants.maxConcurrentServiceRequests,
                    unlabeledAssetsBatch,
                    async (asset) => {
                        try {
                            this.updateAssetOCRAndAutoLabelingState({ id: asset.id, isRunningAutoLabeling: true });
                            const predictResult = await predictService.getPrediction(asset.path);
                            const assetMetadata = await assetService.getAssetPredictMetadata(asset, predictResult);
                            await assetService.uploadPredictResultAsOrcResult(asset, predictResult);
                            assetMetadata.asset.isRunningAutoLabeling = false;
                            await this.onAssetMetadataChanged(assetMetadata);
                            allAssets[asset.id] = assetMetadata.asset;
                            await this.props.actions.updatedAssetMetadata(this.props.project, assetMetadata);
                        } catch (err) {
                            this.updateAssetOCRAndAutoLabelingState({ id: asset.id, isRunningOCR: false, isRunningAutoLabeling: false });
                            this.setState({
                                isError: true,
                                errorTitle: err.title,
                                errorMessage: err.message
                            })
                        }
                    }
                );
            } finally {
                await this.props.actions.saveProject({ ...this.props.project, assets: allAssets }, true, false);
                this.setState({ isRunningAutoLabelings: false });
                this.isOCROrAutoLabelingBatchRunning = false;
            }
        }
    }
    private compareAssetLabelsWithProjectTags = (labels: ILabel[], tags: ITag[]): boolean => {
        if (!labels || labels.length === 0) {
            return false;
        }
        const intersectionTags = _.intersectionWith(labels, tags, (l, t) => l.label === t.name);
        return intersectionTags?.length < labels.length;
    }

    private updateAssetOCRAndAutoLabelingState = (newState: {
        id: string,
        isRunningOCR?: boolean,
        isRunningAutoLabeling?: boolean,
    }) => {
        this.setState((state) => {
            const assets = state.assets.map((asset) => {
                if (asset.id === newState.id) {
                    const updatedAsset = { ...asset, isRunningOCR: newState.isRunningOCR || false };
                    if (newState.isRunningAutoLabeling !== undefined) {
                        updatedAsset.isRunningAutoLabeling = newState.isRunningAutoLabeling;
                    }
                    return updatedAsset;
                } else {
                    return asset;
                }
            });
            return {
                assets
            }
        }, () => {
            if (this.state.selectedAsset?.asset?.id === newState.id) {
                const asset = this.state.assets.find((asset) => asset.id === newState.id);
                if (this.state.selectedAsset && newState.id === this.state.selectedAsset.asset.id) {
                    if (asset) {
                        this.setState({
                            selectedAsset: { ...this.state.selectedAsset, asset: { ...asset } },
                        });
                    }
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
            const projectAsset = _.get(this.props, `project.assets[${asset.id}]`, null);
            if (projectAsset) {
                if (asset.state !== projectAsset.state || asset.labelingState !== projectAsset.labelingState) {
                    needUpdate = true;
                    asset.state = projectAsset.state;
                    asset.labelingState = projectAsset.labelingState;
                }
            }
        });

        if (needUpdate) {
            this.setState({ assets: updatedAssets });
            if (this.state.selectedAsset) {
                const asset = this.state.selectedAsset.asset;
                const currentAsset = _.get(this.props, `project.assets[${this.state.selectedAsset.asset.id}]`, null);
                if (asset.state !== currentAsset.state || asset.labelingState !== currentAsset.labelingState) {
                    this.updateSelectAsset(currentAsset);
                }
            }
        }
    }

    private updateSelectAsset = async (asset: IAsset) => {
        const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, asset);

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.warn("Error computing asset size");
        }
        assetMetadata.regions = [...this.state.selectedAsset.regions];
        this.setState({
            tableToView: null,
            tableToViewId: null,
            selectedAsset: assetMetadata,
        }, async () => {
            await this.onAssetMetadataChanged(assetMetadata);
            await this.props.actions.saveProject(this.props.project, false, false);
        });
    }
    private onLabelEnter = (label: ILabel) => {
        this.setState({ hoveredLabel: label });
    }

    private onLabelDoubleClicked = (label: ILabel) => {
        this.canvas.current.focusOnLabel(label);
    }

    private onLabelLeave = (label: ILabel) => {
        this.setState({ hoveredLabel: null });
    }

    private onCanvasRunningOCRStatusChanged = (ocrStatus: OcrStatus) => {
        if (ocrStatus === OcrStatus.done && this.state.selectedAsset?.asset?.state === AssetState.NotVisited) {
            const allAssets: { [index: string]: IAsset } = _.cloneDeep(this.props.project.assets);
            const asset = Object.values(allAssets).find(item => item.id === this.state.selectedAsset?.asset?.id);
            if (asset) {
                asset.state = AssetState.Visited;
                Promise.all([this.props.actions.saveProject({ ...this.props.project, assets: allAssets }, false, false)]);
            }
        }
        this.setState({ isCanvasRunningOCR: ocrStatus === OcrStatus.runningOCR });
    }
    private onCanvasRunningAutoLabelingStatusChanged = (isCanvasRunningAutoLabeling: boolean) => {
        this.setState({ isCanvasRunningAutoLabeling });
    }
    private onFocused = () => {
        if (!this.isOCROrAutoLabelingBatchRunning) {
            this.loadProjectAssets();
        }
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
        const rowDocumentCountDifference = {};
        const updatedRowLabels = {};
        const currentRowLabels = {};
        const columnDocumentCountDifference = {};
        const updatedColumnLabels = {};
        const currentColumnLabels = {};
        assetMetadata?.labelData?.tableLabels?.forEach((table) => {
            updatedRowLabels[table.tableKey] = {};
            updatedColumnLabels[table.tableKey] = {};
            table.labels.forEach((label) => {
                updatedRowLabels[table.tableKey][label.rowKey] = true;
                updatedColumnLabels[table.tableKey][label.columnKey] = true;
            })
        });

        this.state.selectedAsset?.labelData?.tableLabels?.forEach((table) => {
            currentRowLabels[table.tableKey] = {};
            currentColumnLabels[table.tableKey] = {};
            table.labels.forEach((label) => {
                currentRowLabels[table.tableKey][label.rowKey] = true;
                currentColumnLabels[table.tableKey][label.columnKey] = true;
            })
        });


        Object.keys(currentColumnLabels).forEach((table) => {
            Object.keys(currentColumnLabels[table]).forEach((columnKey) => {
                if (!updatedColumnLabels?.[table]?.[columnKey]) {
                    if (!(table in columnDocumentCountDifference)) {
                        columnDocumentCountDifference[table] = {};
                    }
                    columnDocumentCountDifference[table][columnKey] = -1;
                }
            });
        });

        Object.keys(updatedColumnLabels).forEach((table) => {
            Object.keys(updatedColumnLabels[table]).forEach((columnKey) => {
                if (!currentColumnLabels?.[table]?.[columnKey]) {
                    if (!(table in columnDocumentCountDifference)) {
                        columnDocumentCountDifference[table] = {};
                    }
                    columnDocumentCountDifference[table][columnKey] = 1;
                }
            });
        });

        Object.keys(currentRowLabels).forEach((table) => {
            Object.keys(currentRowLabels[table]).forEach((rowKey) => {
                if (!updatedRowLabels?.[table]?.[rowKey]) {
                    if (!(table in rowDocumentCountDifference)) {
                        rowDocumentCountDifference[table] = {};
                    }
                    rowDocumentCountDifference[table][rowKey] = -1;
                }
            });
        });

        Object.keys(updatedRowLabels).forEach((table) => {
            Object.keys(updatedRowLabels[table]).forEach((rowKey) => {
                if (!currentRowLabels?.[table]?.[rowKey]) {
                    if (!(table in rowDocumentCountDifference)) {
                        rowDocumentCountDifference[table] = {};
                    }
                    rowDocumentCountDifference[table][rowKey] = 1;
                }
            });
        });

        const assetDocumentCountDifference = {};
        const updatedAssetLabels = {};
        const currentAssetLabels = {};
        assetMetadata.labelData?.labels?.forEach((label) => {
            updatedAssetLabels[label.label] = true;
        });
        this.state.selectedAsset.labelData?.labels?.forEach((label) => {
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
        await this.props.actions.updatedAssetMetadata(this.props.project, assetDocumentCountDifference, columnDocumentCountDifference, rowDocumentCountDifference);
    }
}
