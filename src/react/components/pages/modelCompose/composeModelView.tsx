// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Customizer, IColumn, ICustomizations, Modal, DetailsList, SelectionMode, DetailsListLayoutMode, PrimaryButton, TextField } from "@fluentui/react";
import { getDarkGreyTheme, getPrimaryGreenTheme, getPrimaryGreyTheme } from "../../../../common/themes";
import { strings } from "../../../../common/strings";
import { IModel } from "./modelCompose";
import { getAppInsights } from '../../../../services/telemetryService';


export interface IComposeModelViewProps {
    onComposeConfirm: (composeModelName: string) => void;
}

export interface IComposeModelViewState {
    hideModal: boolean;
    items: IModel[];
    cannotBeIncludeModels: IModel[];
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
                                isHeaderVisible={false}
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
                            >
                            Close
                        </PrimaryButton>
                    </div>
                </Modal>
            </Customizer>
        )
    }

    public open = (models: any, cannotBeIncludeModels: any) => {
        this.setState({
            hideModal: false,
            items: models,
            cannotBeIncludeModels,
        })
    }

    public close = () => {
        this.setState({
            hideModal: true,
        })
    }

    public confirm = () => {
        if (this.state.items.length > 1) {
            this.props.onComposeConfirm(this.modelName);
            this.setState({
                hideModal: true,
            });
        }
        if (this.appInsights) {
            this.appInsights.trackEvent({ name: "MODEL_COMPOSE_EVENT" });
        }
    }

    private onTextChange = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string) => {
        this.modelName = text;
    }
}
