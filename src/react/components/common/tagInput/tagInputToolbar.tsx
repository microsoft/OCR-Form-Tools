// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
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
                icon: "ms-Icon ms-Icon--Add ms-Icon-1x",
                category: Categories.General,
                handler: this.handleAdd,
            },
            {
                displayName: strings.tags.toolbar.search,
                className: "search",
                icon: "ms-Icon ms-Icon--Search ms-Icon-1x",
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
                icon: "ms-Icon ms-Icon--Rename ms-Icon-1x",
                category: Categories.Modifier,
                handler: this.handleEdit,
            },
            {
                displayName: strings.tags.toolbar.moveUp,
                className: "up",
                icon: "ms-Icon ms-Icon--Up ms-Icon-1x",
                category: Categories.Modifier,
                handler: this.handleArrowUp,
            },
            {
                displayName: strings.tags.toolbar.moveDown,
                className: "down",
                icon: "ms-Icon ms-Icon--Down ms-Icon-1x",
                category: Categories.Modifier,
                handler: this.handleArrowDown,
            },
            {
                displayName: strings.tags.toolbar.delete,
                className: "delete",
                icon: "ms-Icon ms-Icon--Delete ms-Icon-1x",
                category: Categories.Modifier,
                handler: this.handleDelete,
            },
        ];
    }

    private handleTagIcon = () => {
        const classNames = ["tag-input-toolbar-icon"];

        if (this.props.selectedTag === null) {
            classNames.push("tag-input-toolbar-icon-unselected");
        }
        return(
            this.getToolbarItems().map((itemConfig) => {
                if (itemConfig.category === Categories.General) {
                    return (<div
                                key={itemConfig.displayName}
                                className={`tag-input-toolbar-item ${itemConfig.className}`}
                                onClick={(e) => this.onToolbarItemClick(e, itemConfig)}>
                                <i className={`tag-input-toolbar-icon ${itemConfig.icon}`}/>
                            </div> 
                } else if (itemConfig.category === Categories.Separator) {
                    return (<div className="tag-tool-bar-vertical-line"></div>);
                } else if (itemConfig.category === Categories.Modifier) {
                    return (<div
                                key={itemConfig.displayName}
                                className={`tag-input-toolbar-item ${itemConfig.className}`}
                                onClick={(e) => this.onToolbarItemClick(e, itemConfig)}>
                                <i className={`${classNames.join(" ")} ${itemConfig.icon}`} />
                            </div>);
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
