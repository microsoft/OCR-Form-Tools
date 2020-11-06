// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ILabel, IFormRegion, ITag, FieldType, TagInputMode } from "../../../../models/applicationState";
import { FontIcon } from "@fluentui/react";

export interface ITagInputItemLabelProps {
    label: ILabel;
    value: IFormRegion[];
    isOrigin: boolean;
    tag?: ITag;
    handleLabelTable?: (tagInputMode: TagInputMode, selectedTableTagToLabel) => void;
    onLabelEnter?: (label: ILabel) => void;
    onLabelLeave?: (label: ILabel) => void;
    prefixText?: string
}

export interface ITagInputItemLabelState { }

export default function TagInputItemLabel(props: ITagInputItemLabelProps) {
    const { label, onLabelEnter, onLabelLeave, tag = null } = props
    const texts = [];
    let hasEmptyTextValue = false;

    // this.props.value.forEach((formRegion: IFormRegion, idx) => {
    label.value.forEach((formRegion: IFormRegion, idx) => {
        if (formRegion.text === "") {
            hasEmptyTextValue = true;
        } else {
            texts.push(formRegion.text);
        }
    })
    const text = texts.join(" ");

    const handleMouseEnter = () => {
        onLabelEnter(label);
    };
    const handleMouseLeave = () => {
        onLabelLeave(label);
    };

    // console.log("# tag:", tag)
    if (tag?.type === FieldType.Table) {
        return (
            <div
                className={"tag-item-label px-2"}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <FontIcon
                    onClick={() => props.handleLabelTable(TagInputMode.LabelTable, tag)}
                    className="pr-1 pl-1" iconName="Table"
                />
            </div>
        );
    } else {
        return (
            <div className={[props.isOrigin ? "tag-item-label-origin" : "tag-item-label", "flex-center", "px-2"].join(" ")}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex-center">
                    {props.prefixText} {text}
                    {hasEmptyTextValue &&
                        <FontIcon className="pr-1 pl-1" iconName="FieldNotChanged" />
                    }
                </div>
            </div>
        );
    }
};
