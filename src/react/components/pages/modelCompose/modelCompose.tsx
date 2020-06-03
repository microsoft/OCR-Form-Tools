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
         PrimaryButton} from "office-ui-fabric-react";
import "./modelCompose.scss";
import { strings } from "../../../../common/strings";
import { getDarkGreyTheme, getDefaultDarkTheme } from "../../../../common/themes";
import { ModelComposeCommandBar } from "./composeCommandBar";
import { bindActionCreators } from "redux";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { ViewSelection } from "./ViewSelection";

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
    columns: IColumn[];
    selectionDetails: string;
    isModalSelection: boolean;
    isCompactMode: boolean;
    isComposing: boolean;
    composedModelsId: string[];
    isLoading: boolean;
    refreshFlag: boolean;
}

export interface IModel {
    key: string;
    modelId: string;
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
    private listRef = React.createRef<IDetailsList>();

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
            },
            {
                key: "column2",
                name: "Model ID",
                fieldName: "modelId",
                minWidth: 100,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => {
                return <span>{model.modelId}</span>;
                },
            },
            {
                key: "column3",
                name: "Status",
                fieldName: "status",
                minWidth: 100,
                isResizable: true,
                onColumnClick: this.handleColumnClick,
                onRender: (model: IModel) => {
                return (<span>{model.status}</span>);
                },
            },
            {
                key: "column4",
                name: "Create Date Time",
                fieldName: "createdatetime",
                minWidth: 175,
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
                key: "column5",
                name: "Last Updated Date Time",
                fieldName: "lastupdateddatetime",
                minWidth: 175,
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
            columns,
            selectionDetails: this.handleSelection(),
            isModalSelection: false,
            isCompactMode: false,
            isComposing: false,
            composedModelsId: [],
            isLoading: false,
            refreshFlag: false,
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
        // console.log(this.state.modelList);
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
        console.log("Finish Update");
    }

    public componentWillUnmount() {
        console.log("this will unmount");
    }

    public render() {
        const {modelList, isCompactMode, columns} = this.state;
        const dark: ICustomizations = {
            settings: {
              theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };

        return (
            <Fabric className="modelCompose-page">
                <Customizer {...dark}>
                    <div className="commandbar">
                        <ModelComposeCommandBar
                            composedModels={this.state.composedModelsId}
                            allModels={this.allModels}
                            isComposing={this.state.isComposing}
                            isLoading={this.state.isLoading}
                            handleCompose={this.onComposeButtonClick}
                            handleRefresh={this.onRreshButtonClick}
                            GetComposedItemsOnTop={this.handleTopButtonClick}
                            filterTextChange={this.onTextChange}
                            />
                    </div>
                    <ViewSelection
                        selection={this.selection}
                        items={this.allModels}
                        columns={this.state.columns}
                        isComposing={this.state.isComposing}
                        refreshFlag={this.state.refreshFlag}>
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
                                selectionPreservedOnEmptyClick={true}>
                            </DetailsList>
                            {this.state.nextLink &&
                                <div className="next-page-container">
                                    {
                                        this.state.isLoading ?
                                        <Spinner
                                            label="Model is loading..."
                                            className="commandbar-spinner"
                                            labelPosition="right"
                                            theme={getDefaultDarkTheme()}
                                            size={SpinnerSize.small}>
                                        </Spinner> :
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
            })
            const res = await this.getResponse();
            const models = res.data.modelList;
            const link = res.data.nextLink;

            models.map((m) => m.key = m.modelId);
            let newList = models;
            if (this.state.composedModelsId.length !== 0) {
                newList = this.getComposedModelsOnTop(newList);
            }

            this.allModels = newList;
            this.setState({
                modelList: newList,
                nextLink: link,
            },() => {
                this.setState({
                    isLoading: false,
                })
            });
        } catch (error) {
            console.log(error);
        }
    }

    private getNextPage = async () => {
        console.log(this.state.composedModelsId);
        try {
            if (this.allModels.length <= 5000) {
                if (this.state.nextLink.length !== 0) {
                    this.setState({
                        isLoading: true,
                    })
                    const nextPage = await this.getModelsFromNextLink(this.state.nextLink);
                    const currentList = this.state.modelList;
                    const reorderdList = this.copyAndSort(currentList, "modelId", false);
                    nextPage.nextList.map((m) => m.key = m.modelId);
                    let newList = reorderdList.concat(nextPage.nextList);
                    if (this.state.composedModelsId.length !== 0) {
                        newList = this.getComposedModelsOnTop(newList);
                    }
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
                        })
                    });
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    private getModelsFromNextLink = async (link: string) => {
        const res = await this.getResponse(link);
        return {
            nextList: res.data.modelList,
            nextLink: res.data.nextLink,
        };
    }

    // private getModelList = async () => {
    //     try {
    //         this.setState({
    //             isLoading: true,
    //         });
    //         const res = await this.getResponse();
    //         const modelList = res.data.modelList;
    //         const nextLink = res.data.nextLink;

    //         let reorderedList = this.reorderModelList(modelList);
    //         if (this.state.composedModelsId.length !== 0) {
    //             reorderedList = this.getComposedModelsOnTop(reorderedList);
    //         }
    //         this.allModels = reorderedList;
    //         this.setState({
    //             modelList: reorderedList,
    //         }, () => {
    //             setTimeout(() => {this.addModelLists(nextLink); }, 400); });
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    // private addModelLists = async (nextLink) => {
    //     try {
    //         if (this.state.modelList.length <= 250) {
    //             if (nextLink.length !== 0) {
    //                 const nextRes = await this.getModelsFromNextLink(nextLink);
    //                 const nextList = this.state.modelList.concat(nextRes.nextList);
    //                 const link = nextRes.nextLink;
    //                 let reorderedList = this.reorderModelList(nextList);
    //                 if (this.state.composedModelsId.length !== 0) {
    //                    reorderedList = this.getComposedModelsOnTop(reorderedList);
    //                 }
    //                 this.allModels = reorderedList;
    //                 this.setState({
    //                     modelList: reorderedList,
    //                 }, () => {
    //                     setTimeout(() => {
    //                     this.addModelLists(link);
    //                 }, 400); });
    //             } else {
    //                 setTimeout(() => {
    //                     this.setState({isLoading: false});
    //                 }, 600);
    //             }
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    // private getModelsFromNextLink = async (link: string) => {
    //     const res = await this.getResponse(link);
    //     return {
    //         nextList: res.data.modelList,
    //         nextLink: res.data.nextLink,
    //     };
    // }

    // private reorderModelList = (modelList: IModel[]): IModel[] => {
    //     const list = modelList.splice(0, 250);
    //     list.map((m) => m.key = m.modelId);
    //     return this.copyAndSort(list, "createdatetime", true);
    // }

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
            })
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

    private onTextChange = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string): void => {
        this.setState({
            modelList: text ? this.allModels.filter((m) => m.modelId.indexOf(text) > -1) : this.allModels,
        });
    }

    private onComposeButtonClick = () => {
        this.selection.getSelection().map((s) => console.log(s));
        this.setState({
            isComposing: true,
        });
        this.handleModelCompose();
    }

    private handleModelCompose = () => {
        setTimeout( () => {
            const newCols = this.state.columns;
            newCols.forEach((ncol) => {
                ncol.isSorted = false;
                ncol.isSortedDescending = true;
            });
            this.setState({
                isComposing: false,
                composedModelsId: ["62ce2175-92b5-444c-b703-9bc2185684c7"],
                columns: newCols,
        });
        }, 5000);
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

    private handleTopButtonClick = () => {
        if (this.state.composedModelsId) {
            const newList = this.getComposedModelsOnTop(this.state.modelList);
            const newCols = this.state.columns;
            newCols.forEach((ncol) => {
                ncol.isSorted = false;
                ncol.isSortedDescending = true;
            });
            this.setState({
                modelList: newList,
                columns: newCols,
            });
        }
    }

    private getComposedModelsOnTop = (modelList: IModel[]): IModel[] => {
        const composedModelCopy = [];
        modelList.map((m) => {
            if (this.state.composedModelsId.indexOf(m.modelId) !== -1) {
                m.iconName = "combine";
                composedModelCopy.push(m);
            }
        });

        const uncomposedModelList = modelList.filter(
            (m) => this.state.composedModelsId.indexOf(m.modelId) === -1 );
        const newModelList = composedModelCopy.concat(uncomposedModelList);
        return newModelList;
    }

}
