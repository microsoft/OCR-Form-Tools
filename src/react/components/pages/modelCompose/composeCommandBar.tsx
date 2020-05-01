import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import { ICustomizations, Customizer } from "office-ui-fabric-react/lib/Utilities";
import { getDarkGreyTheme } from "../../../../common/themes";
import "./modelCompose.scss";

interface IModelComposeCommandBarProps {
    handleCompose: () => void;
}

export const ModelComposeCommandBar: React.FunctionComponent<IModelComposeCommandBarProps> = (props) => {

    const commandBarItems: ICommandBarItemProps[] = [
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
