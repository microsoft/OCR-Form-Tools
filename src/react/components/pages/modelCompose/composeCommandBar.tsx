import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import "./modelCompose.scss";
import { TextField, SpinnerSize, Spinner } from "office-ui-fabric-react";
import { getPrimaryWhiteTheme, getDefaultDarkTheme } from "../../../../common/themes";

interface IModelComposeCommandBarProps {
    composedModels: any[];
    allModels: any[];
    isComposing: boolean;
    isLoading: boolean;
    handleCompose: () => void;
    handleRefresh: () => void;
    GetComposedItemsOnTop: () => void;
    filterTextChange: (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string) => void;
}

export const ModelComposeCommandBar: React.FunctionComponent<IModelComposeCommandBarProps> = (props) => {

    const commandBarItems: ICommandBarItemProps[] = [
        {
            key: "Compose",
            text: "Compose",
            ariaLabel: "Compose Model",
            iconProps: { iconName: "combine" },
            onClick: () => {props.handleCompose(); },
        },
        {
            key: "Refresh",
            text: "Refresh",
            ariaLabel: "Refresh the list",
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
                        label="Model is loading..."
                        className="commandbar-spinner"
                        labelPosition="right"
                        theme={getDefaultDarkTheme()}
                        size={SpinnerSize.large}>
                    </Spinner>
                </div>
            )
        }
    ];

    const commandBarFarItems: ICommandBarItemProps[] = [
        {
            key: "filter",
            className: "filter-item",
            onRender: () => (
                <div className="commandbar-filter">
                    <TextField
                        className="label-filter-field"
                        placeholder="Filter By Name..."
                        disabled={props.allModels ? false : true}
                        theme={getPrimaryWhiteTheme()}
                        onChange={props.filterTextChange}>
                    </TextField>
                </div>
            )
        },
    ];

    return (
            <CommandBar
                items={commandBarItems}
                farItems={commandBarFarItems}
                ariaLabel="Please use command bar to compose models"
            />
    );
};
