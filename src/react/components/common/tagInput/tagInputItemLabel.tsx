// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {ILabel, IFormRegion} from "../../../../models/applicationState";
import {FontIcon} from "@fluentui/react";

export interface ITagInputItemLabelProps {
    label: ILabel;
    value: IFormRegion[];
    isOrigin: boolean;
    onLabelEnter?: (label: ILabel) => void;
    onLabelLeave?: (label: ILabel) => void;
    prefixText?:string
}

export interface ITagInputItemLabelState {}

export default class TagInputItemLabel extends React.Component<ITagInputItemLabelProps, ITagInputItemLabelState> {
    public render() {
        const texts = [];
        let hasEmptyTextValue = false;
        this.props.value.forEach((formRegion: IFormRegion, idx) => {
            if (formRegion.text === "") {
                hasEmptyTextValue = true;
            } else {
                texts.push(formRegion.text);
            }
        })
        const text = texts.join(" ");
        return (
            <div
                className={[this.props.isOrigin ? "tag-item-label-origin" : "tag-item-label", "flex-center", "px-2"].join(" ")}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
            >
                <div className="flex-center">
                    {this.props.prefixText} {text}
                    {hasEmptyTextValue &&
                        <FontIcon className="pr-1 pl-1" iconName="FieldNotChanged" />
                    }
                </div>
            </div>
        );
    }

    private handleMouseEnter = () => {
        if (this.props.onLabelEnter) {
            this.props.onLabelEnter(this.props.label);
        }
    }

    private handleMouseLeave = () => {
        if (this.props.onLabelLeave) {
            this.props.onLabelLeave(this.props.label);
        }
    }
}
