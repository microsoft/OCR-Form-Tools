// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import ReactDOM from "react-dom";
import { AlignProps } from "rc-align";
import { Align } from "./align";
import "./align.scss";

export class AlignPortal extends React.Component<AlignProps> {

    private portalElement: Element;

    constructor(props: AlignProps) {
        super(props);
        this.portalElement = document.createElement("div");
        this.portalElement.classList.add("align-portal-sticky");
    }

    public componentDidMount() {
        document.body.appendChild(this.portalElement);
    }

    public componentWillUnmount() {
        document.body.removeChild(this.portalElement);
    }

    public render() {
        return (
            ReactDOM.createPortal(
                <Align {...this.props}/>
                , this.portalElement)
        );
    }
}
