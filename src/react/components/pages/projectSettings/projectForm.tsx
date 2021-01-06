// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import Form, { FormValidation, ISubmitEvent, IChangeEvent, Widget } from "react-jsonschema-form";
import { addLocValues, strings } from "../../../../common/strings";
import { IConnection, IProject, IAppSettings } from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import { ConnectionPickerWithRouter } from "../../common/connectionPicker/connectionPicker";
import { CustomField } from "../../common/customField/customField";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import { ISecurityTokenPickerProps, SecurityTokenPicker } from "../../common/securityTokenPicker/securityTokenPicker";
import "vott-react/dist/css/tagsInput.css";
import { IConnectionProviderPickerProps } from "../../common/connectionProviderPicker/connectionProviderPicker";
import { ProjectSettingAction } from "./projectSettingAction";
import { ProtectedInput } from "../../common/protectedInput/protectedInput";
import { PrimaryButton } from "@fluentui/react";
import { getPrimaryGreenTheme, getPrimaryGreyTheme } from "../../../../common/themes";
import { APIVersionPicker, IAPIVersionPickerProps } from "../../common/apiVersionPicker/apiVersionPicker";

// tslint:disable-next-line:no-var-requires
const newFormSchema = addLocValues(require("./newProjectForm.json"));
// tslint:disable-next-line:no-var-requires
const editFormSchema = addLocValues(require("./editProjectForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./projectForm.ui.json"));

/**
 * Required properties for Project Settings form
 * @member project - Current project to fill form
 * @member connections - Array of connections to use in project
 * @member onSubmit - Function to call on form submission
 * @member onCancel - Function to call on form cancellation
 */
export interface IProjectFormProps extends React.Props<ProjectForm> {
    project: IProject;
    connections: IConnection[];
    appSettings: IAppSettings;
    action: ProjectSettingAction;
    onSubmit: (project: IProject) => void;
    onChange?: (project: IProject) => void;
    onCancel?: () => void;
}

/**
 * Project Form State
 * @member classNames - Class names for HTML form element
 * @member formData - data containing details of project
 * @member formSchema - json schema of form
 * @member uiSchema - json UI schema of form
 */
export interface IProjectFormState {
    classNames: string[];
    formData: IProject;
    formSchema: any;
    uiSchema: any;
}

/**
 * @name - Project Form
 * @description - Form for editing or creating VoTT projects
 */
