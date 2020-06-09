import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "office-ui-fabric-react/lib/CommandBar";
import { ICustomizations, Customizer } from "office-ui-fabric-react/lib/Utilities";
import { getDarkGreyTheme } from "../../../../common/themes";
import { EditorMode } from "../../../../models/applicationState";

interface ICanvasCommandBarProps {
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleLayerChange: (layer: string) => void;
    toggleBoundingBoxMode: () => void,
    downloadPDF: () => void,
    isExporting: boolean,
    editorMode: EditorMode,
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
                key: "generator",
                text: "Generators (Preview)",
                canCheck: true,
                iconProps: { iconName: "Annotation" },
                isChecked: props.layers["generator"],
                onClick: () => props.handleLayerChange("generator"),
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
            key: "downloadPDF",
            text: "Download PDF",
            ariaLabel: "Download PDF",
            iconOnly: true,
            iconProps: { iconName: "Annotation" }, // TODO is disabled
            buttonStyles: {},
            disabled: props.isExporting,
            onClick: () => props.downloadPDF(),
        },
        {
            key: "toggleBoundingBox",
            text: "Toggle Bounding Box selection",
            ariaLabel: "Toggle Bounding Box selection",
            iconOnly: true,
            iconProps: { iconName: "Annotation" },
            checked: props.editorMode === EditorMode.GeneratorRect,
            buttonStyles: {},
            onClick: () => props.toggleBoundingBoxMode(),
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
