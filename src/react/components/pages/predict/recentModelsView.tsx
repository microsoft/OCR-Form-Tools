// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Customizer, IColumn, ICustomizations, Modal, DetailsList, SelectionMode, DetailsListLayoutMode, PrimaryButton, ISelection } from "@fluentui/react";
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

export default function RecentModelsView(props: IRecentModelsViewProps) {
    const columns: IColumn[] = [
        {
            key: "column1",
            name: "Model ID",
            minWidth: 100,
            maxWidth: 250,
            isResizable: true,
            onRender: (model) => <span>{model.modelInfo.modelId}</span>,
        },
        {
            key: "column2",
            name: "Model name",
            minWidth: 150,
            maxWidth: 250,
            isResizable: true,
            onRender: (model) => <span>{model.modelInfo?.modelName}</span>,
        },
        {
            key: "column3",
            name: "Created date",
            minWidth: 150,
            isCollapsable: true,
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
                <h4>{strings.recentModelsView.header}</h4>
                <DetailsList
                    checkButtonAriaLabel={strings.recentModelsView.checkboxAriaLabel}
                    selectionMode={SelectionMode.single}
                    selectionPreservedOnEmptyClick={true}
                    className="modal-list-container"
                    items={props.recentModels ||  []}
                    columns={columns}
                    selection={props.selectionHandler}
                    isHeaderVisible={true}
                    layoutMode={DetailsListLayoutMode.justified}
                />
                <div className="modal-buttons-container">
                    <PrimaryButton
                        className="model-confirm"
                        theme={getPrimaryGreenTheme()}
                        onClick={props.onApply}
                        disabled={props.selectedIndex === -1}
                    >
                        Apply
                    </PrimaryButton>
                    <PrimaryButton
                        style={{width: "110px"}}
                        className="modal-cancel"
                        theme={getPrimaryGreyTheme()}
                        onClick={props.onCancel}
                    >
                        Cancel
                    </PrimaryButton>
                </div>
            </Modal>
        </Customizer>
    );
}