export default class ProjectForm extends React.Component<IProjectFormProps, IProjectFormState> {
    private widgets = {
        protectedInput: (ProtectedInput as any) as Widget,
        apiVersion: (APIVersionPicker as any) as Widget
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            classNames: ["needs-validation"],
            uiSchema: { ...uiSchema },
            formSchema: {},
            formData: {
                ...this.props.project,
            },
        };

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
    }
    /**
     * Updates state if project from properties has changed
     * @param prevProps - previously set properties
     */
    public componentDidUpdate(prevProps: IProjectFormProps) {
        if (prevProps.project !== this.props.project) {
            this.setState({
                formData: { ...this.props.project },
            });
        }
        if (prevProps.action !== this.props.action) {
            switch (this.props.action) {
                case ProjectSettingAction.Create:
                    this.setState({ formSchema: newFormSchema });
                    break;
                case ProjectSettingAction.Update:
                    this.setState({ formSchema: editFormSchema });
                    break;
                default:
                    this.setState({ formSchema: {} });
            }
        }
    }

    public render() {
        return (
            <Form
                className={this.state.classNames.join(" ")}
                showErrorList={false}
                liveValidate={true}
                noHtml5Validate={true}
                FieldTemplate={CustomFieldTemplate}
                validate={this.onFormValidate}
                fields={this.fields()}
                widgets={this.widgets}
                schema={this.state.formSchema}
                uiSchema={this.state.uiSchema}
                formData={this.state.formData}
                onChange={this.onFormChange}
                onSubmit={this.onFormSubmit}>
                <div>
                    <PrimaryButton
                        theme={getPrimaryGreenTheme()}
                        className="mr-2"
                        type="submit">
                        {strings.projectSettings.save}
                    </PrimaryButton>
                    <PrimaryButton
                        theme={getPrimaryGreyTheme()}
                        type="button"
                        onClick={this.onFormCancel}>
                        {strings.common.cancel}
                    </PrimaryButton>
                </div>
            </Form>
        );
    }

    private fields() {
        return {
            securityToken: CustomField<ISecurityTokenPickerProps>(SecurityTokenPicker, (props) => ({
                id: props.idSchema.$id,
                schema: props.schema,
                value: props.formData,
                securityTokens: this.props.appSettings.securityTokens,
                onChange: props.onChange,
            })),
            sourceConnection: CustomField<IConnectionProviderPickerProps>(ConnectionPickerWithRouter, (props) => {
                return {
                    id: props.idSchema.$id,
                    value: props.formData,
                    connections: this.props.connections,
                    onChange: props.onChange,
                };
            }),
            apiVersion: CustomField<IAPIVersionPickerProps>(APIVersionPicker, (props) => ({
                id: props.idSchema.$id,
                value: props.formData,
                onChange: props.onChange,
            })),
            targetConnection: CustomField<IConnectionProviderPickerProps>(ConnectionPickerWithRouter, (props) => {
                const targetConnections = this.props.connections
                    .filter((connection) => StorageProviderFactory.isRegistered(connection.providerType));

                return {
                    id: props.idSchema.$id,
                    value: props.formData,
                    connections: targetConnections,
                    onChange: props.onChange,
                };
            }),
        };
    }

    private onFormValidate(project: IProject, errors: FormValidation) {
        if (this.props.action === ProjectSettingAction.Create &&
            project.sourceConnection &&
            Object.keys(project.sourceConnection).length === 0) {
            errors.sourceConnection.addError("is a required property");
        }
        if (project.apiUriBase && errors.apiUriBase) {
            const urlRegex = new RegExp(/^(\s*)?(https?:\/\/)/);
            if (urlRegex.test(project.apiUriBase)) {
                const urlRegexOnlyProtocalAndDomain = new RegExp(/^(\s*)?(https?:\/\/)([^\s/])+(\/)?(\s*)?$/);
                if (!urlRegexOnlyProtocalAndDomain.test(project.apiUriBase)) {
                    errors.apiUriBase.addError("should contain only protocol and domain name");
                }
            } else {
                errors.apiUriBase.addError("should match URI format");
            }
        }

        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormChange = (changeEvent: IChangeEvent<IProject>) => {
        if (this.props.onChange) {
            this.props.onChange(changeEvent.formData);
        }
    }

    private onFormSubmit(args: ISubmitEvent<IProject>) {
        const project: IProject = {
            ...args.formData,
            name: args.formData.name.replace(/\s+/g, " ").trim(),
            sourceConnection: args.formData.sourceConnection,
            folderPath: this.normalizeFolderPath(args.formData.folderPath),
            apiUriBase: args.formData.apiUriBase.trim(),
            apiVersion: args.formData.apiVersion,
        };
        this.props.onSubmit(project);
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    private normalizeFolderPath(folderPath: string) {
        // trim space
        let normalizePath = folderPath ? folderPath.trim() : "";

        // trim left slash
        while (normalizePath.length > 0 && (normalizePath.indexOf("/") === 0 || normalizePath.indexOf(".") === 0)) {
            normalizePath = normalizePath.substr(normalizePath.indexOf("/") + 1, normalizePath.length - 1);
        }

        // trim right slash
        while (normalizePath.length > 0 && (normalizePath.lastIndexOf("/") === normalizePath.length - 1)) {
            normalizePath = normalizePath.substr(0, normalizePath.length - 1);
        }

        return normalizePath;
    }
}
