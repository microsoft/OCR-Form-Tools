// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { IAppError, IApplicationState, IProject, ErrorCode } from "./models/applicationState";
import { strings } from "./common/strings";
import IAppErrorActions, * as appErrorActions from "./redux/actions/appErrorActions";
import { ErrorHandler } from "./react/components/common/errorHandler/errorHandler";
import { KeyboardManager } from "./react/components/common/keyboardManager/keyboardManager";
import { HelpMenu } from "./react/components/shell/helpMenu";
import { KeyboardShortcuts } from "./react/components/shell/keyboardShortcuts";
import { MainContentRouter } from "./react/components/shell/mainContentRouter";
import { Sidebar } from "./react/components/shell/sidebar";
import { StatusBar } from "./react/components/shell/statusBar";
import { StatusBarMetrics } from "./react/components/shell/statusBarMetrics";
import { TitleBar } from "./react/components/shell/titleBar";
import { SkipButton } from "./react/components/shell/skipButton";
import "./App.scss";
import "react-toastify/dist/ReactToastify.css";

interface IAppProps {
    currentProject?: IProject;
    appError?: IAppError;
    actions?: IAppErrorActions;
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
export default class App extends React.Component<IAppProps> {
    constructor(props, context) {
        super(props, context);

        this.state = {
          currentProject: this.props.currentProject,
        };
    }

    public componentDidCatch(error: Error) {
        this.props.actions.showError({
            errorCode: ErrorCode.GenericRenderError,
            title: error.name,
            message: error.message,
        });
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
                        <BrowserRouter>
                            <div className={`app-shell platform-${platform}`}>
                                <TitleBar icon="TagGroup">
                                <div className="app-hotkeys-menu-icon">
                                    <KeyboardShortcuts />
                                </div>
                                <div className="app-help-menu-icon">
                                    <HelpMenu />
                                </div>
                                </TitleBar>
                                <div className="app-main">
                                    <Sidebar project={this.props.currentProject} />
                                    <MainContentRouter />
                                </div>
                                <StatusBar>
                                    <StatusBarMetrics project={this.props.currentProject} />
                                </StatusBar>
                                <ToastContainer className="frtt-toast-container" role="alert"/>
                            </div>
                        </BrowserRouter>
                        <SkipButton skipTo="appSidebar">{strings.common.skipToSidebar}</SkipButton>
                    </KeyboardManager>
                }
            </Fragment>
        );
    }
}
