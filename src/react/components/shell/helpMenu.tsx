// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { strings } from "../../../common/strings";
import "./helpMenu.scss";

export interface IHelpMenuProps {}
export interface IHelpMenuState {}

export class HelpMenu extends React.Component<IHelpMenuProps, IHelpMenuState> {

    private akaMsLink = "https://aka.ms/form-recognizer/docs/label";

    public render() {
        return (
            <a
                className={"help-menu-button"}
                title={strings.titleBar.help}
                href={this.akaMsLink}
                target="_blank"
                rel="noopener noreferrer">
                <i className="ms-Icon ms-Icon--Help ms-Icon-18px"></i>
            </a>
        );
    }
}
