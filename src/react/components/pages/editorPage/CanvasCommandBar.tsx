import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import { ICustomizations, Customizer } from "office-ui-fabric-react/lib/Utilities";
import { getDarkGreyTheme } from "../../../../common/themes";

interface ICanvasCommandBarProps {
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleLayerChange: (layer: string) => void;
    layers: any;
}

export const CanvasCommandBar: React.FunctionComponent<ICanvasCommandBarProps> = (props) => {
    const dark: ICustomizations = {
        settings: {
          theme: getDarkGreyTheme(),
        },
        scopedSettings: {},
    };

    const commandBarItems: ICommandBarItemProps[] = [
        {
          key: "layers",
          text: "Layers",
          iconProps: { iconName: "MapLayers" },
          subMenuProps: {
            items: [
              {
                key: "table",
                text: "Tables",
                canCheck: true,
                iconProps: { iconName: "Table" },
                isChecked: props.layers["tables"],
                onClick: () => props.handleLayerChange("tables"),
              },
              {
                key: "text",
                text: "Text",
                canCheck: true,
                iconProps: { iconName: "TextField" },
                isChecked: props.layers["text"],
                onClick: () => props.handleLayerChange("text"),
              },
            ],
          },
        },
    ];

    const commandBarFarItems: ICommandBarItemProps[] = [
        {
            key: "zoomOut",
            text: "Zoom out",
            // This needs an ariaLabel since it's icon-only
            ariaLabel: "Zoom out",
            iconOnly: true,
            iconProps: { iconName: "ZoomOut" },
            onClick: () => props.handleZoomOut(),
        },
        {
            key: "zoomIn",
            text: "Zoom in",
            // This needs an ariaLabel since it's icon-only
            ariaLabel: "Zoom in",
            iconOnly: true,
            iconProps: { iconName: "ZoomIn" },
            onClick: () => props.handleZoomIn(),
        },
    ];

    return (
        <Customizer {...dark}>
            <CommandBar
                items={commandBarItems}
                farItems={commandBarFarItems}
                ariaLabel="Use left and right arrow keys to navigate between commands"
            />
        </Customizer>
    );
};
