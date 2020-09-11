// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import Form, { Widget, IChangeEvent, FormValidation } from "react-jsonschema-form";
import { FontIcon, PrimaryButton} from "@fluentui/react";
import { IConnection } from "../../../../models/applicationState";
import { strings, addLocValues } from "../../../../common/strings";
import LocalFolderPicker from "../../common/localFolderPicker/localFolderPicker";
import CustomFieldTemplate from "../../common/customField/customFieldTemplate";
import ConnectionProviderPicker from "../../common/connectionProviderPicker/connectionProviderPicker";
import { ProtectedInput } from "../../common/protectedInput/protectedInput";
import Checkbox from "rc-checkbox";
import "rc-checkbox/assets/index.css";
import { CustomWidget } from "../../common/customField/customField";
import { isBrowser } from "../../../../common/hostProcess";
import { getPrimaryGreenTheme, getPrimaryGreyTheme} from "../../../../common/themes";
import { backFillAriaLabelledBy, getPropertiesIds } from "../../common/jsonSchemaFormHelper";
// tslint:disable-next-line:no-var-requires
const formSchema = addLocValues(require("./connectionForm.json"));
// tslint:disable-next-line:no-var-requires
const uiSchema = addLocValues(require("./connectionForm.ui.json"));

/**
 * Properties for Connection form
 * @member connection - Form being viewed/edited
 * @member onSubmit - Function called upon form submission
 * @member onCancel - Function called upon cancellation of form
 */
export interface IConnectionFormProps extends React.Props<ConnectionForm> {
    connection: IConnection;
    onSubmit: (connection: IConnection) => void;
    onCancel?: () => void;
}

/**
 * State for Connection Form
 * @member providerName - Name of connection provider
 * @member formSchema - JSON Form Schema
 * @member uiSchema - JSON Form UI Schema
 * @member formData - Current state of form data as a Connection
 * @member classNames - HTML Class names for form element
 */
export interface IConnectionFormState {
    providerName: string;
    formSchema: any;
    uiSchema: any;
    formData: IConnection;
    classNames: string[];
}

/**
 * Form for viewing, creating and editing connections
 */
export default class ConnectionForm extends React.Component<IConnectionFormProps, IConnectionFormState> {
    private widgets = {
        localFolderPicker: (LocalFolderPicker as any) as Widget,
        connectionProviderPicker: (ConnectionProviderPicker as any) as Widget,
        protectedInput: (ProtectedInput as any) as Widget,
        checkbox: CustomWidget(Checkbox, (props) => ({
            checked: props.value,
            onChange: (value) => props.onChange(value.target.checked),
            disabled: props.disabled,
        })),
    };

    constructor(props, context) {
        super(props, context);

        this.state = {
            classNames: ["needs-validation"],
            formSchema: { ...formSchema },
            uiSchema: { ...uiSchema },
            providerName: "azureBlobStorage",
            formData: this.props.connection,
        };

        this.onFormCancel = this.onFormCancel.bind(this);
        this.onFormValidate = this.onFormValidate.bind(this);
        this.onFormChange = this.onFormChange.bind(this);
    }

    public componentDidMount() {
        if (this.props.connection) {
            this.bindForm(this.props.connection);
        }
        const connectionFormIds = getPropertiesIds(this.state.formSchema.properties);
        connectionFormIds.forEach((id) => {
            backFillAriaLabelledBy(id);
        });
    }

    public componentDidUpdate(prevProps: IConnectionFormProps) {
        if (prevProps.connection !== this.props.connection) {
            this.bindForm(this.props.connection);
        }
    }

    public render() {
        return (
            <div className="app-connections-page-detail m-3">
                <h3>
                    <FontIcon iconName="Plug" />
                    <span className="px-2">
                        {strings.connections.settings}
                    </span>
                </h3>
                <div className="m-3">
                    {isBrowser() &&
                        <div className="alert alert-warning warning"
                            role="alert">
                            <FontIcon iconName="WarningSolid" className="mr-1" />
                            {strings.formatString(
                                strings.connections.blobCorsWarning,
                                <a
                                    href="https://aka.ms/blob-cors"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    {strings.connections.azDocLinkText}
                                </a>)
                            }
                        </div>
                    }
                    <Form
                        className={this.state.classNames.join(" ")}
                        showErrorList={false}
                        liveValidate={true}
                        noHtml5Validate={true}
                        FieldTemplate={CustomFieldTemplate}
                        validate={this.onFormValidate}
                        widgets={this.widgets}
                        schema={this.state.formSchema}
                        uiSchema={this.state.uiSchema}
                        formData={this.state.formData}
                        onChange={this.onFormChange}
                        onSubmit={(form) => this.props.onSubmit(form.formData)}>
                        <div>
                            <PrimaryButton
                                theme={getPrimaryGreenTheme()}
                                className="mr-2"
                                type="submit">
                                {strings.connections.save}
                            </PrimaryButton>
                            <PrimaryButton
                                theme={getPrimaryGreyTheme()}
                                type="button"
                                onClick={this.onFormCancel}>
                                {strings.common.cancel}
                            </PrimaryButton>
                        </div>
                    </Form>
                </div>
            </div>
        );
    }

    private onFormValidate(connection: IConnection, errors: FormValidation) {
        if (connection.providerType === "") {
            errors.providerType.addError("is a required property");
        }

        if (connection.providerOptions && connection.providerOptions["sas"] && errors.providerOptions["sas"]) {
            const urlRegex = new RegExp(/^(\s*)?(https:\/\/)([^\s])+(\s*)?$/);
            if (urlRegex.test(connection.providerOptions["sas"])) {
                const urlWithQueryRegex = new RegExp(/\?.+=.+/);
                if (!urlWithQueryRegex.test(connection.providerOptions["sas"])) {
                    errors.providerOptions["sas"].addError("should include SAS token in query");
                }
            } else {
                errors.providerOptions["sas"].addError("should match URI format");
            }
        }

        if (this.state.classNames.indexOf("was-validated") === -1) {
            this.setState({
                classNames: [...this.state.classNames, "was-validated"],
            });
        }

        return errors;
    }

    private onFormChange = (args: IChangeEvent<IConnection>) => {
        const providerType = args.formData.providerType;

        if (providerType !== this.state.providerName) {
            this.bindForm(args.formData, true);
        } else {
            this.setState({
                formData: args.formData,
            });
        }
    }

    private onFormCancel() {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    private bindForm(connection: IConnection, resetProviderOptions: boolean = false) {
        const providerType = connection ? connection.providerType : "";
        let newFormSchema: any = this.state.formSchema;
        let newUiSchema: any = this.state.uiSchema;

        if (providerType) {
            const providerSchema = addLocValues(require(`../../../../providers/storage/${providerType}.json`));
            const providerUiSchema = addLocValues(require(`../../../../providers/storage/${providerType}.ui.json`));

            newFormSchema = { ...formSchema };
            newFormSchema.properties["providerOptions"] = providerSchema;

            newUiSchema = { ...uiSchema };
            newUiSchema["providerOptions"] = providerUiSchema;
        } else {
            newFormSchema = { ...formSchema };
            delete newFormSchema.properties["providerOptions"];

            newUiSchema = { ...uiSchema };
            delete newUiSchema["providerOptions"];

            resetProviderOptions = true;
        }

        const formData = { ...connection };
        formData.providerType = providerType;
        if (resetProviderOptions) {
            formData.providerOptions = {};
        }

        this.setState({
            providerName: providerType,
            formSchema: newFormSchema,
            uiSchema: newUiSchema,
            formData,
        });
    }
}
