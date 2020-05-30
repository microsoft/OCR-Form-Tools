// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { ReactElement } from "react";
import { MessageFormatHandler } from "../messageBox/messageBox";
import { getDarkTheme, getPrimaryBlueTheme } from "../../../../common/themes";
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
export interface IAlertProps {
    title?: string;
    message: string | ReactElement<any> | MessageFormatHandler;
    closeButtonText?: string;
    confirmButtonTheme?: ITheme;
    show?: boolean;
    onClose?: () => void;
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
    constructor(props, context) {
        super(props, context);

        this.state = {
            params: null,
        };
        this.onCloseClick = this.onCloseClick.bind(this);
    }

    public render() {
        const dark: ICustomizations = {
            settings: {
              theme: getDarkTheme(),
            },
            scopedSettings: {},
        };

        return (
            <Customizer {...dark}>
                {this.props.show &&
                    <Dialog
                        onDismiss={this.onCloseClick}
                        hidden={!this.props.show}
                        dialogContentProps={{
                            type: DialogType.normal,
                            title: this.props.title,
                            subText: this.getMessage(this.props.message),
                            isMultiline: true,
                        }}
                        modalProps={{
                            isBlocking: false,
                        }}
                        >
                        <DialogFooter>
                            <PrimaryButton
                                theme={getPrimaryBlueTheme()}
                                onClick={this.onCloseClick}
                                text={this.props.closeButtonText || "OK"}/>
                        </DialogFooter>
                    </Dialog>
                }
            </Customizer>
        );
    }

    private onCloseClick() {
        if (this.props.onClose) {
            this.props.onClose.apply(null, this.state.params);
        }
    }

    private getMessage = (message: string | MessageFormatHandler | ReactElement<any>) => {
        if (typeof message === "function") {
            return message.apply(this, this.state.params);
        } else {
            if (message.toString().includes("\n")){
                const messageList = message.toString().split("\n");
                const elements = [];
                messageList.forEach((m) => {
                    elements.push(<div>{m}<br/></div>);
                })
                message = <div>{elements}</div>
            }
            return message;
        }
    }

}
