// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { ReactElement } from "react";
import {
    Customizer,
    Dialog,
    DialogFooter,
    DialogType,
    ICustomizations,
    ITheme,
    PrimaryButton,
    DefaultButton,
} from "office-ui-fabric-react";
import { MessageFormatHandler } from "../messageBox/messageBox";
import { getDarkTheme } from "../../../../common/themes";

/**
 * Properties for Confirm Component
 * @member confirmButtonText - Text displayed on 'Confirm' button. Default 'Yes'
 * @member cancelButtonText - Text displayed on 'Cancel' button. Default 'No'
 * @member confirmButtonTheme - Theme of 'Confirm' button. Default 'primary'
 * @member onConfirm - Function to call on confirm
 * @member onCancel - Function to call on cancel
 */
export interface IConfirmProps {
    title?: string;
    message: string | ReactElement<any> | MessageFormatHandler;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonTheme?: ITheme;
    onConfirm: (...params: any[]) => void;
    onCancel?: (...params: any[]) => void;
}

/**
 * State for Confirm Component
 * @member params - Open ended parameters that are passed on opening modal
 */
export interface IConfirmState {
    params: any[];
    hideDialog: boolean;
}

/**
 * @name - Confirm
 * @description - Dialog for confirming an action
 */
export default class Confirm extends React.Component<IConfirmProps, IConfirmState> {

    constructor(props, context) {
        super(props, context);

        this.state = {
            params: null,
            hideDialog: true,
        };

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onConfirmClick = this.onConfirmClick.bind(this);
        this.onCancelClick = this.onCancelClick.bind(this);
    }

    public render() {
        const dark: ICustomizations = {
            settings: {
              theme: getDarkTheme(),
            },
            scopedSettings: {},
        };
        const { confirmButtonTheme } = this.props;
        const { hideDialog } = this.state;

        return (
            <Customizer {...dark}>
                {!hideDialog &&
                    <Dialog
                        hidden={hideDialog}
                        onDismiss={this.close}
                        dialogContentProps={{
                            type: DialogType.normal,
                            title: this.props.title,
                            subText: this.getMessage(this.props.message),
                        }}
                        modalProps={{
                            isBlocking: true,
                        }}
                    >
                        <DialogFooter>
                            <PrimaryButton
                                theme={confirmButtonTheme}
                                onClick={this.onConfirmClick}
                                text={this.props.confirmButtonText || "Yes"} />
                            <DefaultButton
                                onClick={this.onCancelClick}
                                text={this.props.cancelButtonText || "No"} />
                        </DialogFooter>
                    </Dialog>
                }
            </Customizer>
        );
    }

    /**
     * Open Confirm Dialog
     * @param params - Array of parameters passed to onConfirm function
     */
    public open(...params: any[]): void {
        this.setState({ params, hideDialog: false });
    }

    /**
     * Close Confirm Dialog
     */
    public close(): void {
        this.setState({ hideDialog: true });
    }

    private onConfirmClick() {
        this.props.onConfirm.apply(null, this.state.params);
        this.close();
    }

    private onCancelClick() {
        if (this.props.onCancel) {
            this.props.onCancel.apply(null, this.state.params);
        }
        this.close();
    }

    private getMessage = (message: string | MessageFormatHandler | ReactElement<any>) => {
        if (typeof message === "function") {
            return message.apply(this, this.state.params);
        } else {
            return message;
        }
    }
}
