// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { MouseEvent } from "react";
import { FontIcon, IconButton } from "@fluentui/react";
import { ITag, ILabel, FieldType, FieldFormat } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import TagInputItemLabel from "./tagInputItemLabel";
import { tagIndexKeys } from "./tagIndexKeys";

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
    /** Tag is currently renaming */
    isRenaming: boolean;
    /** Tag is currently locked for application */
    isLocked: boolean;
    /** Tag is currently selected */
    isSelected: boolean;
    /** Tag is currently applied to one of the selected regions */
    appliedToSelectedRegions: boolean;
    /** Function to call upon clicking item */
    onClick: (tag: ITag, props: ITagClickProps) => void;
    /** Apply new name to tag */
    onRename: (oldTag: ITag, newName: string, cancelCallback: () => void) => void;
    onLabelEnter: (label: ILabel) => void;
    onLabelLeave: (label: ILabel) => void;
    onTagChanged?: (oldTag: ITag, newTag: ITag) => void;
    onDoubleClick?: (label:ILabel) => void;
}

export interface ITagInputItemState {
    /** Tag is currently renaming */
    isRenaming: boolean;

    /** Tag is currently locked for application */
    isLocked: boolean;
}

export default class TagInputItem extends React.Component<ITagInputItemProps, ITagInputItemState> {

    public state: ITagInputItemState = {
        isRenaming: false,
        isLocked: false,
    };

    private itemRef = React.createRef<HTMLDivElement>();
    private inputElement: HTMLInputElement;

    public componentDidUpdate(prevProps: ITagInputItemProps) {
        if (prevProps.isRenaming !== this.props.isRenaming) {
            this.setState({
                isRenaming: this.props.isRenaming,
            });
        }

        if (prevProps.isLocked !== this.props.isLocked) {
            this.setState({
                isLocked: this.props.isLocked,
            });
        }
    }

    public render() {
        const style: any = {
            background: this.props.tag.color,
        };

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
                            className={this.getItemClassName()}
                            style={style}>
                            <div
                                className={"tag-content pr-2"}
                                onDoubleClick={this.onNameDoubleClick}
                                onClick={this.onNameClick}>
                                {this.getTagContent()}
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

    public getTagNameRef() {
        return this.itemRef;
    }

    private onDropdownClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        const clickedDropDown = true;
        this.props.onClick(this.props.tag, { clickedDropDown });
    }

    private onColorClick = (e: MouseEvent) => {
        e.stopPropagation();

        const ctrlKey = e.ctrlKey || e.metaKey;
        const altKey = e.altKey;
        const clickedColor = true;
        this.props.onClick(this.props.tag, { ctrlKey, altKey, clickedColor });
    }

    private onNameClick = (e: MouseEvent) => {
        e.stopPropagation();

        const ctrlKey = e.ctrlKey || e.metaKey;
        const altKey = e.altKey;
        this.props.onClick(this.props.tag, { ctrlKey, altKey });
    }

    private onNameDoubleClick = (e:MouseEvent) => {
        e.stopPropagation();
        const { labels } = this.props;
        if (labels.length > 0) {
            this.props.onDoubleClick(labels[0]);
        }
    }

    private getItemClassName = () => {
        const classNames = ["tag-item"];
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
            <div className={"tag-name-container"}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}>
                {
                    (this.isTypeOrFormatSpecified()) &&
                    <FontIcon iconName="Link" className="pl-1" />
                }
                <div className="tag-name-body">
                    {
                        this.state.isRenaming
                        ?
                        <input
                            ref={this.onInputRef}
                            className={`tag-name-editor ${this.getContentClassName()}`}
                            type="text"
                            defaultValue={this.props.tag.name}
                            onKeyDown={(e) => this.onInputKeyDown(e)}
                            onBlur={this.onInputBlur}
                            autoFocus={true}
                        />
                        :
                        <span title={this.props.tag.name} className={this.getContentClassName()}>
                            {this.props.tag.name}
                        </span>
                    }
                </div>
                <div className={"tag-icons-container"}>
                    {(displayIndex !== null)
                        ?
                        <span className="tag-index-span border border-white rounded-sm ">{displayIndex}</span>
                        :
                        <span className="tag-index-span"></span>
                    }
                    <IconButton
                        title={strings.tags.toolbar.contextualMenu}
                        ariaLabel={strings.tags.toolbar.contextualMenu}
                        className="tag-input-toolbar-iconbutton ml-2"
                        iconProps={{iconName: "ChevronDown"}}
                        onClick={this.onDropdownClick} />
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
            />);
    }

    private onInputRef = (element: HTMLInputElement) => {
        this.inputElement = element;
        if (element) {
            element.select();
        }
    }

    private onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        this.onRenameTag();
    }

    private onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            this.inputElement.blur();
        } else if (e.key === "Escape") {
            this.setState({
                isRenaming: false,
            });
        }
    }

    private onRenameTag() {
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

    private getContentClassName = () => {
        const classNames = ["tag-name-text px-2 pb-1"];
        if (this.isTypeOrFormatSpecified()) {
            classNames.push("tag-name-text-typed");
        }
        return classNames.join(" ");
    }

    private getDisplayIndex = () => {
        const index = this.props.index;
        if (index >= 0 && index < tagIndexKeys.length) {
            return tagIndexKeys[index];
        }
        return null;
    }

    private isTypeOrFormatSpecified = () => {
        const {tag} = this.props;
        return (tag.type && tag.type !== FieldType.String) ||
            (tag.format && tag.format !== FieldFormat.NotSpecified);
    }

    private handleMouseEnter = () => {
        const { labels } = this.props;
        if (labels.length > 0) {
            this.props.onLabelEnter(labels[0]);
        }
    }

    private handleMouseLeave = () => {
        const { labels } = this.props;
        if (labels.length > 0) {
            this.props.onLabelLeave(labels[0]);
        }
    }
}
