// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Customizer, IColumn, ICustomizations, Modal, DetailsList, SelectionMode, DetailsListLayoutMode, PrimaryButton, TextField, FontIcon } from "@fluentui/react";
import { getDarkGreyTheme, getPrimaryGreenTheme, getPrimaryGreyTheme } from "../../../../common/themes";
import { strings } from "../../../../common/strings";
import { IModel } from "./modelCompose";
import { getAppInsights } from '../../../../services/telemetryService';
import "./modelCompose.scss";


export interface IComposeModelViewProps {
    onComposeConfirm: (composeModelName: string) => void;
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

    constructor(props) {
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
                name: strings.modelCompose.column.id.headerName,
                minWidth: 250,
                maxWidth: 250,
                isResizable: true,
                onRender: (model) => <span>{model.modelId}</span>,
            },
            {
                key: "column2",
                name: strings.modelCompose.column.name.headerName,
                minWidth: 50,
                isResizable: true,
                onRender: (model) => <span>{model.modelName}</span>,
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
                    {
                        !this.state.composing &&
                        <>
                            <h5 style={{whiteSpace: 'pre'}}>{"Model " + this.state.items["modelId"] + " " + (this.state.items["modelName"] ? `(${this.state.items["modelName"]})` : "") + "\ncreated on " + new Date(this.state.items["createdDateTime"]).toLocaleString() + "\nincludes following models:"}</h5>
                            <DetailsList
                                items={this.state.items["composedTrainResults"]}
                                columns={modelDetailsColumns}
                                compact={true}
                                setKey="none"
                                selectionMode={SelectionMode.none}
                                isHeaderVisible={true}
                                layoutMode={DetailsListLayoutMode.justified}
                            />
                            <div className="modal-buttons-container">
                                <PrimaryButton
                                    className="modal-cancel"
                                    theme={getPrimaryGreyTheme()}
                                    onClick={this.close}
                                >Close</PrimaryButton>
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
