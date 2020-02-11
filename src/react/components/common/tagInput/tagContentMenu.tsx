// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Align } from "../align/align";
import { ITag, FieldType, FieldFormat  } from "../../../../models/applicationState";
import "./tagContextMenu.scss";
import "./tagInputItem.scss";

/**
 * Properties for TagContextMenu
 * @member tag - ITag
 */
export interface ITagContextMenuProps {
    tag: ITag;
    onChange?: (oldTag: ITag, newTag: ITag) => void;
}

/**
 * State for TagContextMenu
 * @member tag - ITag
 */
export interface ITagContextMenuState {
    tag: ITag;
    showFormat?: boolean;
    showType?: boolean;
}

/**
 * Generic modal that displays a message
 */
export default class TagContextMenu extends React.Component<ITagContextMenuProps, ITagContextMenuState> {

    private static filterFormat(type: FieldType): FieldFormat[] {
        switch (type) {
            case FieldType.String:
                return [
                    FieldFormat.NotSpecified,
                    FieldFormat.Alphanumberic,
                    FieldFormat.NoWhiteSpaces,
                ];
            case FieldType.Number:
                return [
                    FieldFormat.NotSpecified,
                    FieldFormat.Currency,
                ];
            case FieldType.Integer:
                return [
                    FieldFormat.NotSpecified,
                ];
            case FieldType.Date:
                return [
                    FieldFormat.NotSpecified,
                    FieldFormat.DMY,
                    FieldFormat.MDY,
                    FieldFormat.YMD,
                ];
            case FieldType.Time:
                return [
                    FieldFormat.NotSpecified,
                ];
            default:
                return [ FieldFormat.NotSpecified ];
        }
    }

    public state: ITagContextMenuState = {
        tag: this.props.tag,
        showFormat: false,
        showType: false,
    };

    private typeRef = React.createRef<HTMLDivElement>();

    private formatRef = React.createRef<HTMLDivElement>();

    public render() {
        const tag = this.state.tag;
        const types = Object.keys(FieldType);
        const formats = TagContextMenu.filterFormat(tag.type);
        const dropdownIconClass = [
            "ms-Icon", "ms-Icon--ChevronDown", "field-background-color", "icon-color", "pr-1",
        ].join(" ");
        const align = {
            // Align top right of source node (dropdown) with top left of target node (tag name row)
            points: ["tr", "br"],
            // Offset source node by 0px in x and 3px in y
            offset: [0, 3],
            // Auto adjust position when source node is overflowed
            overflow: {adjustX: true, adjustY: true},
        };

        return (
            <div className = "field-background field-background-color">
                <div className = "tag-field justify-content-start">
                    <div className = "row-4 tag-field-item">
                        <div
                            ref={this.typeRef}
                            className="field-background-container"
                            onClick={this.handleTypeShow}>
                            <span className="type-selected">{tag.type}</span>
                            <span className={dropdownIconClass}></span>
                        </div>
                        <Align align={align} target={() => this.typeRef.current} monitorWindowResize={true}>
                            {
                                this.state.showType &&
                                <div className={["tag-input-portal", "format-list", "format-items-list"].join(" ")}>
                                    {
                                        types.filter((type) => {
                                            return FieldType[type] !== tag.type;
                                        }).map((type) => {
                                            return (
                                                this.getTypeListItem(this, type)
                                            );
                                        })
                                    }
                                </div>
                            }
                        </Align>
                    </div>
                    <div className = "horizontal-line"></div>
                    <div className = "row-4 tag-field-item">
                        <div
                            ref={this.formatRef}
                            className = "field-background-container"
                            onClick={this.handleFormatShow}>
                            <span>{tag.format}</span>
                            <span className={dropdownIconClass}></span>
                        </div>
                        <Align align={align} target={() => this.formatRef.current}>
                            {
                                this.state.showFormat &&
                                <div className = {["tag-input-portal", "format-list", "format-items-list"].join(" ")}>
                                    {
                                        formats.filter((format) => {
                                            return format !== tag.format;
                                        }).map((format) => {
                                            return (
                                                this.getFormatListItem(this, format)
                                            );
                                        })
                                    }
                                </div>
                            }
                        </Align>
                    </div>
                </div>
            </div>
        );
    }

    private handleTypeChange = (event) => {
        const oldTag = this.state.tag;
        const newTag: ITag = {
            ...oldTag,
            type: event.target.value as FieldType,
            format: FieldFormat.NotSpecified,
        };
        this.setState({ tag: newTag, showType: false }, () => {
            if (this.props.onChange) {
                this.props.onChange(oldTag, newTag);
            }
        });
    }

    private handleTypeShow = (e) => {
        if (e.type === "click") {
            this.setState({showType: !this.state.showType, showFormat: false});
        }
    }

    private handleFormatShow = (e) => {
        if (e.type === "click") {
            this.setState({showFormat: !this.state.showFormat, showType: false});
        }
    }

    private handleFormatChange = (event) => {
        const oldTag = this.state.tag;
        const newTag: ITag = {
            ...oldTag,
            format: event.target.value,
        };

        this.setState({ tag: newTag, showFormat: false }, () => {
            if (this.props.onChange) {
                this.props.onChange(oldTag, newTag);
            }
        });
    }

    private getTypeListItem(props, type) {
        return (
            <button type = "button"
                key = {type}
                onClick = {props.handleTypeChange}
                value = {FieldType[type]}
                className="list-items list-items-color"
            >
                {FieldType[type]}
            </button>
        );
    }

    private getFormatListItem(props, format) {
        return(
            <button type = "button"
                key = {format}
                onClick = {props.handleFormatChange}
                value = {format}
                className="list-items list-items-color"
            >
                {format}
            </button>
        );
    }
}
