// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React, { useState, MouseEvent } from "react";
import { FontIcon, IconButton } from "office-ui-fabric-react";
import { ITag, ILabel, FieldType, FieldFormat } from "../../../../models/applicationState";
import { getFormattedEditorContent } from "../tagInput/tagInputItem";
import { IGeneratorRegion } from "../../pages/editorPage/editorPage";

export interface ITagClickProps {
    keyClick?: boolean;
    clickedColor?: boolean;
    clickedDropDown?: boolean;
}

/**
 * Properties for tag input item
 */
export interface IGeneratorEditorProps {
    /** Tag represented by item */
    region: IGeneratorRegion;
    /** Index of tag within tags array */
    index: number;
    /** Tag is currently renaming */
    isRenaming: boolean;
    /** Tag is currently locked for application */
    isLocked: boolean;
    /** Tag is currently selected */
    isSelected: boolean;
    /** Function to call upon clicking item */
    onClick: (tag: ITag, props: ITagClickProps) => void;
    /** Apply new name to tag */
    onRename: (oldTag: ITag, newName: string, cancelCallback: () => void) => void;
}

const strings = {
    generator: {
        contextualMenu: "Context"
    }
}

const GeneratorEditor: React.FunctionComponent<IGeneratorEditorProps> = (props) => {
    const style: any = {
        background: this.props.tag.color,
    };

    const onDropdownClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        const clickedDropDown = true;
        props.onClick(this.props.tag, { clickedDropDown });
    }

    const onNameClick = (e: MouseEvent) => {
        e.stopPropagation();

        props.onClick(this.props.tag, {});
    }

    const getItemClassName = () => {
        const classNames = ["tag-item"];
        if (this.props.isSelected) {
            classNames.push("tag-item-selected");
        }
        if (this.props.appliedToSelectedRegions) {
            classNames.push("tag-item-applied");
        }
        return classNames.join(" ");
    }

    const renderTagDetail = () => {
        return this.props.labels.map((label, idx) =>
            <TagInputItemLabel
                key={idx}
                label={label}
                onLabelEnter={this.props.onLabelEnter}
                onLabelLeave={this.props.onLabelLeave}
            />);
    }

    const onInputRef = (element: HTMLInputElement) => {
        this.inputElement = element;
        if (element) {
            element.select();
        }
    }

    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        this.onRenameTag();
    }

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            this.inputElement.blur();
        } else if (e.key === "Escape") {
            this.setState({
                isRenaming: false,
            });
        }
    }

    const onRenameTag = () => {
        if (!this.inputElement) {
            return;
        }
        const tag = this.props.tag;
        const name = this.inputElement.value.trim();
        this.props.onRename(tag, name, () => {
            this.setState({
                isRenaming: false,
            });
        });
    }

    return (
        <div className={"tag-item-block"}>
            <div
                className={"tag-color"}
                style={style}
                onClick={this.onColorClick}>
            </div>
            <div className={"tag-item-block-2"}>
                {
                    this.props.tag &&
                    <div
                        ref={this.itemRef}
                        className={getItemClassName()}
                        style={style}>
                        <div
                            className={"tag-content pr-2"}
                            onClick={this.onNameClick}>
                            {getFormattedEditorContent(props.region, null)}
                        </div>
                        {
                            this.state.isLocked &&
                            <div></div>
                        }
                    </div>
                }
                {this.renderTagDetail()}
            </div>
        </div>
    );
}

export default GeneratorEditor;
