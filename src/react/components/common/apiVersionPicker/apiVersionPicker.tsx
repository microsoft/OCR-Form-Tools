// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { APIVersionPatches } from "../../../../models/applicationState";

/**
 * Security Token Picker Properties
 * @member id - The id to bind to the input element
 * @member value - The value to bind to the input element
 * @member securityTokens - The list of security tokens to display
 * @member onChange - The event handler to call when the input value changes
 */
export interface IAPIVersionPickerProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
}

/**
 * Security Token Picker
 * @description - Used to display a list of security tokens
 */
export class APIVersionPicker extends React.Component<IAPIVersionPickerProps> {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    public render() {
        return (
            <select id={this.props.id}
                className="form-control"
                value={this.props.value}
                onChange={this.onChange}>
                <option value={APIVersionPatches.patch1}>{APIVersionPatches.patch1}</option>
                <option value={APIVersionPatches.patch2}>{APIVersionPatches.patch2}</option>
                <option value={APIVersionPatches.patch3}>{APIVersionPatches.patch3}</option>
            </select>
        );
    }

    private onChange(e: SyntheticEvent) {
        const inputElement = e.target as HTMLSelectElement;
        this.props.onChange(inputElement.value ? inputElement.value : "2.1-preview.3");
    }
}
