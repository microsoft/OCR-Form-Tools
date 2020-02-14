// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { ArrayFieldTemplateProps } from "react-jsonschema-form";
import { strings } from "../../../../common/strings";
import { PrimaryButton } from "office-ui-fabric-react";
import { getPrimaryBlueTheme, getPrimaryGreenTheme } from "../../../../common/themes";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    return (
        <div>
            {props.canAdd &&
                <div className="array-field-toolbar my-3">
                    <PrimaryButton
                        theme={getPrimaryBlueTheme()}
                        type="button"
                        className=""
                        onClick={props.onAddClick}>
                        <i className="ms-Icon ms-Icon--AddTo mr-2"></i>
                        Add {props.schema.title}
                    </PrimaryButton>
                </div>
            }
            {props.items.map((item) => {
                return <div className="form-row" key={item.index}>
                    {item.children}
                    {item.hasRemove &&
                        <div className="array-item-toolbar">
                            <label className="labelClose">Delete</label>
                            <PrimaryButton
                                theme={getPrimaryGreenTheme()}
                                type="button"
                                className="flex-center"
                                onClick={item.onDropIndexClick(item.index)}>
                                <i className="ms-Icon ms-Icon--Delete mr-2"></i>
                                {strings.common.delete}
                            </PrimaryButton>
                        </div>
                    }
                </div>;
            })}
        </div>
    );
}
