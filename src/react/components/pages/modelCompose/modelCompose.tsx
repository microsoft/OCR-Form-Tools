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
         TextField,
         MarqueeSelection,
         IDetailsList} from "office-ui-fabric-react";
import "./modelCompose.scss";
import { strings } from "../../../../common/strings";
import { getDarkGreyTheme, getDefaultDarkTheme, getPrimaryWhiteTheme } from "../../../../common/themes";
import { ModelComposeCommandBar } from "./composeCommandBar";
import { bindActionCreators } from "redux";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { ViewSelection } from "./ViewSelection";
import { Blink } from "./blink";

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
    columns: IColumn[];
    selectionDetails: string;
    isModalSelection: boolean;
    isCompactMode: boolean;
    isComposing: boolean;
    composedModelsId: string[];
    isLoading: boolean;
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
    private loadingFlag: boolean = true;
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
                isSorted: true,
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
            columns,
            selectionDetails: this.handleSelection(),
            isModalSelection: false,
            isCompactMode: false,
            isComposing: false,
            composedModelsId: [],
            isLoading: false,
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
        if ( prevState.isComposing === true &&
                prevState.isComposing !== this.state.isComposing) {
            if (this.props.project) {
                this.getModelList();
            }
        }
    }

    public componentWillUnmount() {
        this.loadingFlag = false;
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
                            handleCompose={this.onComposeClick}
                            GetComposedItemsOnTop={this.handleTopComposedModel}
                            />
                    </div>
                    <div className="label-filter-background">
                        <TextField
                            label="Filter By Name"
                            className="label-filter-field"
                            disabled={this.allModels ? false : true}
                            theme={getPrimaryWhiteTheme()}
                            onChange={this.onTextChange}>
                        </TextField>
                    </div>
                    {this.state.isLoading &&
                        <Blink
                            Notification="Model list is still loading">
                        </Blink>
                    }
                    <ViewSelection
                        selection={this.selection}
                        items={this.state.modelList}
                        columns={this.state.columns}
                        isComposing={this.state.isComposing}
                        allModels={this.allModels}>
                        {this.state.isComposing ?
                        <Spinner
                            label="Model is composing, please wait..."
                            className="compose-spinner"
                            theme={getDefaultDarkTheme()}
                            size={SpinnerSize.large}>
                        </Spinner> :
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
            });
            const res = await this.getResponse();
            const modelList = res.data.modelList;
            const nextLink = res.data.nextLink;

            let reorderedList = this.reorderModelList(modelList);
            if (this.state.composedModelsId.length !== 0) {
                reorderedList = this.getComposedModelsOnTop(reorderedList);
            }
            this.allModels = reorderedList;
            this.setState({
                modelList: reorderedList,
            }, () => {
                setTimeout(() => {this.addModelLists(nextLink); }, 300); });
        } catch (error) {
            console.log(error);
        }
    }

    private addModelLists = async (nextLink) => {
        if (this.loadingFlag) {
            if (this.state.modelList.length <= 250) {
                if (nextLink.length !== 0) {
                    const nextRes = await this.getModelsFromNextLink(nextLink);
                    const nextList = this.state.modelList.concat(nextRes.nextList);
                    const link = nextRes.nextLink;
                    let reorderedList = this.reorderModelList(nextList);
                    if (this.state.composedModelsId.length !== 0) {
                       reorderedList = this.getComposedModelsOnTop(reorderedList);
                    }
                    this.allModels = reorderedList;
                    this.setState({
                        modelList: reorderedList,
                    }, () => {
                        setTimeout(() => {
                        this.addModelLists(link);
                    }, 300); });
                } else {
                    this.setState({isLoading: false});
                }
            }
        } else {
            this.loadingFlag = true;
        }

    }

    private getModelsFromNextLink = async (link: string) => {
        const res = await this.getResponse(link);
        return {
            nextList: res.data.modelList,
            nextLink: res.data.nextLink,
        };
    }

    private reorderModelList = (modelList: IModel[]): IModel[] => {
        const list = modelList.splice(0, 250);
        list.map((m) => m.key = m.modelId);
        return this.copyAndSort(list, "createdatetime", true);
    }

    private async getResponse(nextLink?: string) {
        const baseURL = nextLink === undefined ? url.resolve(
            this.props.project.apiUriBase,
            constants.apiModelsPath,
        ) : url.resolve(
            this.props.project.apiUriBase,
            nextLink,
        );

        try {
            return await ServiceHelper.getWithAutoRetry(
                baseURL,
                {},
                this.props.project.apiKey as string,
            );
        } catch (err) {
            console.log(err);
            ServiceHelper.handleServiceError(err);
        }
    }

    private getComposedModelsOnTop = (modelList: IModel[]): IModel[] => {
        const composedModelCopy = [];
        modelList.map((m) => {
            if (this.state.composedModelsId.indexOf(m.modelId) !== -1) {
                m.iconName = "edit";
                composedModelCopy.push(m);
            }
        });

        const uncomposedModelList = modelList.filter(
            (m) => this.state.composedModelsId.indexOf(m.modelId) === -1 );
        const newModelList = composedModelCopy.concat(uncomposedModelList);
        return newModelList;
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

    private onComposeClick = () => {
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

    private onTextChange = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string): void => {
        this.setState({
            modelList: text ? this.allModels.filter((m) => m.modelId.indexOf(text) > -1) : this.allModels,
        });
    }

    private handleTopComposedModel = () => {
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

}
