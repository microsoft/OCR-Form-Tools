// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ILabel, IFormRegion } from "../../../../models/applicationState";

export interface ITagInputItemLabelProps {
    label: ILabel;
    onLabelEnter: (label: ILabel) => void;
    onLabelLeave: (label: ILabel) => void;
}

export interface ITagInputItemLabelState {}

export default class TagInputItemLabel extends React.Component<ITagInputItemLabelProps, ITagInputItemLabelState> {
    public render() {
        return (
            <div>
                { this.props.label.key &&
                    <div
                        className={"tag-item-label px-2"}
                    >
                        {"key: " + this.props.label.key.map((formRegion: IFormRegion) => formRegion.text).join(" ")}
                    </div>
                }
                <div
                    className={"tag-item-label px-2"}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}>
                    {
                        (this.props.label.key ? "value: " : "") +
                        this.props.label.value.map((formRegion: IFormRegion) => formRegion.text).join(" ")
                    }
                </div>
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
