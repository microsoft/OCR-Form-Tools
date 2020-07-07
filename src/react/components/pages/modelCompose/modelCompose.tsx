// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {connect} from "react-redux";
import url from "url";
import { RouteComponentProps } from "react-router-dom";
import { IProject, IConnection, IAppSettings, IApplicationState, AppError, ErrorCode } from "../../../../models/applicationState";
import { constants } from "../../../../common/constants";
import ServiceHelper from "../../../../services/serviceHelper";
import { IColumn,
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
         ScrollbarVisibility} from "@fluentui/react";
import "./modelCompose.scss";
import { strings } from "../../../../common/strings";
import { getDarkGreyTheme, getDefaultDarkTheme } from "../../../../common/themes";
import { ModelComposeCommandBar } from "./composeCommandBar";
import { bindActionCreators } from "redux";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import ComposeModelView from "./composeModelView";
import { ViewSelection } from "./viewSelection";

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
    composedModelList: IModel[];
    columns: IColumn[];
    selectionDetails: string;
    isModalSelection: boolean;
    isCompactMode: boolean;
    isComposing: boolean;
    composeModelId: string[];
    isLoading: boolean;
    refreshFlag: boolean;
    hasText: boolean;
}

export interface IModel {
    key: string;
    modelId: string;
    modelName: string;
    createdDateTime: string;
    lastUpdatedDateTime: string;
    status: string;
    iconName?: string;
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
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class ModelComposePage extends React.Component<IModelComposePageProps, IModelComposePageState> {
    private selection: Selection;
    private allModels: IModel[];
    private refreshClicks: boolean;
    private selectedItems: any[];
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
                onRender: (model: IModel) => <FontIcon iconName={model.iconName} className="model-fontIcon"/>,
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
                name: strings.modelCompose.column.name.headerName,
                fieldName: strings.modelCompose.column.name.fieldName,
                minWidth: 150,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => <span>{model.modelName}</span>,
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
                name: strings.modelCompose.column.lastupdated.headerName,
                fieldName: strings.modelCompose.column.lastupdated.fieldName,
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
            composedModelList: [],
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
        document.title = strings.modelCompose.title + "-" + strings.appName;
    }

