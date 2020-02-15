// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import RcAlign, { AlignProps } from "rc-align";
import "./align.scss";

export function Align(props: AlignProps) {
    const { children } = props;
    return (
        children &&
        <RcAlign {...props}>
            <div className="align-portal">
                {children}
            </div>
        </RcAlign>
    );
}
