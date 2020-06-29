// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ICustomizations, IColumn, DetailsList, SelectionMode, DetailsListLayoutMode, Customizer, FontIcon } from "@fluentui/react";
import { strings } from "../../../../common/strings";
import { getDarkGreyTheme } from "../../../../common/themes";
import { IModel } from "../../../../models/applicationState";

export interface IPredictModelListProps {
    items: IModel[];
    onExpandListClick: () => void;
}

export interface IPredictModelListState {
}

export default class PredictModelList extends React.Component<IPredictModelListProps, IPredictModelListState> {

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
            },
            {
                key: "column3",
                name: strings.modelCompose.column.status.headerName,
                minWidth: 50,
                isResizable: true,
                onRender: (model) => {
                    return <span>{model.status}</span>
                }
            },
            {
                key: "column4",
                name: strings.modelCompose.column.created.headerName,
                minWidth: 50,
                isResizable: true,
                onRender: (model) => {
                    return <span>{model.createdDateTime}</span>
                }
            },
            {
                key: "column5",
                name: strings.modelCompose.column.lastupdated.headerName,
                minWidth: 50,
                isResizable: true,
                onRender: (model) => {
                    return <span>{model.lastUpdatedDateTime}</span>
                }
            },
            {
                key: "column6",
                name: "Expand",
                isIconOnly: true,
                minWidth: 50,
                onRender: (model) =>{
                    return <FontIcon iconName={model.iconName} onClick={this.props.onExpandListClick}></FontIcon>
                }
            },
        ];
        const dark: ICustomizations = {
            settings: {
              theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };
        return (
            <div>
                <Customizer {...dark}>
                    <DetailsList
                        items={this.props.items}
                        columns={columns}
                        compact={true}
                        setKey="none"
                        selectionMode={SelectionMode.none}
                        isHeaderVisible={true}
                        layoutMode={DetailsListLayoutMode.justified}
                        >
                    </DetailsList>
                </Customizer>
            </div>
        )
    }
}