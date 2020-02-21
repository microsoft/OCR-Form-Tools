// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useEffect } from "react";
import { ArrayFieldTemplateProps } from "react-jsonschema-form";
import { FontIcon, PrimaryButton } from "office-ui-fabric-react";
import { strings } from "../../../../common/strings";
import { getPrimaryBlueTheme, getPrimaryGreenTheme } from "../../../../common/themes";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    useEffect(() => {
        document.getElementById("addSecurityToken").focus();
    });
    return (
        <div>
            {props.canAdd &&
                <div className="array-field-toolbar my-3">
                    <PrimaryButton
                        theme={getPrimaryBlueTheme()}
                        type="button"
                        className=""
                        id="addSecurityToken"
                        autoFocus={true}
                        onClick={props.onAddClick}>
                        <FontIcon iconName = "AddTo" className="mr-2" />
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
                                <FontIcon iconName="Delete" className="mr-2" />
                                {strings.common.delete}
                            </PrimaryButton>
                        </div>
                    }
                </div>;
            })}
        </div>
    );
}
