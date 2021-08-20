// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { ReactElement } from "react";
import { connect } from "react-redux";
import url from "url";
import { RouteComponentProps } from "react-router-dom";
import allSettled from "promise.allsettled"
import { APIVersionPatches, IProject, IConnection, IAppSettings, IApplicationState, AppError, ErrorCode, IRecentModel } from "../../../../models/applicationState";
import { constants } from "../../../../common/constants";
import ServiceHelper from "../../../../services/serviceHelper";
import {
    IColumn,
    Fabric,
    DetailsList,
    Selection, SelectionMode,
    DetailsListLayoutMode, Customizer,
    ICustomizations,
    Spinner,
    SpinnerSize,
    FontIcon,
    IDetailsList,
    PrimaryButton,
    Sticky,
    IDetailsHeaderProps,
    IRenderFunction,
    IDetailsColumnRenderTooltipProps,
    TooltipHost,
    StickyPositionType,
    ScrollablePane,
    ScrollbarVisibility,
    IDetailsRowProps
} from "@fluentui/react";
import "./modelCompose.scss";
import { strings, interpolate } from "../../../../common/strings";
import { getDarkGreyTheme, getDefaultDarkTheme } from "../../../../common/themes";
import { ModelComposeCommandBar } from "./composeCommandBar";
import { bindActionCreators } from "redux";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import ComposeModelView from "./composeModelView";
import { ViewSelection } from "./viewSelection";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import { toast } from 'react-toastify';
import { getAPIVersion } from "../../../../common/utils";
import Alert from "../../common/alert/alert";

export interface IModelComposePageProps extends RouteComponentProps, React.Props<ModelComposePage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IModelComposePageState {
    modelList: IModel[];
    nextLink: string;
    recentModelsList: IModel[];
    columns: IColumn[];
    selectionDetails: string;
    isModalSelection: boolean;
    isCompactMode: boolean;
    isComposing: boolean;
    composeModelId: string[];
    isLoading: boolean;
    refreshFlag: boolean;
    hasText: boolean;

    isError?: boolean;
    errorTitle?: string;
    errorMessage?: string;
}

