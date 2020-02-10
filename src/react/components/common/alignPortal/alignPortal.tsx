// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import ReactDOM from "react-dom";
import Align, { AlignProps } from "rc-align";
import "./alignPortal.scss";

export class AlignPortal extends React.Component<AlignProps> {

    private portalElement: Element;

    constructor(props: AlignProps) {
        super(props);
        this.portalElement = document.createElement("div");
        this.portalElement.classList.add("align-portal");
    }

    public componentDidMount() {
        document.body.appendChild(this.portalElement);
    }

    public componentWillUnmount() {
        document.body.removeChild(this.portalElement);
    }

    public render() {
        const { children } = this.props;
        return (
            children &&
            ReactDOM.createPortal(
                <Align {...this.props}>
                    {children}
                </Align>
                , this.portalElement)
        );
    }
}
