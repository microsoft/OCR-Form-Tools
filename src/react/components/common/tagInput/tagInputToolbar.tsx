// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IconButton } from "@fluentui/react";
import { strings } from "../../../../common/strings";
import { ITag } from "../../../../models/applicationState";

enum Categories {
    General,
    Separator,
    RenameModifier,
    MoveModifier,
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
    onRenameTag: (tag: ITag) => void;
    /** Function to call when delete button is clicked */
    onDelete: (tag: ITag) => void;
    /** Function to call when one of the re-order buttons is clicked */
    onReorder: (tag: ITag, displacement: number) => void;
    searchingTags: boolean;
}

interface ITagInputToolbarItemProps {
    displayName: string;
    icon?: string;
    category?: Categories;
    handler?: () => void;
    accelerators?: string[];
}

export default class TagInputToolbar extends React.Component<ITagInputToolbarProps> {
    public render() {
        return (
            <div className="tag-input-toolbar">
                {this.renderItems()}
            </div>
        );
    }

    private getToolbarItems = (): ITagInputToolbarItemProps[] => {
        return [
            {
                displayName: strings.tags.toolbar.add,
                icon: "Add",
                category: Categories.General,
                handler: this.handleAdd,
            },
            {
                displayName: strings.tags.toolbar.search,
                icon: "Search",
                category: Categories.General,
                handler: this.handleSearch,
            },
            {
                displayName: strings.tags.toolbar.vertiline,
                category: Categories.Separator,
            },
            {
                displayName: strings.tags.toolbar.rename,
                icon: "Rename",
                category: Categories.RenameModifier,
                handler: this.handleRename,
            },
            {
                displayName: strings.tags.toolbar.moveUp,
                icon: "Up",
                category: Categories.MoveModifier,
                handler: this.handleMoveUp,
            },
            {
                displayName: strings.tags.toolbar.moveDown,
                icon: "Down",
                category: Categories.MoveModifier,
                handler: this.handleMoveDown,
            },
            {
                displayName: strings.tags.toolbar.delete,
                icon: "Delete",
                category: Categories.MoveModifier,
                handler: this.handleDelete,
            },
        ];
    }

    private renderItems = () => {
        const moveModifierDisabled = !this.props.selectedTag || this.props.searchingTags;
        console.log("TagInputToolbar -> privaterenderItems -> this.props.searchingTags", this.props.searchingTags)
        const renameModifierDisabled = !this.props.selectedTag;
        const moveModifierClassNames = ["tag-input-toolbar-iconbutton"];
        const renameModifierClassNames = ["tag-input-toolbar-iconbutton"];
        if (moveModifierDisabled) {
            moveModifierClassNames.push("tag-input-toolbar-iconbutton-disabled");
        }
        if (renameModifierDisabled) {
            renameModifierClassNames.push("tag-input-toolbar-iconbutton-disabled");
        }

        const moveModifierClassName = moveModifierClassNames.join(" ");
        const renameModifierClassName = renameModifierClassNames.join(" ");

        return(
            this.getToolbarItems().map((itemConfig, index) => {
                if (itemConfig.category === Categories.General) {
                    return (
                        <IconButton
                            key={itemConfig.displayName}
                            title={itemConfig.displayName}
                            ariaLabel={itemConfig.displayName}
                            className="tag-input-toolbar-iconbutton"
                            iconProps={{iconName: itemConfig.icon}}
                            autoFocus={!index}
                            onClick={(e) => this.onToolbarItemClick(e, itemConfig)} />
                    );
                } else if (itemConfig.category === Categories.Separator) {
                    return (<div className="tag-input-toolbar-separator" key={itemConfig.displayName}></div>);
                } else if (itemConfig.category === Categories.RenameModifier) {
                    return (
                        <IconButton
                            key={itemConfig.displayName}
                            disabled={renameModifierDisabled}
                            title={itemConfig.displayName}
                            ariaLabel={itemConfig.displayName}
                            className={renameModifierClassName}
                            iconProps={{iconName: itemConfig.icon}}
                            onClick={(e) => this.onToolbarItemClick(e, itemConfig)} />
                    );
                } else if (itemConfig.category === Categories.MoveModifier) {
                    return (
                        <IconButton
                            key={itemConfig.displayName}
                            disabled={moveModifierDisabled}
                            title={itemConfig.displayName}
                            ariaLabel={itemConfig.displayName}
                            className={moveModifierClassName}
                            iconProps={{iconName: itemConfig.icon}}
                            onClick={(e) => this.onToolbarItemClick(e, itemConfig)} />
                    );
                } else {
                    throw new Error(`Unsupported item category ${itemConfig.category}`);
                }
            })
        );
    }

    private onToolbarItemClick = (e: any, itemConfig: ITagInputToolbarItemProps): void => {
        e.stopPropagation();
        itemConfig.handler();
    }

    private handleAdd = () => {
        this.props.onAddTags();
    }

    private handleSearch = () => {
        this.props.onSearchTags();
    }

    private handleRename = () => {
        if (this.props.selectedTag) {
            this.props.onRenameTag(this.props.selectedTag);
        }
    }

    private handleMoveUp = () => {
        if (this.props.selectedTag) {
            this.props.onReorder(this.props.selectedTag, -1);
        }
    }

    private handleMoveDown = () => {
        if (this.props.selectedTag) {
            this.props.onReorder(this.props.selectedTag, 1);
        }
    }

    private handleDelete = () => {
        if (this.props.selectedTag) {
            this.props.onDelete(this.props.selectedTag);
        }
    }
}
