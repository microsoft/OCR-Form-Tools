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
                name: strings.column.id.headerName,
                ariaLabel: strings.column.id.idAria,
                minWidth: 200,
                maxWidth: 200,
                isResizable: true,
                onRender: (model: IModel) => {
                return <span>{model.modelId}</span>
                }
            },
            {
                key: "column2",
                name: strings.column.name.headerName,
                ariaLabel: strings.column.name.nameAria,
                minWidth: 100,
                maxWidth: 100,
                isResizable: true,
                onRender: (model: IModel) => {
                    return <span>{model.modelName}</span>
                }
            },
            {
                key: "column3",
                name: strings.column.status.headerName,
                ariaLabel: strings.column.status.statusAria,
                minWidth: 50,
                maxWidth: 50,
                isResizable: true,
                onRender: (model: IModel) => {
                    return <span>{model.status}</span>
                }
            },
            {
                key: "column4",
                name: strings.column.created.headerName,
                ariaLabel: strings.column.created.createdAria,
                minWidth: 50,
                maxWidth: 50,
                isResizable: true,
                onRender: (model: IModel) => {
                    return <span>{model.createdDateTime}</span>
                }
            },
            {
                key: "column5",
                name: strings.column.lastupdated.headerName,
                ariaLabel: strings.column.lastupdated.lastUpdatedAria,
                minWidth: 50,
                maxWidth: 50,
                isResizable: true,
                onRender: (model: IModel) => {
                    return <span>{model.lastUpdatedDateTime}</span>
                }
            },
            {
                key: "column6",
                name: strings.column.expand.headerName,
                ariaLabel: strings.column.expand.label,
                isIconOnly: true,
                minWidth: 43,
                maxWidth: 43,
                isResizable: true,
                onRender: (model: IModel) =>{
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
                        ariaLabel={strings.predict.predictModelList.ariaLabel}
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