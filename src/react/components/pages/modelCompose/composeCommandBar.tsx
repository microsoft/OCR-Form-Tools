import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import "./modelCompose.scss";

interface IModelComposeCommandBarProps {
    composedModels: any[];
    isComposing: boolean;
    isLoading: boolean;
    handleCompose: () => void;
    handleRefresh: () => void;
    GetComposedItemsOnTop: () => void;
}

export const ModelComposeCommandBar: React.FunctionComponent<IModelComposeCommandBarProps> = (props) => {

    const commandBarItems: ICommandBarItemProps[] = [
        // {
        //     key: "GetComposedItems",
        //     text: "Top",
        //     title: "Move composed models to top",
        //     disabled: props.composedModels.length === 0 ? true : false,
        //     iconProps: {iconName: "ChevronUp"},
        //     onClick: () => {props.GetComposedItemsOnTop(); },
        // },
    ];

    const commandBarFarItems: ICommandBarItemProps[] = [
        {
            key: "Refresh",
            text: "Refresh",
            ariaLabel: "Refresh the list",
            disabled: props.isComposing || props.isLoading,
            iconProps: {iconName: "refresh"},
            onClick: () => {props.handleRefresh(); },
        },
        {
            key: "Compose",
            text: "Compose",
            ariaLabel: "Compose Model",
            iconProps: { iconName: "edit" },
            onClick: () => {props.handleCompose(); },
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
