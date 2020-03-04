// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Fragment, useEffect } from "react";
import { FieldTemplateProps } from "react-jsonschema-form";
import { backFillAriaLabelledBy } from "../jsonSchemaFormHelper";

export default function CustomFieldTemplate(props: FieldTemplateProps) {
    const { id, label, required, description, rawErrors, schema, uiSchema, children } = props;
    useEffect(() => {
        backFillAriaLabelledBy(id);
    });

    const classNames = [];
    if (props.schema.type === "object") {
        classNames.push("object-wrapper");
    } else {
        classNames.push("form-group");
    }

    if (rawErrors && rawErrors.length > 0) {
        classNames.push("is-invalid");
    } else {
        classNames.push("is-valid");
    }

    return (
        <div className={classNames.join(" ")}>
            { /* Render label for non-objects except for when an object has defined a ui:field template */}
            {schema.type !== "array" &&
                (schema.type !== "object" || (schema.type === "object" && uiSchema["ui:field"])) &&
                <label htmlFor={id}>{label}{required ? "*" : null}</label>
            }
            {schema.type === "array" &&
                <Fragment>
                    <h4>{label}</h4>
                    {description && <small>{description}</small>}
                </Fragment>
            }
            {children}
            {
                schema.type !== "array" && description &&
                <small className="text-muted">
                    {description}
                </small>
            }
            {rawErrors && rawErrors.length > 0 &&
                <div className="invalid-feedback" id={id + "_errors"}>
                    {rawErrors.map((errorMessage, idx) => <p key={idx}>{label} {errorMessage}</p>)}
                </div>
            }
        </div>
    );
}
