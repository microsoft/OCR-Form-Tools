// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { IAppError, IApplicationState, IProject, ErrorCode } from "./models/applicationState";
import IAppErrorActions, * as appErrorActions from "./redux/actions/appErrorActions";
import { ErrorHandler } from "./react/components/common/errorHandler/errorHandler";
import { KeyboardManager, KeyEventType } from "./react/components/common/keyboardManager/keyboardManager";
import { KeyboardBinding } from "./react/components/common/keyboardBinding/keyboardBinding";
import { HelpMenu } from "./react/components/shell/helpMenu";
import { KeyboardShortcuts } from "./react/components/shell/keyboardShortcuts";
import { MainContentRouter } from "./react/components/shell/mainContentRouter";
import { Sidebar } from "./react/components/shell/sidebar";
import { StatusBar } from "./react/components/shell/statusBar";
import { StatusBarMetrics } from "./react/components/shell/statusBarMetrics";
import { TitleBar } from "./react/components/shell/titleBar";
import ShareProjectButton from "./react/components/shell/shareProjectButton";

import { getAppInsights } from './services/telemetryService';
import TelemetryProvider from "./providers/telemetry/telemetryProvider";
import "./App.scss";
import "react-toastify/dist/ReactToastify.css";

interface IAppProps {
    currentProject?: IProject;
    appError?: IAppError;
    actions?: IAppErrorActions;
}

interface IAppState {
    currentProject: IProject,
    showKeyboardShortcuts: boolean,
}

function mapStateToProps(state: IApplicationState) {
    return {
        currentProject: state.currentProject,
        appError: state.appError,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(appErrorActions, dispatch),
    };
}

/**
 * @name - App
 * @description - Root level component for VoTT Application
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class App extends React.Component<IAppProps, IAppState> {
    appInsights: any = null;
    constructor(props, context) {
        super(props, context);
        this.state = {
            currentProject: this.props.currentProject,
            showKeyboardShortcuts: false,
        };
    }

    public componentDidCatch(error: Error) {
        this.props.actions.showError({
            errorCode: ErrorCode.GenericRenderError,
            title: error.name,
            message: error.message,
        });
    }

    private setShowKeyboardShortcuts = (showKeyboardShortcuts: boolean) => {
        this.setState({showKeyboardShortcuts})
    }

    public render() {
        const platform = global && global.process ? global.process.platform : "web";

        return (
            <Fragment>
                <ErrorHandler
                    error={this.props.appError}
                    onError={this.props.actions.showError}
                    onClearError={this.props.actions.clearError} />
                {/* Don't render app contents during a render error */}
                {(!this.props.appError || this.props.appError.errorCode !== ErrorCode.GenericRenderError) &&
                    <KeyboardManager>
                        <KeyboardBinding
                            displayName={"Delete region"}
                            key={"Delete"}
                            keyEventType={KeyEventType.KeyDown}
                            accelerators={[ "/", "?"]}
                            handler={this.handleKeyDown}
                        />
                        <BrowserRouter>
                            <TelemetryProvider after={() => { this.appInsights = getAppInsights() }}>
                                <div className={`app-shell platform-${platform}`}>
                                    <TitleBar icon="TagGroup">
                                        <div className="project-share-menu-icon">
                                            <ShareProjectButton />
                                        </div>
                                        <div  id="keyboard-shortcuts-id" className="app-shortcuts-menu-icon">
                                            <KeyboardShortcuts
                                                showKeyboardShortcuts={this.state.showKeyboardShortcuts}
                                                setShowKeyboardShortcuts={this.setShowKeyboardShortcuts}
                                            />
                                        </div>
                                        <div className="app-help-menu-icon">
                                            <HelpMenu />
                                        </div>
                                    </TitleBar>
                                    <div className="app-main">
                                        <Sidebar project={this.props.currentProject} />
                                        <MainContentRouter setShowKeyboardShortcuts={() => this.setShowKeyboardShortcuts(true)}/>
                                    </div>
                                    <StatusBar>
                                        <StatusBarMetrics project={this.props.currentProject} />
                                    </StatusBar>
                                    <ToastContainer className="frtt-toast-container" role="alert" />
                                </div>
                            </TelemetryProvider>
                        </BrowserRouter>
                    </KeyboardManager>
                }
            </Fragment>
        );
    }

    private handleKeyDown = (keyEvent) => {
        switch (keyEvent.key) {
            case "/":
            case "?":
                this.setShowKeyboardShortcuts(true);
                break;

            default:
                break;
        }
    }
}
