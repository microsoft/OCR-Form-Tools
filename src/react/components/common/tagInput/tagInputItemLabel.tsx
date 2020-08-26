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

export interface ITagInputItemLabelState {}

export default class TagInputItemLabel extends React.Component<ITagInputItemLabelProps, ITagInputItemLabelState> {
    public render() {
        console.log(this.props.tag)
        if (this.props?.tag?.type === FieldType.Table && this.props.label.value.length > 0) {
            return (
                <div
                    className={"tag-item-label px-2"}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}>
                    <FontIcon className="pr-1 pl-1" iconName="Table" />
                </div>
            );
        } 
        return (
            <div
                className={"tag-item-label px-2"}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}>
                {this.props.label.value.map((formRegion: IFormRegion) => formRegion.text).join(" ")}
            </div>
        );
    }

    private handleMouseEnter = () => {
        this.props.onLabelEnter(this.props.label);
    }

    private handleMouseLeave = () => {
        this.props.onLabelLeave(this.props.label);
    }
}
