import * as React from "react";
import { CommandBar, ICommandBarItemProps } from "@fluentui/react/lib/CommandBar";
import { ICustomizations, Customizer } from "@fluentui/react/lib/Utilities";
import { getDarkGreyTheme } from "../../../../common/themes";
import { strings } from '../../../../common/strings';
import { ContextualMenuItemType } from "@fluentui/react";
import { IProject } from "../../../../models/applicationState";
import "./canvasCommandBar.scss";

interface ICanvasCommandBarProps {
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleRunAutoLabelingOnCurrentDocument?: () => void;
    project: IProject;
    handleRotateImage: (degrees: number) => void;
    handleRunOcr?: () => void;
    handleRunOcrForAllDocuments?: () => void;
    handleLayerChange?: (layer: string) => void;
    handleToggleDrawRegionMode?: () => void;
    drawRegionMode?: boolean;
    connectionType?: string;
    handleAssetDeleted?: () => void;
    layers?: any;
    parentPage: string;
}

export const CanvasCommandBar: React.FunctionComponent<ICanvasCommandBarProps> = (props: ICanvasCommandBarProps) => {
    const dark: ICustomizations = {
        settings: {
            theme: getDarkGreyTheme(),
        },
        scopedSettings: {},
    };

    let commandBarItems: ICommandBarItemProps[] = [];
    if (props.parentPage === strings.editorPage.title) {
        commandBarItems = [{
            key: "layers",
            text: strings.editorPage.canvas.canvasCommandBar.items.layers.text,
            iconProps: { iconName: "MapLayers" },
            subMenuProps: {
                items: [
                    {
                        key: "text",
                        text: strings.editorPage.canvas.canvasCommandBar.items.layers.subMenuItems.text,
                        canCheck: true,
                        iconProps: { iconName: "TextField" },
                        isChecked: props.layers["text"],
                        onClick: () => props.handleLayerChange("text"),
                    },
                    {
                        key: "table",
                        text: strings.editorPage.canvas.canvasCommandBar.items.layers.subMenuItems.tables,
                        canCheck: true,
                        iconProps: { iconName: "Table" },
                        isChecked: props.layers["tables"],
                        onClick: () => props.handleLayerChange("tables"),
                    },
                    {
                        key: "selectionMark",
                        text: strings.editorPage.canvas.canvasCommandBar.items.layers.subMenuItems.selectionMarks,
                        canCheck: true,
                        iconProps: { iconName: "CheckboxComposite" },
                        isChecked: props.layers["checkboxes"],
                        onClick: () => props.handleLayerChange("checkboxes"),
                    },
                    // {
                    //   key: "DrawnRegions",
                    //   text: strings.editorPage.canvas.canvasCommandBar.items.layers.subMenuItems.drawnRegions,
                    //   canCheck: true,
                    //   iconProps: { iconName: "AddField" },
                    //   isChecked: props.layers["drawnRegions"],
                    //   className: props.drawRegionMode ? "disabled" : "",
                    //   onClick: () => props.handleLayerChange("drawnRegions"),
                    //   disabled: props.drawRegionMode
                    // },
                    {
                        key: "Label",
                        text: strings.editorPage.canvas.canvasCommandBar.items.layers.subMenuItems.labels,
                        canCheck: true,
                        iconProps: { iconName: "LabelComposite" },
                        isChecked: props.layers["label"],
                        onClick: () => props.handleLayerChange("label"),
                    },
                ],
            },
        },
            // {
            //   key: "drawRegion",
            //   text: strings.editorPage.canvas.canvasCommandBar.items.drawRegion,
            //   iconProps: { iconName: "AddField" },
            //   toggle: true,
            //   checked: props.drawRegionMode,
            //   className: !props.layers["drawnRegions"] ? "disabled" : "",
            //   onClick: () => props.handleToggleDrawRegionMode(),
            //   disabled: !props.layers["drawnRegions"],
            // }
        ];
    }

    const commandBarFarItems: ICommandBarItemProps[] = [
        {
            key: "Rotate90CounterClockwise",
            text: strings.editorPage.canvas.canvasCommandBar.farItems.rotate.counterClockwise,
            // This needs an ariaLabel since it's icon-only
            ariaLabel: strings.editorPage.canvas.canvasCommandBar.farItems.rotate.counterClockwise,
            iconOnly: true,
            iconProps: { iconName: "Rotate90CounterClockwise" },
            onClick: () => props.handleRotateImage(-90),
        },
        {
            key: "Rotate90Clockwise",
            text: strings.editorPage.canvas.canvasCommandBar.farItems.rotate.clockwise,
            // This needs an ariaLabel since it's icon-only
            ariaLabel: strings.editorPage.canvas.canvasCommandBar.farItems.rotate.clockwise,
            iconOnly: true,
            iconProps: { iconName: "Rotate90Clockwise" },
            style: { marginRight: "1rem" },
            onClick: () => props.handleRotateImage(90),
        },
        {
            key: "zoomOut",
            text: strings.editorPage.canvas.canvasCommandBar.farItems.zoom.zoomOut,
            // This needs an ariaLabel since it's icon-only
            ariaLabel: strings.editorPage.canvas.canvasCommandBar.farItems.zoom.zoomOut,
            iconOnly: true,
            iconProps: { iconName: "ZoomOut" },
            onClick: () => props.handleZoomOut(),
        },
        {
            key: "zoomIn",
            text: strings.editorPage.canvas.canvasCommandBar.farItems.zoom.zoomIn,
            // This needs an ariaLabel since it's icon-only
            ariaLabel: strings.editorPage.canvas.canvasCommandBar.farItems.zoom.zoomIn,
            iconOnly: true,
            iconProps: { iconName: "ZoomIn" },
            onClick: () => props.handleZoomIn(),
        }
    ]
    if (props.parentPage === strings.editorPage.title) {
        commandBarFarItems.push({
            key: "additionalActions",
            title: strings.editorPage.canvas.canvasCommandBar.farItems.additionalActions.text,
            // This needs an ariaLabel since it's icon-only
            ariaLabel: strings.editorPage.canvas.canvasCommandBar.farItems.additionalActions.text,
            className: "additional-action-dropdown",
            iconProps: { iconName: "More" },
            subMenuProps: {
                items: [
                    {
                        key: 'divider_0',
                        itemType: ContextualMenuItemType.Divider,
                    },
                    {
                        key: "runOcrForCurrentDocument",
                        text: strings.editorPage.canvas.canvasCommandBar.farItems.additionalActions.subIMenuItems.runOcrOnCurrentDocument,
                        iconProps: { iconName: "TextDocument" },
                        onClick: () => props.handleRunOcr(),
                    },
                    {
                        key: "runOcrForAllDocuments",
                        text: strings.editorPage.canvas.canvasCommandBar.farItems.additionalActions.subIMenuItems.runOcrOnAllDocuments,
                        iconProps: { iconName: "Documentation" },
                        onClick: () => props.handleRunOcrForAllDocuments(),
                    },
                    {
                        key: "runAutoLabelingCurrentDocument",
                        text: strings.editorPage.canvas.canvasCommandBar.farItems.additionalActions.subIMenuItems.runAutoLabelingCurrentDocument,
                        iconProps: { iconName: "Tag" },
                        disabled: !props.project.predictModelId,
                        title: props.project.predictModelId ? "" :
                            strings.editorPage.canvas.canvasCommandBar.farItems.additionalActions.subIMenuItems.noPredictModelOnProject,
                        onClick: () => {
                            props.handleRunAutoLabelingOnCurrentDocument();
                        },
                    },
                    {
                        key: 'divider_1',
                        itemType: ContextualMenuItemType.Divider,
                    },
                    {
                        key: "deleteAsset",
                        text: strings.editorPage.asset.delete.title,
                        iconProps: { iconName: "Delete" },
                        onClick: () => props.handleAssetDeleted(),
                    }
                ],
            },
        })
    }

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