export interface IModel {
    attributes?: {
        isComposed: boolean;
    };
    key?: string;
    modelId: string;
    createdDateTime: string;
    lastUpdatedDateTime?: string;
    status?: string;
    composedTrainResults?: [];
    description?: string;
}
export interface IComposedModelInfo {
    id: string,
    description?: string,
    createdDateTime?: string;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        connections: state.connections,
        appSettings: state.appSettings,
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
        appTitleActions: bindActionCreators(appTitleActions, dispatch),
    }
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ModelComposePage extends React.Component<IModelComposePageProps, IModelComposePageState> {
    private selection: Selection;
    private allModels: IModel[];
    private refreshClicks: boolean;
    private selectedItems: IModel[] = [];
    private cannotBeIncludedItems: IModel[] = [];
    private listRef = React.createRef<IDetailsList>();
    private composeModalRef: React.RefObject<ComposeModelView> = React.createRef();

    constructor(props) {
        super(props);
        const columns: IColumn[] = [
            {
                key: "column1",
                name: strings.modelCompose.column.icon.name,
                className: "composed-icon-cell",
                isIconOnly: true,
                ariaLabel: strings.modelCompose.columnAria.icon,
                fieldName: "icon",
                minWidth: 20,
                maxWidth: 20,
                isResizable: true,
                onRender: this.renderComposedIcon,
                headerClassName: "list-header",
            },
            {
                key: "column2",
                name: strings.modelCompose.column.id.headerName,
                fieldName: strings.modelCompose.column.id.fieldName,
                minWidth: 250,
                maxWidth: 250,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => <span>{model.modelId}</span>,
            },
            {
                key: "column3",
                name: strings.modelCompose.column.description.headerName,
                fieldName: strings.modelCompose.column.description.fieldName,
                minWidth: 150,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => <span>{model.description}</span>,
            },
            {
                key: "column4",
                name: strings.modelCompose.column.status.headerName,
                fieldName: strings.modelCompose.column.status.fieldName,
                minWidth: 50,
                maxWidth: 100,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => <span>{model.status}</span>
            },
            {
                key: "column5",
                name: strings.modelCompose.column.created.headerName,
                fieldName: strings.modelCompose.column.created.fieldName,
                minWidth: 150,
                maxWidth: 175,
                isResizable: true,
                isSorted: false,
                isSortedDescending: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => <span>{new Date(model.createdDateTime).toLocaleString()}</span>,
            },
            {
                key: "column6",
                name: strings.modelCompose.column.lastUpdated.headerName,
                fieldName: strings.modelCompose.column.lastUpdated.fieldName,
                minWidth: 175,
                maxWidth: 175,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => <span>{new Date(model.lastUpdatedDateTime).toLocaleString()}</span>,
            },
        ];

        this.state = {
            modelList: [],
            nextLink: "*",
            recentModelsList: [],
            columns,
            selectionDetails: this.handleSelection(),
            isModalSelection: false,
            isCompactMode: false,
            isComposing: false,
            composeModelId: [],
            isLoading: false,
            refreshFlag: false,
            hasText: false,
        };

        this.selection = new Selection({
            onSelectionChanged: () => {
                this.setState({
                    selectionDetails: this.handleSelection(),
                });
            },
        });
    }

    onRenderRow = (props: IDetailsRowProps, defaultRender?: IRenderFunction<IDetailsRowProps>): JSX.Element => {
        const modelNotReady = props.item.status !== constants.statusCodeReady;
        return defaultRender && defaultRender({ ...props, className: `${modelNotReady ? "model-not-ready" : ""}` })
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }

        if (this.props.project) {
            this.getModelList();
        }
        document.title = strings.modelCompose.title + " - " + strings.appName;
    }

    public componentDidUpdate(prevProps, prevState) {
        if ((prevState.isComposing && !this.state.isComposing) || this.state.refreshFlag) {
            if (this.props.project) {
                this.getModelList();
            }
            this.refreshClicks = false;
            this.setState({
                refreshFlag: false,
            });
        }
    }

    public render() {
        const { modelList, isCompactMode, columns } = this.state;
        const dark: ICustomizations = {
            settings: {
                theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };
        const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props, defaultRender) => {
            if (!props) {
                return null;
            }
            const onRenderColumnHeaderTooltip: IRenderFunction<IDetailsColumnRenderTooltipProps> =
                (tooltipHostProps) => (
                    <TooltipHost {...tooltipHostProps} />
                );
            return <Sticky
                stickyPosition={StickyPositionType.Header}
                isScrollSynced>
                {defaultRender!({ ...props, onRenderColumnHeaderTooltip })}
            </Sticky>
                ;
        };

        return <>
            <Fabric className="modelCompose-page">
                <Customizer {...dark}>
                    <div className="commandbar-container">
                        <ModelComposeCommandBar
                            composedModels={this.state.composeModelId}
                            allModels={this.allModels}
                            isComposing={this.state.isComposing}
                            isLoading={this.state.isLoading}
                            hasText={this.state.hasText}
                            handleCompose={this.onComposeButtonClick}
                            handleRefresh={this.onRefreshButtonClick}
                            filterTextChange={this.onTextChange}
                        />
                    </div>
                    <div>
                        <ScrollablePane
                            className="pane-container"
                            scrollbarVisibility={ScrollbarVisibility.auto}>
                            <ViewSelection
                                selection={this.selection}
                                items={this.allModels}
                                columns={this.state.columns}
                                isComposing={this.state.isComposing}
                                refreshFlag={this.state.refreshFlag}
                                passSelectedItems={this.passSelectedItems}>
                                {this.state.isComposing ?
                                    <Spinner
                                        label={strings.modelCompose.composing}
                                        className="compose-spinner"
                                        theme={getDefaultDarkTheme()}
                                        size={SpinnerSize.large}>
                                    </Spinner> :
                                    <div>
                                        <DetailsList
                                            checkButtonAriaLabel={strings.modelCompose.modelsList.checkButtonAria}
                                            ariaLabelForSelectAllCheckbox={strings.modelCompose.modelsList.checkAllButtonAria}
                                            componentRef={this.listRef}
                                            className="models-list"
                                            items={modelList}
                                            compact={isCompactMode}
                                            columns={columns}
                                            getKey={this.getKey}
                                            setKey="multiple"
                                            selectionMode={SelectionMode.multiple}
                                            layoutMode={DetailsListLayoutMode.justified}
                                            isHeaderVisible={true}
                                            selection={this.selection}
                                            selectionPreservedOnEmptyClick={true}
                                            onItemInvoked={this.onItemInvoked}
                                            onRenderDetailsHeader={onRenderDetailsHeader}
                                            onRenderRow={this.onRenderRow}>
                                        </DetailsList>
                                        {this.state.nextLink && this.state.nextLink !== "*" && !this.state.hasText &&
                                            <div className="next-page-container">
                                                {
                                                    this.state.isLoading ?
                                                        <Spinner
                                                            label={strings.modelCompose.loading}
                                                            className="commandbar-spinner"
                                                            labelPosition="right"
                                                            theme={getDefaultDarkTheme()}
                                                            size={SpinnerSize.small}>
                                                        </Spinner>
                                                        :
                                                        <PrimaryButton
                                                            className="next-page-button"
                                                            onClick={this.getNextPage}>
                                                            <FontIcon iconName="Down" style={{ padding: "5px" }}>
                                                            </FontIcon>
                                                            <span>Load next page</span>
                                                        </PrimaryButton>
                                                }
                                            </div>}
                                    </div>
                                }
                            </ViewSelection>
                        </ScrollablePane>
                    </div>
                    <ComposeModelView
                        ref={this.composeModalRef}
                        onComposeConfirm={this.onComposeConfirm}
                        addToRecentModels={this.addToRecentModels}
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
                </Customizer>
            </Fabric>
            <PreventLeaving
                when={this.state.isComposing}
                message={"A composing operation is currently in progress, are you sure you want to leave?"}
            />
        </>
    }

    private getKey = (item: any, index?: number): string => {
        return item.key;
    }

    private onItemInvoked = async (model: IModel, index: number, ev: Event) => {
        const composedModelInfo: IModel = {
            modelId: model.modelId,
            description: model.description,
            createdDateTime: model.createdDateTime,
            composedTrainResults: []
        };
        this.composeModalRef.current.open([composedModelInfo], false, false);

        if (model.attributes && model.attributes.isComposed) {
            const inclModels = model.composedTrainResults ?
                model.composedTrainResults
                : (await this.getModelById(model.modelId)).composedTrainResults;

            for (const i of Object.keys(inclModels)) {
                let _model: IModel;
                let modelInfo: IComposedModelInfo;
                try {
                    _model = await this.getModelById(inclModels[i].modelId);
                    modelInfo = {
                        id: _model.modelId,
                        description: _model.description,
                        createdDateTime: _model.createdDateTime,
                    };
                    composedModelInfo.composedTrainResults.push(modelInfo as never);
                } catch (e) {
                    modelInfo = {
                        id: inclModels[i].modelId,
                        description: strings.modelCompose.errors.noInfoAboutModel,
                    };
                    composedModelInfo.composedTrainResults.push(modelInfo as never);
                }
            }
            this.composeModalRef.current.getItems(composedModelInfo);
        } else if (model.status === constants.statusCodeReady) {
            this.composeModalRef.current.getItems(composedModelInfo);
        }
    }

    private returnReadyModels = (modelList) => modelList.filter((model: IModel) => model.status === constants.statusCodeReady);

    private getModelList = async () => {
        try {
            this.setState({ isLoading: true });

            let recentModels: IModel[] = [];
            if (this.props.project?.recentModelRecords?.length) {
                recentModels = await this.getRecentModels();
            }
            const res = await this.getModels();

            const apiVersion = getAPIVersion(this.props.project?.apiVersion);
            let models = this.returnReadyModels(res.data.value)
            if (apiVersion === APIVersionPatches.patch5) {
                models = res.data.value;
                models.forEach((Item) => {
                    Item.status = constants.statusCodeReady
                });
                const newColumns = this.state.columns.filter((item) => 'column4,column6'.indexOf(item.key) === -1);
                this.setState({
                    columns: newColumns
                });
            }

            const link = res.data.nextLink;

            const recentModelIds = this.getRecentModelIds(recentModels);
            models = models.filter((model) => recentModelIds.indexOf(model.modelId) === -1);

            this.allModels = recentModels.concat(models);
            this.setState({
                modelList: this.allModels,
                nextLink: link,
                recentModelsList: recentModels,
            }, () => {
                this.setState({
                    isLoading: false,
                });
            });
        } catch (error) {
            this.setState({
                isError: true,
                errorTitle: error.title,
                errorMessage: error.message,
            });
        }
    }

    private buildUpdatedProject = (composedModel: object): IProject => {
        const newTrainRecord = {
            modelInfo: {
                createdDateTime: composedModel["result"]["createdDateTime"],
                modelId: composedModel["result"]["modelId"],
                description: composedModel["result"]["description"],
                isComposed: true,
            },
            composedTrainResults: this.getComposedTrainResults(composedModel["result"]["docTypes"])
        } as IRecentModel;
        const recentModelRecords: IRecentModel[] = this.props.project.recentModelRecords ?
            [...this.props.project.recentModelRecords] : [];
        recentModelRecords.unshift(newTrainRecord);
        if (recentModelRecords.length > constants.recentModelRecordsCount) {
            recentModelRecords.pop();
        }

        return {
            ...this.props.project,
            recentModelRecords,
            predictModelId: newTrainRecord.modelInfo.modelId,
        };
    }

    private getRecentModels = async (): Promise<IModel[]> => {
        const recentModelsList: IModel[] = [];
        const recentModelRequest = await allSettled(this.props.project.recentModelRecords.map(async (model) => {
            return this.getModelById(model.modelInfo.modelId);
        }))
        recentModelRequest.forEach((recentModelRequest) => {
            if (recentModelRequest.status === "fulfilled") {
                recentModelsList.push(recentModelRequest.value);
            }
        });
        return recentModelsList;
    }

    private getNextPage = async () => {
        try {
            if (this.allModels.length <= 5000) {
                if (this.state.nextLink.length !== 0) {
                    this.setState({
                        isLoading: true,
                    });
                    const nextPage = await this.getModelsFromNextLink(this.state.nextLink);
                    const currentList = this.state.modelList;
                    const recentModelIds = this.getRecentModelIds(this.state.recentModelsList);

                    let nextPageList = nextPage.nextList;
                    nextPageList = nextPageList.filter((model) => recentModelIds.indexOf(model.modelId) === -1);
                    const appendedList = currentList.concat(nextPageList);
                    const currerntlySortedColumn: IColumn = this.state.columns.find((column) => column.isSorted);
                    const appendedAndSortedList = this.copyAndSort(appendedList, currerntlySortedColumn?.fieldName, currerntlySortedColumn?.isSortedDescending);
                    this.allModels = appendedAndSortedList;
                    this.setState({
                        modelList: appendedAndSortedList,
                        nextLink: nextPage.nextLink,
                    }, () => {
                        this.setState({
                            isLoading: false,
                        });
                    });
                }
            }
        } catch (error) {
            this.setState({
                isError: true,
                errorTitle: error.title,
                errorMessage: error.message,
            });
        }
    }

    private getRecentModelIds = (recentModels: IModel[]) => {
        return recentModels.map((recentModel) => recentModel.modelId);
    }

    private getModelsFromNextLink = async (link: string) => {
        const baseURL = url.resolve(
            this.props.project.apiUriBase,
            link,
        );
        const config = {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "withCredentials": "true",
            },
        };

        try {
            const res = await ServiceHelper.getWithAutoRetry(
                baseURL,
                config,
                this.props.project.apiKey as string,
            );

            return {
                nextList: this.returnReadyModels(res.data.value),
                nextLink: res.data.nextLink,
            };
        } catch (err) {
            this.setState({
                isLoading: false,
            });

            ServiceHelper.handleServiceError({ ...err, endpoint: baseURL });
        }
    }

    private getModelById = async (modelId): Promise<IModel> => {
        const res = await this.getModels(modelId);
        const model: IModel = res.data;
        model.key = model.modelId;
        model.composedTrainResults = this.getComposedTrainResults(res.data.docTypes);
        model.status = constants.statusCodeReady;
        model.attributes = { isComposed: Object.keys(res.data.docTypes).length > 1}
        return model;
    }

    private async getModels(modelId?: string) {
        const baseURL = modelId === undefined ? url.resolve(
            this.props.project.apiUriBase,
            `formrecognizer/documentModels?${constants.apiVersionQuery}`,
        ) : url.resolve(
            this.props.project.apiUriBase,
            `formrecognizer/documentModels/${modelId}?${constants.apiVersionQuery}`,
        );

        const config = {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "withCredentials": "true",
            },
        };

        try {
            return await ServiceHelper.getWithAutoRetry(
                baseURL,
                config,
                this.props.project.apiKey as string,
            );
        } catch (err) {
            this.setState({
                isLoading: false,
            });
            ServiceHelper.handleServiceError({ ...err, endpoint: baseURL });
        }
    }

    private handleColumnClick = (event: React.MouseEvent<HTMLElement>, column: IColumn): void => {
        const { columns, modelList } = this.state;
        const newColumns: IColumn[] = columns.slice();
        const currColumn: IColumn = newColumns.find((col) => column.key === col.key);
        newColumns.forEach((newCol: IColumn) => {
            if (newCol === currColumn) {
                currColumn.isSortedDescending = !currColumn.isSortedDescending;
                currColumn.isSorted = true;
            } else {
                newCol.isSorted = false;
                newCol.isSortedDescending = true;
            }
        });
        const newList = this.copyAndSort(modelList, currColumn.fieldName!, currColumn.isSortedDescending);
        this.setState({
            columns: newColumns,
            modelList: newList,
        });
    }

    private copyAndSort(modelList: IModel[], columnKey: string, isSortedDescending?: boolean): IModel[] {
        if (!columnKey) {
            return modelList.slice();
        }

        const key = columnKey;
        if (key === strings.modelCompose.column.created.fieldName || key === strings.modelCompose.column.lastUpdated.fieldName) {
            return (modelList.slice(0)
                .sort((a, b): number => {
                    if (isSortedDescending) {
                        if ((new Date(a.createdDateTime)).getTime() < (new Date(b.createdDateTime)).getTime()) {
                            return 1;
                        } else {
                            return -1;
                        }
                    } else {
                        if ((new Date(a.createdDateTime)).getTime() > (new Date(b.createdDateTime)).getTime()) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }
                }));
        } else if (key === strings.modelCompose.column.description.fieldName) {
            return (
                modelList.slice(0).sort((a, b) => {
                    if (a.description && b.description) {
                        return isSortedDescending ? b.description.localeCompare(a.description) : -b.description.localeCompare(a.description)
                    } else if (a.description || b.description) {
                        if (a.description) {
                            return -1;
                        } else if (b.description) {
                            return 1;
                        }
                    }
                    return -1;
                })
            )
        } else {
            return (modelList.slice(0)
                .sort((a: IModel, b: IModel) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1)));
        }
    }

    private handleSelection = (): string => {
        return "item selected";
    }

    /** Handle filter when text changes in filter field */
    private onTextChange = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string): void => {
        this.setState({
            modelList: text ?
                this.allModels.filter(({ description, modelId }) => (modelId.indexOf(text.toLowerCase()) > -1) ||
                    (description !== undefined ? description.toLowerCase().indexOf(text.toLowerCase()) > -1 : false)) : this.allModels,
            hasText: text ? true : false,
        });
    }

    private onComposeButtonClick = () => {
        this.composeModalRef.current.open(this.selectedItems, this.cannotBeIncludedItems, true);
    }

    private onComposeConfirm = (composeModelName: string) => {
        this.setState({
            isComposing: true,
        });
        const selections = this.selectedItems;
        this.handleModelsCompose(selections, composeModelName);
    }

    private addToRecentModels = async (modelToAdd: IRecentModel) => {
        const recentModelRecords: IRecentModel[] = this.props.project.recentModelRecords ?
            [...this.props.project.recentModelRecords] : [];

        if (recentModelRecords.find((recentModel) => recentModel.modelInfo.modelId === modelToAdd.modelInfo.modelId)) {
            if (modelToAdd.modelInfo.description) {
                toast.success(interpolate(strings.modelCompose.modelView.recentModelsAlreadyContainsModel, { modelID: modelToAdd.modelInfo.description }));
            } else {
                toast.success(interpolate(strings.modelCompose.modelView.recentModelsAlreadyContainsModel, { modelID: modelToAdd.modelInfo.modelId }));
            }
            this.composeModalRef.current.close();
            return;
        }
        recentModelRecords.unshift({ ...modelToAdd } as IRecentModel);
        if (recentModelRecords.length > constants.recentModelRecordsCount) {
            recentModelRecords.pop();
        }

        const updatedProject = {
            ...this.props.project,
            recentModelRecords,
            predictModelId: modelToAdd.modelInfo.modelId,
        };
        this.composeModalRef.current.close();
        if (modelToAdd.modelInfo.description) {
            toast.success(interpolate(strings.modelCompose.modelView.addModelToRecentModels, { modelID: modelToAdd.modelInfo.description }));
        } else {
            toast.success(interpolate(strings.modelCompose.modelView.addModelToRecentModels, { modelID: modelToAdd.modelInfo.modelId }));
        }
        await this.props.actions.saveProject(updatedProject, false, false);
    }

    private passSelectedItems = (Items: any[]) => {
        const apiVersion = getAPIVersion(this.props.project?.apiVersion);
        if (apiVersion === APIVersionPatches.patch5) {
            this.selectedItems = Items;
        } else {
            this.cannotBeIncludedItems = Items.filter((item: IModel) => item.status !== constants.statusCodeReady);
            this.selectedItems = Items.filter((item: IModel) => item.status === constants.statusCodeReady);
        }
    }

    /**
     * Poll function to repeatedly check if request succeeded
     * @param func - function that will be called repeatedly
     * @param timeout - timeout
     * @param interval - interval
     */
    private poll = (func, timeout, interval): Promise<any> => {
        const endTime = Number(new Date()) + (timeout || 10000);
        interval = interval || 100;

        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then((response) => {
                if (response.data.status.toLowerCase() === constants.statusCodeSucceeded) {
                    resolve(response.data);
                } else if (response.data.status.toLowerCase() === constants.statusCodeFailed) {
                    toast.error(strings.modelCompose.errors.failedCompose, { autoClose: false });
                    this.setState({ isComposing: false });
                    return;
                } else if (Number(new Date()) < endTime) {
                    // If the request isn't succeeded and the timeout hasn't elapsed, go again
                    setTimeout(checkSucceeded, interval, resolve, reject);
                } else {
                    // Didn't succeeded after too much time, reject
                    reject(new Error("Timed out for creating composed model"));
                }
            });
        };

        return new Promise(checkSucceeded);
    }

    private async waitUntilModelIsReady(operationLocation: string): Promise<any> {
        const timeoutPerFileInMs = 1000;  // 1 second for each model
        const minimumTimeoutInMs = 300000;  // 5 minutes minimum waiting time  for each composing process
        const extendedTimeoutInMs = timeoutPerFileInMs * Object.keys(this.props.project.assets || []).length;
        const res = this.poll(() => {
            return ServiceHelper.getWithAutoRetry(
                operationLocation,
                { headers: { "cache-control": "no-cache" } },
                this.props.project.apiKey as string);
        }, Math.max(extendedTimeoutInMs, minimumTimeoutInMs), 1000);
        return res;
    }

    /** Handle the operation of composing a new model */
    private handleModelsCompose = async (selections: any[], name: string) => {
        setTimeout(async () => {
            try {
                const idList = [];
                selections.forEach((s) => idList.push(s.modelId));

                let payload;
                const apiVersion = getAPIVersion(this.props.project?.apiVersion);
                let link;
                if (apiVersion === APIVersionPatches.patch5) {
                    link = `/formrecognizer/documentModels:compose?${constants.apiVersionQuery}`
                    payload = {
                        modelId: name,
                        description: null,
                        componentModels: idList.map(item => {
                            return item = { modelId: item }
                        })
                    }
                } else {
                    link = interpolate(constants.apiModelsPath, { apiVersion }) + "/compose";
                    payload = {
                        modelIds: idList,
                        modelName: name,
                    };
                }
                const composeRes = await this.post(link, payload);
                const composedModel = await this.waitUntilModelIsReady(composeRes["headers"]["operation-location"]);

                const updatedProject = this.buildUpdatedProject(composedModel);
                await this.props.actions.saveProject(updatedProject, false, false);

                const newCols = this.state.columns;
                newCols.forEach((ncol) => {
                    ncol.isSorted = false;
                    ncol.isSortedDescending = true;
                });

                this.setState({
                    isComposing: false,
                    composeModelId: [composedModel["result"]["modelId"]],
                    columns: newCols,
                });
            } catch (error) {
                this.setState({
                    isComposing: false,
                })
                if (error.errorCode === ErrorCode.ModelNotFound) {
                    this.setState({
                        isError: true,
                        errorMessage: strings.modelCompose.limitQuantityComposedModel
                    })
                } else {
                    throw new AppError(ErrorCode.ModelNotFound, error.message);
                }
            }
        }, 5000);
    }

    private async post(link, payload): Promise<any> {
        const baseURL = url.resolve(
            this.props.project.apiUriBase,
            link,
        );

        try {
            return await ServiceHelper.postWithAutoRetry(
                baseURL,
                payload,
                {},
                this.props.project.apiKey as string,
            );
        } catch (err) {
            ServiceHelper.handleServiceError({ ...err, endpoint: baseURL });
        }
    }

    private onRefreshButtonClick = () => {
        if (!this.refreshClicks) {
            this.refreshClicks = true;
            setTimeout(() => {
                if (!this.state.refreshFlag && this.refreshClicks) {
                    const newCols = this.state.columns;
                    newCols.forEach((ncol) => {
                        ncol.isSorted = false;
                        ncol.isSortedDescending = true;
                    });
                    this.setState({
                        refreshFlag: true,
                        columns: newCols,
                    });
                }
            }, 1);
        }
    }

    private renderComposedIcon = (model: IModel): ReactElement => {
        if (model.attributes && model.attributes.isComposed) {
            return <FontIcon iconName={"Merge"} className="model-fontIcon" />;
        } else {
            return null;
        }
    }

    private getComposedTrainResults = (docTypes): [] => {
        return Object.keys(docTypes).map((modelId) => {
            return {
                modelId,
                ...docTypes[modelId]
            };
        }) as [];
    }
}
