// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { FontIcon, DefaultButton } from "@fluentui/react";
import { getPrimaryGreyTheme } from "../../../../common/themes";

/**
 * Protected input properties
 * @member value - The value to bind to the component
 * @member securityToken - Optional value used to encrypt/decrypt the value
 */
export interface IProtectedInputProps extends React.Props<ProtectedInput> {
    id: string;
    value: string;
    readOnly?: boolean;
    onChange: (value: string) => void;
}

/** Protected input state
 * @member showKey - Whether or not the input field renders as text or password field type
 * @member decryptedValue - The decrypted value to bind to the input field
 */
export interface IProtectedInputState {
    showKey: boolean;
    value: string;
}

/**
 * Protected input Component
 * @description - Used for sensitive fields such as passwords, keys, tokens, etc
 */
export class ProtectedInput extends React.Component<IProtectedInputProps, IProtectedInputState> {
    constructor(props) {
        super(props);

        this.state = {
            showKey: false,
            value: this.props.value || "",
        };

        this.toggleKeyVisibility = this.toggleKeyVisibility.bind(this);
        this.copyKey = this.copyKey.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    public componentDidMount() {
        this.props.onChange(this.props.value);
    }

    public componentDidUpdate(prevProps: IProtectedInputProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({ value: this.props.value || "" });
        }
    }

    public render() {
        const { id, readOnly } = this.props;
        const { showKey, value } = this.state;

        return (
            <div className="input-group">
                <input id={id}
                    type={showKey ? "text" : "password"}
                    readOnly={readOnly}
                    required
                    autoComplete="new-password"
                    className="form-control"
                    value={value}
                    onChange={this.onChange} />
                <div className="input-group-append">
                    <DefaultButton
                        className="portected-input-margin"
                        theme={getPrimaryGreyTheme()}
                        type="button"
                        title={showKey ? "Hide" : "Show"}
                        onClick={this.toggleKeyVisibility}>
                        <FontIcon iconName={showKey ? "Hide3" : "View"}/>
                    </DefaultButton>
                    <DefaultButton
                        theme={getPrimaryGreyTheme()}
                        type="button"
                        title="Copy"
                        onClick={this.copyKey}>
                        <FontIcon iconName="Copy" />
                    </DefaultButton>
                </div>
            </div>
        );
    }

    private onChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ value: e.target.value }, () => this.props.onChange(this.state.value));
    }

    private toggleKeyVisibility() {
        this.setState({
            showKey: !this.state.showKey,
        });
    }

    private async copyKey() {
        const clipboard = (navigator as any).clipboard;
        if (clipboard && clipboard.writeText && typeof clipboard.writeText === "function") {
            await clipboard.writeText(this.state.value);
        }
    }
}
