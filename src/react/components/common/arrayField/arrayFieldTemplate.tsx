// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useEffect, useState } from "react";
import { ArrayFieldTemplateProps } from "react-jsonschema-form";
import { FontIcon, PrimaryButton } from "@fluentui/react";
import { strings } from "../../../../common/strings";
import { getPrimaryBlueTheme, getPrimaryGreenTheme } from "../../../../common/themes";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
    const [focusFlag, setFocusFlag] = useState(false);

    useEffect(() => {
        if (focusFlag) {
            document.getElementById("addSecurityToken").focus();
            setFocusFlag(false);
        }
    }, [focusFlag]);

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
                                onClick={item.onDropIndexClick(item.index)}
                                onClickCapture={() => setFocusFlag(true)}>
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
