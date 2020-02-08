// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { MouseEvent } from "react";
import { ITag, ILabel } from "../../../../models/applicationState";
import TagInputItemLabel from "./tagInputItemLabel";
import "./tagInputItem.scss";
import "./tagInput.scss";

export enum TagEditMode {
    Color = "color",
    Name = "name",
    Dropdown = "inputField",
}

export interface ITagClickProps {
    ctrlKey?: boolean;
    altKey?: boolean;
    keyClick?: boolean;
    clickedColor?: boolean;
    clickedDropDown?: boolean;
}

/**
 * Properties for tag input item
 */
export interface ITagInputItemProps {
    /** Tag represented by item */
    tag: ITag;
    /** Index of tag within tags array */
    index: number;
    /** Labels owned by the tag */
    labels: ILabel[];
    /** Tag is currently being edited */
    isBeingEdited: boolean;
    /** Tag is currently locked for application */
    isLocked: boolean;
    /** Tag is currently selected */
    isSelected: boolean;
    /** Tag is currently applied to one of the selected regions */
    appliedToSelectedRegions: boolean;
    /** Function to call upon clicking item */
    onClick: (tag: ITag, props: ITagClickProps) => void;
    /** Apply updates to tag */
    onChange: (oldTag: ITag, newTag: ITag) => void;
    onLabelEnter: (label: ILabel) => void;
    onLabelLeave: (label: ILabel) => void;
    onTagChanged?: (oldTag: ITag, newTag: ITag) => void;
    onCallDropDown: () => void;
}

export interface ITagInputItemState {
    /** Tag is currently being edited */
    isBeingEdited: boolean;
    /** Tag is currently locked for application */
    isLocked: boolean;
    /** Mode of tag editing (text or color) */
    tagEditMode: TagEditMode;
}

export default class TagInputItem extends React.Component<ITagInputItemProps, ITagInputItemState> {

    public static getNameNode(tagNode: Element): Element | undefined {
        if (tagNode) {
            return tagNode.getElementsByClassName(TagInputItem.TAG_NAME_CLASS_NAME)[0];
        }
        return undefined;
    }

    private static TAG_NAME_CLASS_NAME = "tag-item";

    public state: ITagInputItemState = {
        isBeingEdited: false,
        isLocked: false,
        tagEditMode: null,
    };

    public render() {
        const style: any = {
            background: this.props.tag.color,
        };
        return (
            <div className={"tag-item-block"}>
                {
                    this.props.tag &&
                    <li className={this.getItemClassName()} style={style}>
                        <div
                            className={`tag-color`}
                            onClick={this.onColorClick}>
                        </div>
                        <div
                            className={"tag-content"}
                            onClick={this.onNameClick}>
                            {this.getTagContent()}
                        </div>
                        {this.getDropDownButton()}
                        {
                            this.state.isLocked &&
                            <div></div>
                        }
                    </li>
                }
                {this.renderTagDetail()}
            </div>
        );
    }

    public componentDidUpdate(prevProps: ITagInputItemProps) {
        if (prevProps.isBeingEdited !== this.props.isBeingEdited) {
            this.setState({
                isBeingEdited: this.props.isBeingEdited,
            });
        }

        if (prevProps.isLocked !== this.props.isLocked) {
            this.setState({
                isLocked: this.props.isLocked,
            });
        }
    }

    private getDropDownButton = () => {
        return (
            <button
                type ="button"
                onClick = {this.onInputFieldClick}
                className = "ms-Icon ms-Icon--ChevronDown dropdown-background dropdown-border icon-color" ></button>
        );
    }

    private onInputFieldClick = (e: MouseEvent) => {
        e.stopPropagation();
        const ctrlKey = e.ctrlKey || e.metaKey;
        const keyClick = (e.type === "click");
        this.setState({
            tagEditMode: TagEditMode.Dropdown,
        }, () => this.props.onClick(this.props.tag, { ctrlKey, keyClick, clickedDropDown: true }));
    }

    private onColorClick = (e: MouseEvent) => {
        e.stopPropagation();

        const ctrlKey = e.ctrlKey || e.metaKey;
        const keyClick = (e.type === "click");
        this.setState({
            tagEditMode: TagEditMode.Color,
        }, () => this.props.onClick(this.props.tag, { ctrlKey, keyClick, clickedColor: true }));
    }

    private onNameClick = (e: MouseEvent) => {
        e.stopPropagation();

        const ctrlKey = e.ctrlKey || e.metaKey;
        const altKey = e.altKey;
        this.setState({
            tagEditMode: TagEditMode.Name,
        }, () => this.props.onClick(this.props.tag, { ctrlKey, altKey }));
    }

    private getItemClassName = () => {
        const classNames = [TagInputItem.TAG_NAME_CLASS_NAME];
        if (this.props.isSelected) {
            classNames.push("tag-item-selected");
        }
        if (this.props.appliedToSelectedRegions) {
            classNames.push("tag-item-applied");
        }
        return classNames.join(" ");
    }

    private getTagContent = () => {
        const displayIndex = this.getDisplayIndex();
        return (
            <div className={"tag-name-container"}>
                <div className="tag-name-body">
                    {
                        (this.state.isBeingEdited && this.state.tagEditMode === TagEditMode.Name)
                            ?
                            <input
                                className={`tag-name-editor ${this.getContentClassName()}`}
                                type="text"
                                defaultValue={this.props.tag.name}
                                onKeyDown={(e) => this.handleNameEdit(e)}
                                autoFocus={true}
                            />
                            :
                            <span title={this.props.tag.name} className={this.getContentClassName()}>
                                {this.props.tag.name}
                            </span>
                    }
                </div>
                <div className={"tag-index"}>
                    {(displayIndex !== null) &&
                        <span className="tag-index-span border border-white rounded-sm ">{displayIndex}</span>
                    }
                </div>
            </div>
        );
    }

    private renderTagDetail = () => {
        return this.props.labels.map((label, idx) =>
            <TagInputItemLabel
                key={idx}
                label={label}
                onLabelEnter={this.props.onLabelEnter}
                onLabelLeave={this.props.onLabelLeave}
            />,
        );
    }

    private handleNameEdit = (e) => {
        if (e.key === "Enter") {
            const newTagName = e.target.value.trim();
            this.props.onChange(this.props.tag, {
                ...this.props.tag,
                name: newTagName,
            });
        } else if (e.key === "Escape") {
            this.setState({
                isBeingEdited: false,
            });
        }
    }

    private getContentClassName = () => {
        const classNames = ["tag-name-text px-2"];
        if (this.state.isBeingEdited && this.state.tagEditMode === TagEditMode.Color) {
            classNames.push(" tag-color-edit");
        }
        return classNames.join(" ");
    }

    private getDisplayIndex = () => {
        const index = this.props.index;
        const displayIndex = (index === 9) ? 0 : index + 1;
        return (displayIndex < 10) ? displayIndex : null;
    }
}
