// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export interface ISkipButtonProps {
    skipTo: string;
}

export class SkipButton extends React.Component<ISkipButtonProps> {

    constructor(props: ISkipButtonProps) {
        super(props);
    }

    public render() {
        return (
            <div className="skip-button">
                <a href="#" onClick={this.skipToId}>{this.props.children}</a>
            </div>);
    }

    private skipToId = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        const element = document.getElementById(this.props.skipTo);
        if (!element) {
            return;
        }

        element.focus();
        if (element === document.activeElement) {
            return;
        }

        const items = element.querySelectorAll("*");
        for (let i = 0; i < items.length; ++i) {
            const item = items[i] as HTMLElement;
            item.focus();
            if (item === document.activeElement) {
                return;
            }
        }
    }
}
