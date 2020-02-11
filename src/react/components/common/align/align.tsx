// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import Align_, { AlignProps } from "rc-align";
import "./align.scss";

export function Align(props: AlignProps) {
    const { children } = props;
    return (
        children &&
        <Align_ {...props}>
            <div className="align-portal">
                {children}
            </div>
        </Align_>
    );
}
