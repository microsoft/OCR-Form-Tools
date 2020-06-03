import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "@fluentui/react/lib/CommandBar";
import { ICustomizations, Customizer } from "@fluentui/react/lib/Utilities";
import { getDarkGreyTheme } from "../../../../common/themes";

interface ICanvasCommandBarProps {
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleReRunOCR: () => void;
    handleReRunOcrForAllDocuments: () => void;
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
                key: "text",
                text: "Text",
                canCheck: true,
                iconProps: { iconName: "TextField" },
                isChecked: props.layers["text"],
                onClick: () => props.handleLayerChange("text"),
              },
              {
                key: "table",
                text: "Tables",
                canCheck: true,
                iconProps: { iconName: "Table" },
                isChecked: props.layers["tables"],
                onClick: () => props.handleLayerChange("tables"),
              },
              {
                key: "selectionMark",
                text: "Selection Marks (Preview)",
                canCheck: true,
                iconProps: { iconName: "CheckboxComposite" },
                isChecked: props.layers["checkboxes"],
                onClick: () => props.handleLayerChange("checkboxes"),
              },
              {
                key: "Label",
                text: "Label",
                canCheck: true,
                iconProps: { iconName: "LabelComposite" },
                isChecked: props.layers["label"],
                onClick: () => props.handleLayerChange("label"),
              },
            ],
          },
        },
    ];

    const commandBarFarItems: ICommandBarItemProps[] = [
        {
            key: "reRunOCR",
            text: "re-OCR",
            title: "rerun OCR",
            className:  "re-run-ocr-item",
            iconProps: { iconName: "Refresh" },
            subMenuProps: {
                items: [
                    {
                        key: "reRunForSingleDocument",
                        text: "this document",
                        iconProps: { iconName: "TextDocument" },
                        onClick: () => props.handleReRunOCR(),
                    },
                    {
                        key: "reRunForAllDocuments",
                        text: "all documents",
                        iconProps: { iconName: "Documentation" },
                        onClick: () => props.handleReRunOcrForAllDocuments(),
                    },
                ],
            },
        },
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
