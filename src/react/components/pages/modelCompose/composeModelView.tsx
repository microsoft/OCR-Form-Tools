// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Customizer, IColumn, ICustomizations, Modal, DetailsList, SelectionMode, DetailsListLayoutMode, PrimaryButton, TextField } from "@fluentui/react";
import { getDarkGreyTheme, getPrimaryGreenTheme, getPrimaryRedTheme } from "../../../../common/themes";
import { IModel } from "../predict/predictPage";
import { strings } from "../../../../common/strings";


export interface IComposeModelViewProps {
    onComposeConfirm: (composeModelName: string) => void;
}

export interface IComposeModelViewState {
    hideModal: boolean;
    items: IModel[];
}

export default class ComposeModelView extends React.Component<IComposeModelViewProps, IComposeModelViewState> {
    /**
     *
     */
    private modelName: string = "";

    constructor(props) {
        super(props);
        this.state = {
            hideModal: true,
            items: [],
        }
    }

    public render() {
        const columns: IColumn[] = [
            {
                key: "column1",
                name: strings.modelCompose.column.id.headerName,
                minWidth: 250,
                maxWidth: 250,
                isResizable: true,
                onRender: (model) => {
                return <span>{model.modelId}</span>
                }
            },
            {
                key: "column2",
                name: strings.modelCompose.column.name.headerName,
                minWidth: 50,
                isResizable: true,
                onRender: (model) => {
                    return <span>{model.modelName}</span>
                }
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
                    isModeless={true}
                    containerClassName="modal-container"
                    >
                    <div>
                        <span>Add name for Compose model</span>
                        <TextField
                            className="modal-textfield"
                            placeholder={strings.modelCompose.modelView.addComposeModelName}
                            onChange={this.onTextChange}
                            >
                        </TextField>
                    </div>
                    <div >
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
                            >
                        </DetailsList>
                    }
                    </div>
                    <>{
                        this.state.items.length <= 2 &&
                        <div className="modal-alert">
                           {strings.modelCompose.modelView.NotEnoughModels}
                        </div>
                    }</>
                    <div className="model-button-container">
                        <PrimaryButton
                            className="model-confirm"
                            theme={getPrimaryGreenTheme()}
                            onClick={this.confirm}>
                            Compose
                        </PrimaryButton>
                        <PrimaryButton
                            className="modal-cancel"
                            theme={getPrimaryRedTheme()}
                            onClick={this.close}
                            >
                            Close
                        </PrimaryButton>
                    </div>
                </Modal>
            </Customizer>
        )
    }

    public open = (models) => {
        this.setState({
            hideModal: false,
            items: models,
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
            })
        }
    }

    private onTextChange = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string) => {
        this.modelName = text;
    }
}