// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { RefObject, ReactElement } from "react";
import MessageBox, { IMessageBoxProps, MessageFormatHandler } from "../messageBox/messageBox";
import { getPrimaryBlueTheme, getDarkTheme } from "../../../../common/themes";
import {
    Customizer,
    Dialog,
    DialogFooter,
    DialogType,
    ICustomizations,
    ITheme,
    PrimaryButton,
} from "office-ui-fabric-react";
/**
 * Properties for Alert Component
 * @member closeButtonText - Text displayed on 'Close' button. Default 'OK'
 * @member onClose - Function to execute on alert close
 * @member confirmButtonTheme - Theme of 'Confirm' button
 */
export interface IAlertProps extends IMessageBoxProps {
    closeButtonText?: string;
    onClose?: () => void;
    confirmButtonTheme?: ITheme;
    show?: boolean;
}

/**
 * State for Alert Component
 * @member params - Arguments passed in the open command
 */
export interface IAlertState {
    params: any[];
    hideDialog: boolean;
}

/**
 * @name - Alert
 * @description - Generic Alert dialog
 */
export default class Alert extends React.Component<IAlertProps, IAlertState> {
    constructor(props, context) {
        super(props, context);

        this.state = {
            params: null,
            hideDialog: true,
        };
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onCloseClick = this.onCloseClick.bind(this);
    }

    public render() {
        const dark: ICustomizations = {
            settings: {
              theme: getDarkTheme(),
            },
            scopedSettings: {},
        };
        const confirmButtonTheme = this.props.confirmButtonTheme;
        const { hideDialog } = this.state;

        return (
            <Customizer {...dark}>
                <Dialog
                    onDismiss={this.close}
                    hidden={!this.props.show}
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: this.props.title,
                        subText: this.getMessage(this.props.message),
                    }}
                    modalProps={{
                        isBlocking: false,
                    }}
                    >
                    <DialogFooter>
                        <PrimaryButton
                            theme={confirmButtonTheme}
                            onClick={this.onCloseClick}
                            text={this.props.closeButtonText || "OK"}/>
                    </DialogFooter>
                </Dialog>
            </Customizer>
        );
    }

    /**
     * Open Alert dialog
     * @param params - Arguments to be set in state
     */
    public open(...params: any[]): void {
        this.setState({ params,  hideDialog: false });
    }

    /**
     * Close Alert dialog
     */
    public close(): void {
        this.setState({ hideDialog: true });
    }

    private onCloseClick() {
        if (this.props.onClose) {
            this.props.onClose.apply(null, this.state.params);
            this.close();

        }
    }

    private getMessage = (message: string | MessageFormatHandler | ReactElement<any>) => {
        if (typeof message === "function") {
            return message.apply(this, this.state.params);
        } else {
            return message;
        }
    }

}
