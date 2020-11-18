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
    SpinnerSize,
    Spinner, IChoiceGroupOption, ChoiceGroup
} from "@fluentui/react";
import { MessageFormatHandler } from "../messageBox/messageBox";
import { getDarkTheme, getDefaultDarkTheme } from "../../../../common/themes";
import "./confirm.scss";

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
    loadMessage?: string;
    choiceGroup?: IChoiceGroupOption[];
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
    loading: boolean;
    option: IChoiceGroupOption;
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
            loading: false,
            option: undefined,
        };

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onConfirmClick = this.onConfirmClick.bind(this);
        this.onCancelClick = this.onCancelClick.bind(this);
        this.load = this.load.bind(this)
    }

    public render() {
        const dark: ICustomizations = {
            settings: {
              theme: getDarkTheme(),
            },
            scopedSettings: {},
        };

        const { confirmButtonTheme } = this.props;
        const { hideDialog, loading, option } = this.state;

        return (
            <Customizer {...dark}>
                {!hideDialog &&
                    <Dialog
                        hidden={hideDialog}
                        onDismiss={this.close}
                        dialogContentProps={!loading ? {
                            type: DialogType.normal,
                            title: this.props.title,
                            subText: this.getMessage(this.props.message),
                        } : null}
                        modalProps={{
                            isBlocking: true,
                        }}
                    >
                        {loading && this.props.loadMessage &&
                            <div className="spinner-container">
                                    <Spinner
                                        label={this.props.loadMessage}
                                        labelPosition="right"
                                        theme={getDefaultDarkTheme()}
                                        size={SpinnerSize.large}
                                    />
                            </div>

                        }
                        {this.props.choiceGroup &&
                            <>
                                <h5 className="mt-4" >Configure type and format for:</h5>
                                <ChoiceGroup
                                    className="ml-12px type-format"
                                    defaultSelectedKey={this.props.choiceGroup[0].key}
                                    options={this.props.choiceGroup}
                                    onChange={this.handleOptionChange}
                                    required={true}
                                />
                            </>

                        }
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
        this.setState({ hideDialog: true, loading: false });
    }

    public load(): void {
        this.setState({loading: true});
    }

    private onConfirmClick() {
        if (this.props.choiceGroup) {
            this.props.onConfirm(this.state.option.key);
        } else {
            this.props.onConfirm.apply(null, this.state.params);
        }
        if (this.props.loadMessage) {
            this.load();
        } else {
            this.close();
        }
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

    private handleOptionChange = (e, option: IChoiceGroupOption) => {
        this.setState({option})
    }
}
