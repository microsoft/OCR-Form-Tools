// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export interface IIconButtonProps {
    iconClassName: string;
    buttonClassName?: string;
    title?: string;
    onClick?: (event: any) => void;
}

export function IconButton(props: IIconButtonProps) {
    const { iconClassName, buttonClassName, title, onClick } = props;

    return (
        <button className={"bg-transparent border-0 px-0 color-white " + buttonClassName}
            title={title}
            onClick={onClick}>
            <i className={iconClassName}></i>
        </button>
    );
}
