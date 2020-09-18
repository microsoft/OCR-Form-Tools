// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Coachmark, DirectionalHint, FontIcon, TeachingBubbleContent } from "@fluentui/react";
import axios from "axios";
import React, { RefObject } from "react";
import { constants } from "../../../common/constants";
import { interpolate, strings } from "../../../common/strings";
import "./statusBar.scss";

interface IVersionInfo {
    version: string;
    date: Date;
    commit: string;
}

interface IVersionData {
    tag: string;
    versions: { [tag: string]: IVersionInfo; }
}

interface IStatusBarState {
    showNotify: boolean;
    candidateVersion?: IVersionInfo;
}

export class StatusBar extends React.Component<{}, IStatusBarState> {
    private currentVersion: { tag: string, info: IVersionInfo };
    private versionRef: RefObject<HTMLLIElement> = React.createRef();

    constructor(props) {
        super(props);
        const versionInfo: IVersionData = require("../common/version-info.json");
        this.currentVersion = {
            tag: versionInfo.tag,
            info: versionInfo.versions[versionInfo.tag]
        };
        this.state = {
            showNotify: false,
        };
    }
    componentDidMount() {
        axios.get<IVersionData>(constants.versionInfoUrl)
            .then((res) => {
                const versionInfo = res.data;
                const version = versionInfo.versions[this.currentVersion.tag];
                const candidateVersion = this.getCandidateVersion(version);
                this.setState({
                    candidateVersion,
                    showNotify: false
                });
            })
            .catch(_ => {
                this.setState({
                    candidateVersion: null,
                    showNotify: false
                })
            });
    }
    getCandidateVersion(version: IVersionInfo) {
        if (!version) {
            return null;
        }
        const versionDate = version.date instanceof Date ? version.date : new Date(version.date);
        const currentVersionDate = this.currentVersion.info.date instanceof Date ?
            this.currentVersion.info.date : new Date(this.currentVersion.info.date);
        return (versionDate > currentVersionDate) ? version : null;
    }
    hideCoachmark = () => {
        this.setState({ showNotify: false });
    }
    showCoachmark = () => {
        if (this.state.candidateVersion && !this.state.showNotify) {
            this.setState({ showNotify: true });
        }
    }
    public render() {
        return (
            <div className="status-bar">
                <div className="status-bar-main">{this.props.children}</div>
                {this.state.candidateVersion && this.state.showNotify &&
                    <Coachmark
                        target={this.versionRef.current}
                        positioningContainerProps={{ directionalHint: DirectionalHint.topRightEdge }}
                    >
                        <TeachingBubbleContent
                            headline={strings.statusBar.newVersionAvaliable.title}
                            hasCloseButton
                            closeButtonAriaLabel="Close"
                            onDismiss={this.hideCoachmark}
                        >
                            <div>
                                {interpolate(strings.statusBar.newVersionAvaliable.message, { newVersion: this.state.candidateVersion })}
                            </div>
                        </TeachingBubbleContent>
                    </Coachmark>
                }
                <div className={["status-bar-version", this.state.candidateVersion ? "new-version-avaliable" : ""].join(" ")}
                    onMouseOver={this.showCoachmark}>
                    <ul>
                        <li ref={this.versionRef}>
                            <a href="https://github.com/microsoft/OCR-Form-Tools/blob/master/CHANGELOG.md" target="blank" rel="noopener noreferrer">
                                <FontIcon iconName="BranchMerge" />
                                <span>{constants.appVersion}-b92b73b</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
