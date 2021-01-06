// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ILabel, IFormRegion, ITag } from "../../../../models/applicationState";
import { FontIcon } from "@fluentui/react";

export interface ITagInputItemLabelProps {
    label: ILabel;
    tag?: ITag;
    value: IFormRegion[];
    isOrigin: boolean;
    onLabelEnter?: (label: ILabel) => void;
    onLabelLeave?: (label: ILabel) => void;
    prefixText?: string
}

export interface ITagInputItemLabelState { }

export default function TagInputItemLabel(props: ITagInputItemLabelProps) {
    const { label, onLabelEnter, onLabelLeave, value } = props
    const texts = [];
    let hasEmptyTextValue = false;
    value?.forEach((formRegion: IFormRegion, idx) => {
        if (formRegion.text === "") {
            hasEmptyTextValue = true;
        } else {
            texts.push(formRegion.text);
        }
    })
    const text = texts.join(" ");

    const handleMouseEnter = () => {
        if (props.onLabelEnter) {
            onLabelEnter(label);
        }
    };

    const handleMouseLeave = () => {
        if (props.onLabelLeave) {
            onLabelLeave(label);
        }
    };
    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={[props.isOrigin ? "tag-item-label-origin" : "tag-item-label", "flex-center", "px-2"].join(" ")}
        >
            <div className="flex-center">
                {text ? props.prefixText : undefined} {text}
                {hasEmptyTextValue &&
                    <FontIcon className="pr-1 pl-1" iconName="FieldNotChanged" />
                }
            </div>
        </div>
    );
}
