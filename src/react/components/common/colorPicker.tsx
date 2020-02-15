// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { GithubPicker } from "react-color";

export interface IColorPickerProps {
    show: boolean;
    color: string;
    colors: string[];
    onEditColor: (color: string) => void;
}

export class ColorPicker extends React.Component<IColorPickerProps> {

    private pickerBackground = "#252526";

    public render() {
        return (
            this.props.show &&
            this.GithubPicker()
        );
    }

    private onChange = (color) => {
        this.props.onEditColor(color.hex);
    }

    private GithubPicker = () => {
        return (
            <div className="color-picker-container">
                <GithubPicker
                    color={{hex: this.props.color}}
                    onChangeComplete={this.onChange}
                    colors={this.props.colors}
                    width={160}
                    styles={{
                        default: {
                            card: {
                                background: this.pickerBackground,
                            },
                        },
                    }}
                    triangle={"hide"}
                />
            </div>
        );
    }
}
