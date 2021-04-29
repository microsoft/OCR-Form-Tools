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

interface IAPIVersions {
    versions: string[];
    defaultIndex: number;
}

const APIVersions: IAPIVersions = {
    versions: [APIVersionPatches.patch1, APIVersionPatches.patch2, APIVersionPatches.patch3, APIVersionPatches.patch4],
    defaultIndex: 3,
}

export class APIVersionPicker extends React.Component<IAPIVersionPickerProps> {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    public render() {
        const { versions, defaultIndex } = APIVersions;
        return (
            <select id={this.props.id}
                disabled={!constants.enableAPIVersionSelection}
                defaultValue={versions[defaultIndex]}
                className="form-control"
                value={this.props.value}
                onChange={this.onChange}
            >
                {versions.map((version, index) => {
                    const isDefault = index === defaultIndex;
                    return (<option key={version} value={version}>{`${version}${isDefault ? " (default)" : ""}`}</option>)
                }
                )}
            </select>
        );
    }

    private onChange(e: SyntheticEvent) {
        const inputElement = e.target as HTMLSelectElement;
        this.props.onChange(inputElement.value);
    }
}
