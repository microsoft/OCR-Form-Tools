// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Customizer, IColumn, ICustomizations } from "office-ui-fabric-react";
import { getDarkGreyTheme } from "../../../../common/themes";


export interface IComposeModelViewProps {
    handleComposeModelViewClose: () => any;
}

export const composeModelView:React.FunctionComponent<IComposeModelViewProps> = (props) => {
    const columns: IColumn[] = [
        {
            key: "column1",
            name: "Model Id",
            minWidth: 50,
            isResizable: true,
            onRender: (model) => {
            return <span>{model.Id}</span>
            }
        },
        {
            key: "column2",
            name: "Model Name",
            minWidth: 50,
            isResizable: true,
            onRender: (model) => {
                return <span>{model.name}</span>
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
            <div></div>
        </Customizer>
    )
}