    public componentDidUpdate(prevProps, prevState) {
        if ((prevState.isComposing === true &&
                prevState.isComposing !== this.state.isComposing) || this.state.refreshFlag) {
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

        return <Fabric className="modelCompose-page">
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
                                    label= {strings.modelCompose.composing}
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
                                        items = {modelList}
                                        compact={isCompactMode}
                                        columns={columns}
                                        getKey={this.getKey}
                                        setKey="multiple"
                                        selectionMode={SelectionMode.multiple}
                                        layoutMode={DetailsListLayoutMode.justified}
                                        isHeaderVisible={true}
                                        selection={this.selection}
                                        selectionPreservedOnEmptyClick={true}
                                        onRenderDetailsHeader={onRenderDetailsHeader}
                                        >
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
                                                    <FontIcon iconName="Down" style={{padding: "5px"}}>
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
                            />
                </Customizer>
            </Fabric>
    }

    private getKey = (item: any, index?: number): string => {
        return item.key;
    }

    private getModelList = async () => {
        try {
            this.setState({
                isLoading: true,
            });

            const composedModels = this.reloadComposedModel(this.state.composedModelList);

            let composedModelIds = [];
            let predictModelFlag = false;
            if (this.state.composeModelId.length !== 0) {
                composedModelIds = this.getComposedIds();
                predictModelFlag = true;
                if (composedModelIds.indexOf(this.state.composeModelId[0]) === -1) {
                    const idURL = constants.apiModelsPath + "/" + this.state.composeModelId[0];
                    composedModels.push(await this.getComposeModelByURl(idURL));
                    composedModelIds.push(this.state.composeModelId[0]);
                }
            }
            const res = await this.getResponse();
            let models = res.data.modelList;
            const link = res.data.nextLink;

            models.map((m) => m.key = m.modelId);
            models = models.filter((m) => composedModelIds.indexOf(m.modelId) === -1);

            this.allModels = composedModels.concat(models);
            if (predictModelFlag) {
                const updatedProject = this.buildUpdatedProject(this.state.composeModelId[0]);
                await this.props.actions.saveProject(updatedProject, false, false);
            }
            this.setState({
                modelList: this.allModels,
                nextLink: link,
                composedModelList: composedModels,
            }, () => {
                this.setState({
                    isLoading: false,
                });
            });
        } catch (error) {
            console.log(error);
        }
    }

    private buildUpdatedProject = (modelId: string): IProject => {
        return {
            ...this.props.project,
            predictModelId: modelId,
        };
    }

    private reloadComposedModel = (models: IModel[]): IModel[] => {
        models.forEach(async (m: IModel) => {
            if (m.status !== "ready" && m.status !== "invalid") {
                const url = constants.apiModelsPath + "/" + m.modelId;
                const newModel = await this.getComposeModelByURl(url);
                const newStatus = newModel.status;
                m.status = newStatus;
            }
        })
        return models;
    }

    private getComposeModelByURl = async (idURL) => {
        const composedRes = await this.getResponse(idURL);
        const composedModel: IModel = composedRes.data.modelInfo;
        composedModel.iconName = "combine";
        composedModel.key = composedModel.modelId;
        return composedModel;
    }

    private getNextPage = async () => {
        try {
            if (this.allModels.length <= 5000) {
                if (this.state.nextLink.length !== 0) {
                    this.setState({
                        isLoading: true,
                    });
                    const nextPage = await this.getModelsFromNextLink(this.state.nextLink);
                    let currentList = this.state.modelList;
                    const composedModels = this.state.composedModelList;
                    const composedIds = this.getComposedIds();
                    currentList = currentList.filter((m) => composedIds.indexOf(m.modelId) === -1);
                    let reorderList = this.copyAndSort(currentList, strings.modelCompose.column.id.fieldName, false);
                    reorderList = composedModels.concat(reorderList);

                    let nextPageList = nextPage.nextList;
                    nextPageList = nextPageList.filter((m) => composedIds.indexOf(m.modelId) === -1);

                    nextPageList.map((m) => m.key = m.modelId);
                    const newList = reorderList.concat(nextPageList);

                    this.allModels = newList;
                    const newCols = this.state.columns;
                    newCols.forEach((ncol) => {
                        ncol.isSorted = false;
                        ncol.isSortedDescending = true;
                    });
                    this.setState({
                        modelList: newList,
                        nextLink: nextPage.nextLink,
                        columns: newCols,
                    }, () => {
                        this.setState({
                            isLoading: false,
                        });
                    });
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    private getComposedIds = () => {
        const composedIds = [];
        this.state.composedModelList.forEach((m) => {composedIds.push(m.modelId); });
        return composedIds;
    }

    private getModelsFromNextLink = async (link: string) => {
        const res = await this.getResponse(link);
        return {
            nextList: res.data.modelList,
            nextLink: res.data.nextLink,
        };
    }

    private async getResponse(nextLink?: string) {
        const baseURL = nextLink === undefined ? url.resolve(
            this.props.project.apiUriBase,
            constants.apiModelsPath,
        ) : url.resolve(
            this.props.project.apiUriBase,
            nextLink,
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
            ServiceHelper.handleServiceError(err);
        }
    }

    private handleColumnClick = (event: React.MouseEvent<HTMLElement>, column: IColumn): void => {
        const {columns, modelList} = this.state;
        const newColumns: IColumn[] = columns.slice();
        const currColumn: IColumn = newColumns.filter((col) => column.key === col.key)[0];
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
        const key = columnKey;
        if (key === strings.modelCompose.column.created.fieldName || key === strings.modelCompose.column.lastupdated.fieldName) {
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
        } else if (key === strings.modelCompose.column.name.fieldName) {
            return (
                modelList.slice(0).sort((a,b) => {
                    if (a.modelName && b.modelName) {
                        return isSortedDescending ? b.modelName.localeCompare(a.modelName) : -b.modelName.localeCompare(a.modelName)
                    } else if (a.modelName || b.modelName) {
                        if (a.modelName) {
                            return -1;
                        } else if (b.modelName) {
                            return 1;
                        }
                    } else {
                        return -1;
                    }
                })
            )
        } else {
            return (modelList.slice(0)
            .sort((a: IModel, b: IModel) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1 )));
        }
    }

    private handleSelection = (): string => {
        return "item selected";
    }

    /** Handle filter when text changes in filter field */
    private onTextChange = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string): void => {
        this.setState({
            modelList: text ?
                this.allModels.filter(({ modelName, modelId }) => (modelId.indexOf(text.toLowerCase()) > -1) ||
                (modelName !== undefined ? modelName.toLowerCase().indexOf(text.toLowerCase()) > -1 : false)) : this.allModels,
            hasText: text ? true : false,
        });
    }

    private onComposeButtonClick = () => {
        this.composeModalRef.current.open(this.selectedItems);
    }

    private onComposeConfirm = (composeModelName: string) => {
        this.setState({
            isComposing: true,
        });
        const selections = this.selectedItems;
        this.handleModelsCompose(selections, composeModelName);
    }

    private passSelectedItems = (Items: any[]) => {
        this.selectedItems = Items;
    }

    /**
     * Poll function to repeatly check if request succeeded
     * @param func - function that will be called repeatly
     * @param timeout - timeout
     * @param interval - interval
     */
    private poll = (func, timeout, interval): Promise<any> => {
        const endTime = Number(new Date()) + (timeout || 10000);
        interval = interval || 100;

        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then((response) => {
                if (response.data.modelInfo.status.toLowerCase() === constants.statusCodeReady) {
                    resolve(response.data);
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
        setTimeout( async () => {
            try {
                const idList = [];
                selections.forEach((s) => idList.push(s.modelId));
                const payload = {
                    modelIds: idList,
                    modelName: name,
                };
                const link = constants.apiModelsPath + "/compose";
                const composeRes = await this.post(link, payload);
                await this.waitUntilModelIsReady(composeRes["headers"]["location"]);
                const composedModelId = this.getComposeModelId(composeRes);
                const newCols = this.state.columns;
                newCols.forEach((ncol) => {
                    ncol.isSorted = false;
                    ncol.isSortedDescending = true;
                });
                this.setState({
                    isComposing: false,
                    composeModelId: [composedModelId],
                    columns: newCols,
                });
            } catch (error) {
                this.setState({
                    isComposing: false,
                })
                throw new AppError(ErrorCode.ModelNotFound, error.message);
            }
        }, 5000);
    }

    /** get the model Id of new composed model */
    private getComposeModelId = (composeRes: any): string => {
        const location = composeRes["headers"]["location"];
        const splitGroup = location.split("/");
        return splitGroup[splitGroup.length - 1];
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
            ServiceHelper.handleServiceError(err);
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
}
