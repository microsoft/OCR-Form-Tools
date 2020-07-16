// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Customizer, IColumn, ICustomizations, Modal, DetailsList, SelectionMode, DetailsListLayoutMode, PrimaryButton, TextField, ISelection, IDetailsCheckboxProps, IRenderFunction } from "@fluentui/react";
import { getDarkGreyTheme, getPrimaryGreenTheme, getPrimaryGreyTheme } from "../../../../common/themes";
import { strings } from "../../../../common/strings";
import { IRecentModel } from "../../../../models/applicationState";


export interface IRecentModelsViewProps {
    selectedIndex: number;
    selectionHandler: ISelection;
    recentModels: IRecentModel[];
    onModelSelect?: () => void;
    onCancel?: () => void;
    onApply: () => any;
}

export default class RecentModelsView extends React.Component<IRecentModelsViewProps> {
    public render() {
        const columns: IColumn[] = [
            {
                key: "column1",
                name: "Model ID",
                minWidth: 250,
                maxWidth: 250,
                isResizable: true,
                onRender: (model) => <span>{model.modelInfo.modelId}</span>,
            },
            {
                key: "column2",
                name: "Model name",
                minWidth: 250,
                maxWidth: 250,
                isResizable: true,
                onRender: (model) => <span>{model.modelInfo?.modelName}</span>,
            },
            {
                key: "column3",
                name: "Created date",
                minWidth: 100,
                isResizable: true,
                onRender: (model) => <span>{model.modelInfo.createdDateTime}</span>,
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
                    titleAriaId={""}
                    isOpen={true}
                    isModeless={false}
                    containerClassName="modal-container"
                    scrollableContentClassName="scrollable-content"
                >
                    <h4>Select model to analyze with</h4>
                    <DetailsList
                        selectionMode={SelectionMode.single}
                        selectionPreservedOnEmptyClick={true}
                        className="modal-list-container"
                        items={this.props.recentModels ||  []}
                        columns={columns}
                        compact={true}
                        selection={this.props.selectionHandler}
                        isHeaderVisible={true}
                        layoutMode={DetailsListLayoutMode.justified}
                    />
                    <div className="modal-buttons-container">
                        <PrimaryButton
                            className="model-confirm"
                            theme={getPrimaryGreenTheme()}
                            onClick={this.props.onApply}
                            disabled={this.props.selectedIndex === -1}
                        >
                            Apply
                        </PrimaryButton>
                        <PrimaryButton
                            style={{width: "110px"}}
                            className="modal-cancel"
                            theme={getPrimaryGreyTheme()}
                            onClick={this.props.onCancel}
                        >
                            Cancel
                        </PrimaryButton>
                    </div>
                </Modal>
            </Customizer>
        )
    }
}
