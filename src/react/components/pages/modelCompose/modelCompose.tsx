// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {connect} from "react-redux";
import url from "url";
import _ from "lodash";
import { RouteComponentProps } from "react-router-dom";
import { IProject, IConnection, IAppSettings, IApplicationState } from "../../../../models/applicationState";
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
         ScrollbarVisibility} from "office-ui-fabric-react";
import "./modelCompose.scss";
import { strings } from "../../../../common/strings";
import { getDarkGreyTheme, getDefaultDarkTheme } from "../../../../common/themes";
import { ModelComposeCommandBar } from "./composeCommandBar";
import { bindActionCreators } from "redux";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { ViewSelection } from "./ViewSelection";
import ComposeModelView from "./composeModelView";

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
    composedModelsId: string[];
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
                name: "Composed Icon",
                className: "composed-icon-cell",
                isIconOnly: true,
                ariaLabel: "Model with icon is a new composed model",
                fieldName: "icon",
                minWidth: 20,
                maxWidth: 20,
                isResizable: true,
                onRender: (model: IModel) => {
                    return <FontIcon iconName={model.iconName} className="model-fontIcon"/> ;
                },
                headerClassName: "list-header",
            },
            {
                key: "column2",
                name: "Model ID",
                fieldName: "modelId",
                minWidth: 250,
                maxWidth: 250,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => {
                return <span>{model.modelId}</span>;
                },
            },
            {
                key: "column3",
                name: "Model name",
                fieldName: "model name",
                minWidth: 150,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => {
                return (<span>{model.modelName}</span>);
                },

            },
            {
                key: "column4",
                name: "Status",
                fieldName: "status",
                minWidth: 50,
                maxWidth: 100,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => {
                return (<span>{model.status}</span>);
                },
            },
            {
                key: "column5",
                name: "Create Date Time",
                fieldName: "createdatetime",
                minWidth: 150,
                maxWidth: 175,
                isResizable: true,
                isRowHeader: true,
                isSorted: false,
                isSortedDescending: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => {
                    return <span>{new Date(model.createdDateTime).toLocaleString()}</span>;
                },
            },
            {
                key: "column6",
                name: "Last Updated Date Time",
                fieldName: "lastupdateddatetime",
                minWidth: 175,
                maxWidth: 175,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => {
                    return (<span>{new Date(model.lastUpdatedDateTime).toLocaleString()}</span>);
                },
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
            composedModelsId: [],
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
        document.title = "Model compose page - " + strings.appName;
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
        const {modelList, isCompactMode, columns} = this.state;
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
            return (
              <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
                {defaultRender!({
                  ...props,
                  onRenderColumnHeaderTooltip,
                })}
              </Sticky>
            );
          };

        return (
            <Fabric className="modelCompose-page">
                <Customizer {...dark}>
                    <div className="commandbar-container">
                        <ModelComposeCommandBar
                            composedModels={this.state.composedModelsId}
                            allModels={this.allModels}
                            isComposing={this.state.isComposing}
                            isLoading={this.state.isLoading}
                            hasText={this.state.hasText}
                            handleCompose={this.onComposeButtonClick}
                            handleRefresh={this.onRreshButtonClick}
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
                                    label="Model is composing, please wait..."
                                    className="compose-spinner"
                                    theme={getDefaultDarkTheme()}
                                    size={SpinnerSize.large}>
                                </Spinner> :
                                <div>
                                    <DetailsList
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
                                    {this.state.nextLink && !this.state.hasText &&
                                        <div className="next-page-container">
                                            {
                                                this.state.isLoading ?
                                                <>
                                                    {
                                                        this.state.nextLink !== "*" &&
                                                        <Spinner
                                                            label="Model is loading..."
                                                            className="commandbar-spinner"
                                                            labelPosition="right"
                                                            theme={getDefaultDarkTheme()}
                                                            size={SpinnerSize.small}>
                                                        </Spinner>
                                                    }
                                                </>
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
        );
    }

    private getKey = (item: any, index?: number): string => {
        return item.key;
    }

    private getModelList = async () => {
        try {
            this.setState({
                isLoading: true,
            });

            const composedModels = this.state.composedModelList;
            composedModels.forEach(async (m) => {
                if (m.status !== "ready" || "invalid") {
                    m = await this.reloadModelStatus(m.modelId);
                }
            });
            let composedIds = [];
            if (this.state.composedModelsId.length !== 0) {
                composedIds = this.getComposedIds();
                if (composedIds.indexOf(this.state.composedModelsId[0]) === -1) {
                    const idURL = constants.apiModelsPath + "/" + this.state.composedModelsId[0];
                    const newComposeModel = await this.getComposedModelByURl(idURL);
                    composedModels.push(newComposeModel);
                    composedIds.push(this.state.composedModelsId[0]);
                }
            }
            const res = await this.getResponse();
            let models = res.data.modelList;
            const link = res.data.nextLink;

            models.map((m) => m.key = m.modelId);
            models = models.filter((m) => composedIds.indexOf(m.modelId) === -1);

            const newList = composedModels.concat(models);

            this.allModels = newList;
            this.setState({
                modelList: newList,
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

    private reloadModelStatus = async (id: string) => {
        const url = constants.apiModelsPath + "/" + id;
        const renewModel = await this.getComposedModelByURl(url);
        console.log(renewModel);
        return renewModel;
    }

    private getComposedModelByURl = async (idURL) => {
        const composedRes = await this.getResponse(idURL);
        const composedModel: IModel = composedRes.data.modelInfo;
        composedModel.iconName = "combine";
        composedModel.key = composedModel.modelId;
        console.log("# composedModel:", composedModel)
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
                    let reorderList = this.copyAndSort(currentList, "modelId", false);
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
            constants.apiPreviewPath,
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
            console.log(err);
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
        this.allModels = newList;
        this.setState({
            columns: newColumns,
            modelList: newList,
        });
    }

    private copyAndSort(modelList: IModel[], columnKey: string, isSortedDescending?: boolean): IModel[] {
        const key = columnKey;
        if (key === "createdatetime" || key === "lastupdateddatetime") {
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
        this.handleComposeModels(selections, composeModelName);
    }

    private passSelectedItems = (Items) => {
        this.selectedItems = Items;
    }

    /** Handle the operation of composing a new model */
    private handleComposeModels = async (selections: any[], name: string) => {
        setTimeout( async () => {
            try {
                const idList = [];
                selections.forEach((s) => idList.push(s.modelId));
                const payload = {
                    modelIds: idList,
                    modelName: name,
                };
                const link = constants.apiPreviewComposePath;
                const composeRes = await this.post(link, payload);
                const composedId = this.getComposedModelId(composeRes);
                const newCols = this.state.columns;
                newCols.forEach((ncol) => {
                    ncol.isSorted = false;
                    ncol.isSortedDescending = true;
                });
                this.setState({
                    isComposing: false,
                    composedModelsId: [composedId],
                    columns: newCols,
                });
            } catch (error) {
                console.log(error);
            }
        }, 5000);
    }

    /** get the model Id of new composed model */
    private getComposedModelId = (composeRes: any): string => {
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

    private onRreshButtonClick = () => {
        if (!this.refreshClicks) {
            this.refreshClicks = true;
            setTimeout(() => {
                if (!this.state.refreshFlag && this.refreshClicks) {
                    this.setState({
                        refreshFlag: true,
                    });
                }
            }, 1);
        }
    }
}
