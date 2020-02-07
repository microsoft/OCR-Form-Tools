// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ArrayFieldTemplateProps } from "react-jsonschema-form";
import { strings } from "../../../../common/strings";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    return (
        <div>
            {props.canAdd &&
                <div className="array-field-toolbar my-3">
                    <button type="button" className="btn32px btn-info flex-center" onClick={props.onAddClick}>
                        <i className="ms-Icon ms-Icon--AddTo"></i>
                        <span className="ml-1">Add {props.schema.title}</span>
                    </button>
                </div>
            }
            {props.items.map((item) => {
                return <div className="form-row" key={item.index}>
                    {item.children}
                    {item.hasRemove &&
                        <div className="array-item-toolbar">
                            <label className="labelClose">Delete</label>
                            <button
                                type="button"
                                className="btn32px btn-danger flex-center"
                                onClick={item.onDropIndexClick(item.index)}>
                                <i className="ms-Icon ms-Icon--Delete"></i>
                                <span className="ml-1">{strings.common.delete}</span>
                            </button>
                        </div>
                    }
                </div>;
            })}
        </div>
    );
}
