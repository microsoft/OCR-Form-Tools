// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ITag, FieldType, FieldFormat  } from "../../../../models/applicationState";
import "./tagTypeFormat.scss";
import "./tagInputItem.scss";

/**
 * Properties for Tag Type Format component
 * @member tag - ITag
 */
export interface ITagTypeFormatProps {
    tag: ITag;
    onChange?: (oldTag: ITag, newTag: ITag) => void;
}

/**
 * State for Tag Type Format
 * @member tag - ITag
 */
export interface ITagFormatState {
    tag: ITag;
    showFormat?: boolean;
    showType?: boolean;
}

/**
 * Generic modal that displays a message
 */
export default class TagTypeFormat extends React.Component<ITagTypeFormatProps, ITagFormatState> {

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

    public state: ITagFormatState = {
        tag: this.props.tag,
        showFormat: false,
        showType: false,
    };

    public render() {
        const tag = this.state.tag;
        const types = Object.keys(FieldType);
        const formats = TagTypeFormat.filterFormat(tag.type);
        const dropdownIconClass = [
            "ms-Icon", "ms-Icon--ChevronDown", "field-background-color", "icon-color", "pr-1",
        ].join(" ");

        return (
            <div className = "field-background field-background-color">
                <div className = "tag-field justify-content-start">
                    <div className = "row-4 tag-field-item">
                        <div onClick={this.handleTypeShow} className = "field-background-container">
                            <span className="type-selected">{tag.type}</span>
                            <span className={dropdownIconClass}></span>
                        </div>
                        <div className = {this.showHideType()}>
                            <ol className = "format-items-list">
                                {
                                    types.map((type) => {
                                        return(
                                            this.getTypeListItem(this, type)
                                        );
                                    })
                                }
                            </ol>
                        </div>
                    </div>
                    <div className = "horizontal-line"></div>
                    <div className = "row-4 tag-field-item">
                        <div onClick={this.handleFormatShow} className = "field-background-container">
                            <span>{tag.format}</span>
                            <span className={dropdownIconClass}></span>
                         </div>
                        <div className = {this.showHideFormat()}>
                            <ol className = "format-items-list">
                                {
                                    formats.map((format) => {
                                        return (
                                            this.getFormatListItem(this, format)
                                        );
                                    })
                                }
                            </ol>
                        </div>
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

    private showHideType = () => {
        let formatHideClass = ["format-items-hide"];
        if (this.state.showType) {
            formatHideClass = [];
        }
        return formatHideClass.join(" ");
    }

    private handleFormatShow = (e) => {
        if (e.type === "click") {
            this.setState({showFormat: !this.state.showFormat, showType: false}); }
        }

    private showHideFormat = () => {
        let formatHideClass = ["format-items-hide", "format-list"];
        if (this.state.showFormat) {
            formatHideClass = ["format-list"];
        }
        return formatHideClass.join(" ");
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
