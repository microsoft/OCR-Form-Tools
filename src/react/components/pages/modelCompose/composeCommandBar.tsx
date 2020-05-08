import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import "./modelCompose.scss";

interface IModelComposeCommandBarProps {
    composedModels: any[];
    handleCompose: () => void;
    GetComposedItemsOnTop: () => void;
}

export const ModelComposeCommandBar: React.FunctionComponent<IModelComposeCommandBarProps> = (props) => {

    const commandBarItems: ICommandBarItemProps[] = [
        {
            key: "GetComposedItems",
            text: "Top",
            title: "Move composed models to top",
            disabled: props.composedModels.length === 0 ? true : false,
            iconProps: {iconName: "ChevronUp"},
            onClick: () => {props.GetComposedItemsOnTop(); },
        },
    ];

    const commandBarFarItems: ICommandBarItemProps[] = [
        {
            key: "Compose",
            text: "Compose",
            // This needs an ariaLabel since it's icon-only
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
