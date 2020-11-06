// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { APIVersionPatches } from "../../../../models/applicationState";
import { constants } from "../../../../common/constants"

/**
 * api version Picker Properties
 * @member id - The id to bind to the input element
 * @member value - The value to bind to the input element
 * @member onChange - The event handler to call when the input value changes
 */
export interface IAPIVersionPickerProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
}

/**
 * api version Picker
 */
export class APIVersionPicker extends React.Component<IAPIVersionPickerProps> {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    public render() {
        return (
            <select id={this.props.id}
                disabled={!constants.enableAPIVersionSelection}
                defaultValue={constants.enableAPIVersionSelection ? APIVersionPatches.patch2 : undefined}
                className="form-control"
                value={(constants.enableAPIVersionSelection ? this.props.value : APIVersionPatches.patch2)}
                onChange={this.onChange}
            >
                <option value={APIVersionPatches.patch1}>{APIVersionPatches.patch1}</option>
                <option value={APIVersionPatches.patch2}>{APIVersionPatches.patch2 + " (default)"}</option>
                <option value={APIVersionPatches.patch3}>{APIVersionPatches.patch3 + " (testing)"}</option>
            </select>
        );
    }

    private onChange(e: SyntheticEvent) {
        const inputElement = e.target as HTMLSelectElement;
        this.props.onChange(inputElement.value ? inputElement.value : "2.1-preview.3");
    }
}
