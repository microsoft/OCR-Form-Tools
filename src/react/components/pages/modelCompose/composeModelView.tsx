// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Customizer, IColumn, ICustomizations, Modal, DetailsList, SelectionMode, DetailsListLayoutMode, PrimaryButton, TextField, FontIcon, Spinner, SpinnerSize } from "@fluentui/react";
import { getDarkGreyTheme, getPrimaryGreenTheme, getPrimaryGreyTheme, getDefaultDarkTheme } from "../../../../common/themes";
import { strings } from "../../../../common/strings";
import { IModel } from "./modelCompose";
import { getAppInsights } from '../../../../services/telemetryService';
import "./modelCompose.scss";
import { IRecentModel } from "../../../../models/applicationState";


export interface IComposeModelViewProps {
    onComposeConfirm: (composeModelName: string) => void;
    addToRecentModels: (modelToAdd: IRecentModel) => void;
}

export interface IComposeModelViewState {
    hideModal: boolean;
    items: IModel[];
    cannotBeIncludeModels: IModel[];
    composing: boolean;
}

export default class ComposeModelView extends React.Component<IComposeModelViewProps, IComposeModelViewState> {
    /**
     *
     */
    private modelName: string = "";
    private appInsights: any = null;

    constructor(props: Readonly<IComposeModelViewProps>) {
        super(props);
        this.state = {
            hideModal: true,
            items: [],
            cannotBeIncludeModels: [],
            composing: false,
        }
    }

    public componentDidMount() {
        this.appInsights = getAppInsights();
    }

