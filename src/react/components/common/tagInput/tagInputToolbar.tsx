// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { FontIcon } from "office-ui-fabric-react";
import { strings } from "../../../../common/strings";
import { ITag } from "../../../../models/applicationState";
import "./tagInput.scss";
import "./tagInputToolBar.scss";

enum Categories {
    General,
    Separator,
    Modifier,
}

/** Properties for tag input toolbar */
export interface ITagInputToolbarProps {
    /** Currently selected tag */
    selectedTag: ITag;
    /** Function to call when add tags button is clicked */
    onAddTags: () => void;
    /** Function to call when search tags button is clicked */
    onSearchTags: () => void;
    /** Function to call when lock tags button is clicked */
    onLockTag: (tag: ITag) => void;
    /** Function to call when edit tag button is clicked */
    onEditTag: (tag: ITag) => void;
    /** Function to call when delete button is clicked */
    onDelete: (tag: ITag) => void;
    /** Function to call when one of the re-order buttons is clicked */
    onReorder: (tag: ITag, displacement: number) => void;
}

interface ITagInputToolbarItemProps {
    displayName: string;
    className: string;
    icon?: string;
    category?: Categories;
    handler?: () => void;
    accelerators?: string[];
}

export default class TagInputToolbar extends React.Component<ITagInputToolbarProps> {
    public render() {
        return (
            <div className="tag-input-toolbar">
                {this.handleTagIcon()}
            </div>
        );
    }

    private onToolbarItemClick = (e: SyntheticEvent, itemConfig: ITagInputToolbarItemProps): void => {
        e.stopPropagation();
        itemConfig.handler();
    }

    private getToolbarItems = (): ITagInputToolbarItemProps[] => {
        return [
            {
                displayName: strings.tags.toolbar.add,
                className: "plus",
                icon: "Add",
                category: Categories.General,
                handler: this.handleAdd,
            },
            {
                displayName: strings.tags.toolbar.search,
                className: "search",
                icon: "Search",
                category: Categories.General,
                handler: this.handleSearch,
            },
            {
                displayName: strings.tags.toolbar.vertiline,
                className: "separator",
                category: Categories.Separator,
            },
            {
                displayName: strings.tags.toolbar.edit,
                className: "edit",
                icon: "Rename",
                category: Categories.Modifier,
                handler: this.handleEdit,
            },
            {
                displayName: strings.tags.toolbar.moveUp,
                className: "up",
                icon: "Up",
                category: Categories.Modifier,
                handler: this.handleArrowUp,
            },
            {
                displayName: strings.tags.toolbar.moveDown,
                className: "down",
                icon: "Down",
                category: Categories.Modifier,
                handler: this.handleArrowDown,
            },
            {
                displayName: strings.tags.toolbar.delete,
                className: "delete",
                icon: "Delete",
                category: Categories.Modifier,
                handler: this.handleDelete,
            },
        ];
    }

    private handleTagIcon = () => {
        const modifierClassNames = ["tag-input-toolbar-icon"];
        if (this.props.selectedTag === null) {
            modifierClassNames.push("tag-input-toolbar-icon-unselected");
        }

        const modifierClassName = modifierClassNames.join(" ");

        return(
            this.getToolbarItems().map((itemConfig) => {
                if (itemConfig.category === Categories.General) {
                    return (<div
                                key={itemConfig.displayName}
                                className={`tag-input-toolbar-item ${itemConfig.className}`}
                                onClick={(e) => this.onToolbarItemClick(e, itemConfig)}>
                                <FontIcon iconName={itemConfig.icon} className="tag-input-toolbar-icon" />
                            </div>);
                } else if (itemConfig.category === Categories.Separator) {
                    return (<div className="tag-tool-bar-vertical-line" key = {itemConfig.displayName}></div>);
                } else if (itemConfig.category === Categories.Modifier) {
                    return (<div
                                key={itemConfig.displayName}
                                className={`tag-input-toolbar-item ${itemConfig.className}`}
                                onClick={(e) => this.onToolbarItemClick(e, itemConfig)}>
                                <FontIcon iconName={itemConfig.icon} className={modifierClassName} />
                            </div>);
                } else {
                    throw new Error(`Unsupported item category ${itemConfig.category}`);
                }
            })
        );
    }

    private handleAdd = () => {
        this.props.onAddTags();
    }

    private handleSearch = () => {
        this.props.onSearchTags();
    }

    // private handleLock = () => {
    //     this.props.onLockTag(this.props.selectedTag);
    // }

    private handleEdit = () => {
        this.props.onEditTag(this.props.selectedTag);
    }

    private handleArrowUp = () => {
        this.props.onReorder(this.props.selectedTag, -1);
    }

    private handleArrowDown = () => {
        this.props.onReorder(this.props.selectedTag, 1);
    }

    private handleDelete = () => {
        this.props.onDelete(this.props.selectedTag);
    }
}
