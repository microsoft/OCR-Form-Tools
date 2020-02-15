// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { RefObject } from "react";
import MessageBox, { IMessageBoxProps } from "../messageBox/messageBox";
import { PrimaryButton } from "office-ui-fabric-react";
import { getPrimaryBlueTheme } from "../../../../common/themes";

/**
 * Properties for Alert Component
 * @member closeButtonText - Text displayed on 'Close' button. Default 'OK'
 * @member closeButtonColor - Color of 'Close' button. Default 'primary'
 * @member onClose - Function to execute on alert close
 */
export interface IAlertProps extends IMessageBoxProps {
    closeButtonText?: string;
    closeButtonColor?: string;
    onClose?: () => void;
    show?: boolean;
}

/**
 * State for Alert Component
 * @member params - Arguments passed in the open command
 */
export interface IAlertState {
    params: any[];
}

/**
 * @name - Alert
 * @description - Generic Alert dialog
 */
export default class Alert extends React.Component<IAlertProps, IAlertState> {
    private messageBox: RefObject<MessageBox>;

    constructor(props, context) {
        super(props, context);

        this.state = {
            params: null,
        };

        this.messageBox = React.createRef<MessageBox>();

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onCloseClick = this.onCloseClick.bind(this);
    }

    public render() {
        return (
            <MessageBox
                ref={this.messageBox}
                title={this.props.title}
                message={this.props.message}
                params={this.state.params}
                show={this.props.show}
            >
                <PrimaryButton
                    theme={getPrimaryBlueTheme()}
                    autoFocus={true}
                    onClick={this.onCloseClick}>
                    {this.props.closeButtonText || "OK"}
                </PrimaryButton>
            </MessageBox>
        );
    }

    /**
     * Open Alert dialog
     * @param params - Arguments to be set in state
     */
    public open(...params: any[]): void {
        this.setState({ params }, () => this.messageBox.current.open());
    }

    /**
     * Close Alert dialog
     */
    public close(): void {
        this.messageBox.current.close();
    }

    private onCloseClick() {
        if (this.props.onClose) {
            this.props.onClose.apply(null, this.state.params);
        }
    }
}