    public render() {
        const columns: IColumn[] = [
            {
                key: "column1",
                name: strings.modelCompose.column.icon.name,
                minWidth: 16,
                maxWidth: 16,
                className: "composed-icon-cell",
                ariaLabel: strings.modelCompose.columnAria.icon,
                isIconOnly: true,
                onRender: (model) => model.attributes?.isComposed ? <FontIcon iconName={"Merge"} className="model-fontIcon" /> : null
            },
            {
                key: "column2",
                name: strings.modelCompose.column.id.headerName,
                minWidth: 150,
                maxWidth: 300,
                isResizable: true,
                onRender: (model) => <span>{model.modelId}</span>,
            },
            {
                key: "column3",
                name: strings.modelCompose.column.name.headerName,
                minWidth: 50,
                maxWidth: 300,
                isResizable: true,
                onRender: (model) => <span>{model.modelName}</span>,
            },
            {
                key: "column4",
                name: strings.modelCompose.column.created.headerName,
                minWidth: 100,
                maxWidth: 200,
                isResizable: true,
                onRender: (model) => <span>{new Date(model.createdDateTime).toLocaleString()}</span>,
            }
        ];

        const modelDetailsColumns: IColumn[] = [
            {
                key: "column2",
                name: strings.modelCompose.column.id.headerName,
                minWidth: 150,
                maxWidth: 250,
                isResizable: true,
                onRender: (model) => <span>{model.id}</span>,
            },
            {
                key: "column3",
                name: strings.modelCompose.column.name.headerName,
                minWidth: 100,
                maxWidth: 330,
                isResizable: true,
                onRender: (model) => <span>{model.name}</span>,
            },
            {
                key: "column4",
                name: strings.modelCompose.column.created.headerName,
                minWidth: 100,
                maxWidth: 250,
                isResizable: true,
                onRender: (model) => <span>{model.createdDateTime ? new Date(model.createdDateTime).toLocaleString() : "N/A"}</span>,
            }
        ];

        const dark: ICustomizations = {
            settings: {
                theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };

        return (
            <Customizer {...dark}>
                <Modal
                    titleAriaId={strings.modelCompose.modelView.titleAria}
                    isOpen={!this.state.hideModal}
                    isModeless={false}
                    containerClassName="modal-container"
                    scrollableContentClassName="scrollable-content"
                >
                    {
                        this.state.composing && <>
                            <h4>Add name for composed model</h4>
                            <TextField
                                className="modal-textfield"
                                placeholder={strings.modelCompose.modelView.addComposeModelName}
                                onChange={this.onTextChange}
                            />
                            {
                                this.state.items &&
                                <DetailsList
                                    className="modal-list-container"
                                    items={this.state.items}
                                    columns={columns}
                                    compact={true}
                                    setKey="none"
                                    selectionMode={SelectionMode.none}
                                    isHeaderVisible={true}
                                    layoutMode={DetailsListLayoutMode.justified}
                                />
                            }
                            {
                                this.state.cannotBeIncludeModels.length > 0 &&
                                <div className="excluded-items-container">
                                    <h6>{this.state.cannotBeIncludeModels.length > 1 ? strings.modelCompose.modelView.modelsCannotBeIncluded : strings.modelCompose.modelView.modelCannotBeIncluded}</h6>
                                    <DetailsList
                                        className="excluded-items-list"
                                        items={this.state.cannotBeIncludeModels}
                                        columns={columns}
                                        compact={true}
                                        setKey="none"
                                        selectionMode={SelectionMode.none}
                                        isHeaderVisible={true}
                                        layoutMode={DetailsListLayoutMode.justified}
                                    />
                                </div>
                            }
                            {
                                this.state.items.length < 2 &&
                                <div className="modal-alert">{strings.modelCompose.modelView.NotEnoughModels}</div>
                            }
                            <div className="modal-buttons-container">
                                <PrimaryButton
                                    className="model-confirm"
                                    theme={getPrimaryGreenTheme()}
                                    onClick={this.confirm}>
                                    Compose
                        </PrimaryButton>
                                <PrimaryButton
                                    className="modal-cancel"
                                    theme={getPrimaryGreyTheme()}
                                    onClick={this.close}
                                >Close</PrimaryButton>
                            </div>
                        </>
                    }
                    {!this.state.composing &&
                        <>
                            <h4>
                                Model information
                            </h4>
                            {
                                this.state.items.length !== 0 &&
                                <>
                                    <div className="model-information-container">
                                        <h6 className="mr-2 model-information-prop">
                                            {"Model ID: "}
                                        </h6>
                                        {this.state.items["modelId"]}
                                    </div>
                                    {this.state.items["modelName"] &&
                                        <div className="model-information-container">
                                            <h6 className="mr-2 model-information-prop">
                                                Model name:
                                    </h6> {this.state.items["modelName"]}
                                        </div>
                                    }
                                    <div className="model-information-container">
                                        <h6 className="mr-2 model-information-prop">
                                            Created date:
                                </h6>
                                        {new Date(this.state.items["createdDateTime"]).toLocaleString()}
                                    </div>
                                    {this.state.items?.["composedTrainResults"]?.length > 0 &&
                                        <>
                                            <h6 className="mb-0">
                                                Composed of:
                                    </h6>
                                            <div className="mr-4 ml-4 mb-2 composed-of-list">
                                                <DetailsList
                                                    items={this.state.items["composedTrainResults"]}
                                                    columns={modelDetailsColumns}
                                                    compact={true}
                                                    setKey="none"
                                                    selectionMode={SelectionMode.none}
                                                    isHeaderVisible={true}
                                                    layoutMode={DetailsListLayoutMode.justified}
                                                />
                                            </div>
                                        </>
                                    }  </>
                            }
                            {this.state.items.length === 0 && <Spinner
                                label={strings.modelCompose.modelView.loadingDetails}
                                ariaLive="assertive"
                                labelPosition="right"
                                theme={getDefaultDarkTheme()}
                                size={SpinnerSize.large} />
                            }
                            <div className="modal-buttons-container mt-4">
                                <PrimaryButton
                                    className="mr-3"
                                    disabled={this.state.items.length === 0}
                                    theme={getPrimaryGreenTheme()}
                                    onClick={() => {
                                        this.props.addToRecentModels({
                                            modelInfo: {
                                                isComposed: Boolean(this.state.items["composedTrainResults"]),
                                                modelId: this.state.items["modelId"],
                                                createdDateTime: this.state.items["createdDateTime"],
                                                modelName: this.state.items?.["modelName"],
                                            }
                                        })
                                    }}
                                >
                                    {strings.recentModelsView.addToRecentModels}
                                </PrimaryButton>
                                <PrimaryButton
                                    className="modal-cancel"
                                    theme={getPrimaryGreyTheme()}
                                    onClick={this.close}
                                >
                                    Close
                                </PrimaryButton>
                            </div>
                        </>}
                </Modal>
            </Customizer>
        )
    }

    public open = (models: any, cannotBeIncludeModels: any, composing: boolean) => {
        this.setState({
            hideModal: false,
            items: models,
            cannotBeIncludeModels,
            composing
        })
    }

    public close = () => this.setState({ hideModal: true });

    public getItems = (items) => {
        if (items.length !== 0) {
            this.setState({ items })
        }
    }

    public confirm = () => {
        if (this.state.items.length > 1) {
            this.props.onComposeConfirm(this.modelName);
            this.setState({
                hideModal: true,
            });
        }
        if (this.appInsights) {
            this.appInsights.trackEvent({ name: "COMPOSE_MODEL_EVENT" });
        }
    }

    private onTextChange = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string) => {
        this.modelName = text;
    }
}
