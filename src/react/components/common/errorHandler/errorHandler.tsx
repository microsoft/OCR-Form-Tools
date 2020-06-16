// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IAppError, ErrorCode, AppError } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import Alert from "../alert/alert";
import { Env } from "../../../../common/environment";

/**
 * Component properties for ErrorHandler component
 */
export interface IErrorHandlerProps extends React.Props<ErrorHandler> {
    error: IAppError;
    onError: (error: IAppError) => void;
    onClearError: () => void;
}

export function throwUnhandledRejectionForEdge(error: any, ignoreNotFound?: boolean, ignoreForbidden?: boolean) {
    const isEdge = !("onunhandledrejection" in window);
    if (isEdge) {
        if (error instanceof AppError && error.errorCode === ErrorCode.BlobContainerIONotFound && ignoreNotFound) {
            return;
        }
        if (error instanceof AppError && error.errorCode === ErrorCode.BlobContainerIOForbidden && ignoreForbidden) {
            return;
        }
        window.dispatchEvent(new CustomEvent("unhandledrejectionForEdge", { detail: error }));
    }
}

/**
 * Component for catching and handling global application errors
 */
export class ErrorHandler extends React.Component<IErrorHandlerProps> {
    public componentDidMount() {
        window.addEventListener("error", this.onWindowError);
        this.registerUnhandledRejectionHandler();
    }

    public componentWillUnmount() {
        window.removeEventListener("error", this.onWindowError);
        this.unregisterUnhandledRejectionHandler();
    }

    public render() {
        const showError = !!this.props.error;
        let localizedError: IAppError = null;
        if (showError) {
            localizedError = this.getLocalizedError(this.props.error);
        }

        if (!showError) {
            return null;
        }
        return (
            <Alert
                title={localizedError ? localizedError.title : ""}
                message={localizedError ? localizedError.message : ""}
                show={showError}
                onClose={this.props.onClearError}
            />
        );
    }

    private registerUnhandledRejectionHandler() {
        const exist = "onunhandledrejection" in window;
        if (exist) {
            window.addEventListener("unhandledrejection", this.onUnhandledRejection);
        } else {
            window.addEventListener("unhandledrejectionForEdge", this.onEdgeUnhandledRejection);
        }
    }

    private unregisterUnhandledRejectionHandler() {
        const exist = "onunhandledrejection" in window;
        if (exist) {
            window.removeEventListener("unhandledrejection", this.onUnhandledRejection);
        } else {
            window.removeEventListener("unhandledrejectionForEdge", this.onEdgeUnhandledRejection);
        }
    }

    /**
     * Unhandled errors that bubbled up to top of stack
     * @param evt Error Event
     */
    private onWindowError = (evt: ErrorEvent) => {
        evt.preventDefault();
        this.handleError(evt.error || evt.message);
    }

    /**
     * Handles async / promise based errors
     * @param evt Unhandled Rejection Event
     */
    private onUnhandledRejection = (evt: PromiseRejectionEvent) => {
        evt.preventDefault();
        this.handleError(evt.reason);
    }

    private onEdgeUnhandledRejection = (event: CustomEvent) => {
        event.preventDefault();
        this.handleError(event.detail);
    }

    /**
     * Handles various error format scenarios
     * @param error The error to handle
     */
    private handleError(error: string | Error | AppError) {
        if (!error) {
            return;
        }

        // This is a special case where we don't need to throw an
        // exception. The error is thrown from within a few layers
        // of components, so we don't have access to ReactDnD (drag and drop)
        // directly. The action is performed correctly, so we
        // don't need to display the error here
        if (this.isReactDnDError(error)) {
            return;
        }
        let appError: IAppError = null;
        // Promise rejection with reason
        if (typeof (error) === "string") {
            // Promise rejection with string base reason
            appError = {
                errorCode: ErrorCode.Unknown,
                message: error || this.getUnknownErrorMessage(error),
            };
        } else if (error instanceof AppError) {
            // Promise rejection with AppError
            const reason = error as IAppError;
            appError = {
                title: reason.title || strings.errors.unknown.title,
                errorCode: reason.errorCode,
                message: reason.message || this.getUnknownErrorMessage(error),
            };
        } else if (error instanceof Error) {
            // Promise rejection with other error like object
            const reason = error as Error;
            appError = {
                title: reason.name || strings.errors.unknown.title,
                errorCode: ErrorCode.Unknown,
                message: reason.message || this.getUnknownErrorMessage(error),
            };
        } else {
            appError = {
                title: strings.errors.unknown.title,
                errorCode: ErrorCode.Unknown,
                message: this.getUnknownErrorMessage(error),
            };
        }

        this.props.onError(appError);
    }

    private getUnknownErrorMessage(e) {
        if (Env.get() !== "production") {
            return (<pre>{JSON.stringify(e, null, 2)}</pre>);
        } else {
            return strings.errors.unknown.message;
        }
    }

    /**
     * Gets a localized version of the error
     * @param appError The error thrown by the application
     */
    private getLocalizedError(appError: IAppError): IAppError {
        if (appError.errorCode === ErrorCode.Unknown) {
            return appError;
        }
        const localizedError = strings.errors[appError.errorCode];
        if (!localizedError) {
            return appError;
        }
        return {
            errorCode: appError.errorCode,
            message: localizedError.message,
            title: localizedError.title,
        };
    }

    private isReactDnDError(e) {
        return e && e.name === "Invariant Violation" && e.message === "Expected to find a valid target.";
    }
}
