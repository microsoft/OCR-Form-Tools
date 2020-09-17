// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ILabel, IFormRegion, ITag, FieldType } from "../../../../models/applicationState";
import { FontIcon } from "@fluentui/react";

export interface ITagInputItemLabelProps {
    label: ILabel;
    onLabelEnter: (label: ILabel) => void;
    onLabelLeave: (label: ILabel) => void;
    tag?: ITag;
}

export interface ITagInputItemLabelState { }

export default function TagInputItemLabel(props: ITagInputItemLabelProps) {
    const { label, onLabelEnter, onLabelLeave, tag = null } = props
    const texts = [];
    let hasEmptyTextValue = false;
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
    if (tag?.type === FieldType.Table && label.value.length > 0) {
        return (
            <div
                className={"tag-item-label px-2"}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}>
                <FontIcon className="pr-1 pl-1" iconName="Table" />
            </div>
        );
    }
        return (
            <div
                className={"tag-item-label flex-center px-2"}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex-center">
                    {text}
                    {hasEmptyTextValue &&
                        <FontIcon className="pr-1 pl-1" iconName="RectangleShape" />
                    }
                </div>
            </div>
        );
    }

