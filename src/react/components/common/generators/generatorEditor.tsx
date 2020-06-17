// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { FontIcon, IconButton } from "@fluentui/react";
import { IGenerator } from "../../../../models/applicationState";
import {
    ITagClickProps,
    onColorClick,
    onNameClick,
    FormattedItemEditor
} from "../tagInput/tagInputItem";

/**
 * Properties for tag input item
 */
export interface IGeneratorEditorProps {
    /** Tag represented by item */
    region: IGenerator;
    /** Index of tag within tags array */
    index: number;
    /** Tag is currently renaming */
    isRenaming: boolean;
    /** Tag is currently selected */
    isSelected: boolean;
    onClick: (props: ITagClickProps) => void;
    onRename: (newName: string, cancelCallback: () => void) => void;
    cancelRename: () => void;
    setRef: (divRef: React.MutableRefObject<HTMLDivElement>) => void;
    onEnter: () => void,
    onLeave: () => void,
}

const GeneratorEditor: React.FunctionComponent<IGeneratorEditorProps> = (props) => {
    const style = {
        background: props.region.color,
    };

    const itemRef = useRef<HTMLDivElement>();
    const inputElement = useRef<HTMLInputElement>(null);

    useEffect(() => {
        props.setRef(itemRef);
    });

    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        onRenameTag();
    }

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            inputElement.current.blur();
        } else if (e.key === "Escape") {
            props.cancelRename();
        }
    }

    const getItemClassName = () => {
        const classNames = ["tag-item"];
        if (props.isSelected) {
            classNames.push("tag-item-selected");
        }
        return classNames.join(" ");
    }

    const onRenameTag = () => {
        if (!inputElement) {
            return;
        }
        const name = inputElement.current.value.trim();
        props.onRename(name, () => {
            props.cancelRename();
        });
    }

    return (
        <div className={"tag-item-block"}>
            <div
                className={"tag-color"}
                style={style}
                onClick={onColorClick.bind(this, props.onClick)}>
            </div>
            <div className={"tag-item-block-2"}>
                {
                    props.region &&
                    <div
                        ref={itemRef}
                        className={getItemClassName()}
                        style={style}>
                        <div
                            className={"tag-content pr-2"}
                            onClick={onNameClick.bind(this, props.onClick)}>
                            <FormattedItemEditor
                                item={props.region}
                                onMouseEnter={props.onEnter}
                                onMouseLeave={props.onLeave}
                                inputRef={inputElement}
                                isRenaming={props.isRenaming}
                                onInputBlur={onInputBlur}
                                onClick={props.onClick}
                                onInputKeyDown={onInputKeyDown}
                            />
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}

export default GeneratorEditor;
