// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import "./modelCompose.scss";

export interface IBlinkProps {
    Notification: string;
}

export interface IBlinkState {
    showText: boolean;
}

export class Blink extends React.Component<IBlinkProps, IBlinkState> {
    /**
     *
     */
    constructor(props) {
        super(props);
        this.state = {showText: true};
        setInterval(() => {
            this.setState((prevState) => ({
                showText: !prevState.showText,
            }));
        }, 400);
    }

    public render() {
        const display = this.props.Notification;
        const style = this.state.showText ? {color: "white"} : {color : "transparent"};
        return(
            <div style = {style} className="blink-field">{display}</div>
        );
    }
}
