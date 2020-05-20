// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export interface ISkipButtonProps {
    skipTo: string;
}

export class SkipButton extends React.Component<ISkipButtonProps> {

    public render() {
        return (
            <div className="skip-button" tabIndex={1}>
                <a href="#" onClick={this.skipToId}>{this.props.children}</a>
            </div>);
    }

    private skipToId = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();

        const collection = document.getElementsByClassName(this.props.skipTo);
        const element = collection.length > 0 ? collection[0] as HTMLElement : null;
        console.log(element);

        if (!element) {
            return;
        }

        element.focus();
        if (element === document.activeElement) {
            return;
        }

        const items = element.querySelectorAll("*");
        // items has no Symbol.iterator
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < items.length; ++i) {
            const item = items[i] as HTMLElement;
            item.focus();
            if (item === document.activeElement) {
                return;
            }
        }
    }
}
