// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { Prompt } from "react-router-dom";

export interface IPreventLeavingProps {
    when?: boolean;
    message: string;
}

export default class PreventLeaving extends React.Component<IPreventLeavingProps> {
    public async componentDidMount() {
        window.addEventListener("beforeunload", this.onBeforeUnload);
    }

    public componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onBeforeUnload);
    }

    public render() {
        return (
            <Prompt when={!!this.props.when} message={this.props.message} />
        );
    }

    private onBeforeUnload = (ev: BeforeUnloadEvent) => {
        if (this.props.when) {
            // Most browsers don't support custom text anymore.
            // Safari requires a non-empty string.
            const msg = this.props.message || "Are you sure you want to leave this page?";
            ev.returnValue = msg;
            return msg;
        }
    }
}
