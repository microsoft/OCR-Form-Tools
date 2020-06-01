// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React, { useState, useRef, MouseEvent } from "react";
import { FontIcon, IconButton } from "office-ui-fabric-react";
import { ITag, ILabel, FieldType, FieldFormat } from "../../../../models/applicationState";
import {
    getFormattedEditorContent,
    ITagClickProps,
    onColorClick,
    onDropdownClick,
    onNameClick,
} from "../tagInput/tagInputItem";
import { IGenerator } from "../../pages/editorPage/editorPage";

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
    /** Function to call upon clicking item */
    onClick: (props: ITagClickProps) => void;
    /** Apply new name to tag */
    onRename: (newName: string, cancelCallback: () => void) => void;
}

const strings = {
    generator: {
        contextualMenu: "Context"
    }
}

const GeneratorEditor: React.FunctionComponent<IGeneratorEditorProps> = (props) => {
    const style = {
        background: props.region.color,
    };

    const [isRenaming, setRenaming] = useState(false);

    const itemRef = useRef<HTMLDivElement>();
    const inputElement = useRef<HTMLInputElement>(null);

    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        onRenameTag();
    }

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            inputElement.current.blur();
        } else if (e.key === "Escape") {
            setRenaming(false);
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
            setRenaming(false);
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
                            {getFormattedEditorContent(
                                props.region,
                                null,
                                ()=>{},
                                ()=>{},
                                inputElement,
                                isRenaming,
                                onInputBlur,
                                onDropdownClick.bind(this, props.onClick),
                                onInputKeyDown,
                            )}
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}

export default GeneratorEditor;
