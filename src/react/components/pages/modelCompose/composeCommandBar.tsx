// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from "react";
import "./modelCompose.scss";
import { TextField, SpinnerSize, Spinner, CommandBar, ICommandBarItemProps } from "@fluentui/react";
import { getPrimaryWhiteTheme, getDefaultDarkTheme } from "../../../../common/themes";
import { strings } from "../../../../common/strings";

interface IModelComposeCommandBarProps {
    composedModels: any[];
    allModels: any[];
    isComposing: boolean;
    isLoading: boolean;
    hasText: boolean;
    handleCompose: () => void;
    handleRefresh: () => void;
    filterTextChange: (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string) => void;
}

export const ModelComposeCommandBar: React.FunctionComponent<IModelComposeCommandBarProps> = (props) => {

    const commandBarItems: ICommandBarItemProps[] = [
        {
            key: "Compose",
            text: "Compose",
            ariaLabel: strings.modelCompose.commandBar.composeAria,
            iconProps: { iconName: "Merge" },
            onClick: () => {props.handleCompose(); },
        },
        {
            key: "Refresh",
            text: "Refresh",
            ariaLabel: strings.modelCompose.commandBar.refreshAria,
            disabled: props.isComposing || props.isLoading,
            iconProps: {iconName: "refresh"},
            onClick: () => {props.handleRefresh(); },
        },
        {
            key: "loadingSpinner",
            onRender: () => (
                props.isLoading &&
                <div className="spinner-item">
                    <Spinner
                        label={strings.modelCompose.loading}
                        className="commandbar-spinner"
                        labelPosition="right"
                        theme={getDefaultDarkTheme()}
                        size={SpinnerSize.medium}>
                    </Spinner>
                </div>
            ),
        },
    ];

    const commandBarFarItems: ICommandBarItemProps[] = [
        {
            key: "filter",
            className: "filter-item",
            onRender: () => (
                <div className="commandbar-filter">
                    <TextField
                        ariaLabel={strings.modelCompose.commandBar.filterAria}
                        className="label-filter-field"
                        placeholder={strings.modelCompose.commandBar.filter}
                        disabled={props.allModels ? false : true}
                        theme={getPrimaryWhiteTheme()}
                        onChange={props.filterTextChange}>
                    </TextField>
                </div>
            ),
        },
    ];

    return (
            <CommandBar
                className="commandbar"
                items={commandBarItems}
                farItems={commandBarFarItems}
                ariaLabel={strings.modelCompose.commandBar.ariaLabel}
            />
    );
};
