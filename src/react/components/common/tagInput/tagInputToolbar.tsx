// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IconButton } from "office-ui-fabric-react";
import { strings } from "../../../../common/strings";
import { ITag } from "../../../../models/applicationState";

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
    onRenameTag: (tag: ITag) => void;
    /** Function to call when delete button is clicked */
    onDelete: (tag: ITag) => void;
    /** Function to call when one of the re-order buttons is clicked */
    onReorder: (tag: ITag, displacement: number) => void;
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
                category: Categories.Modifier,
                handler: this.handleRename,
            },
            {
                displayName: strings.tags.toolbar.moveUp,
                icon: "Up",
                category: Categories.Modifier,
                handler: this.handleMoveUp,
            },
            {
                displayName: strings.tags.toolbar.moveDown,
                icon: "Down",
                category: Categories.Modifier,
                handler: this.handleMoveDown,
            },
            {
                displayName: strings.tags.toolbar.delete,
                icon: "Delete",
                category: Categories.Modifier,
                handler: this.handleDelete,
            },
        ];
    }

    private renderItems = () => {
        const modifierDisabled = !this.props.selectedTag;
        const modifierClassNames = ["tag-input-toolbar-iconbutton"];
        if (modifierDisabled) {
            modifierClassNames.push("tag-input-toolbar-iconbutton-disabled");
        }

        const modifierClassName = modifierClassNames.join(" ");

        return(
            this.getToolbarItems().map((itemConfig, index) => {
                if (itemConfig.category === Categories.General) {
                   if ( index === 0) {
                        return (
                            <IconButton
                                key={itemConfig.displayName}
                                title={itemConfig.displayName}
                                ariaLabel={itemConfig.displayName}
                                className="tag-input-toolbar-iconbutton"
                                iconProps={{iconName: itemConfig.icon}}
                                autoFocus={true}
                                onClick={(e) => this.onToolbarItemClick(e, itemConfig)} />
                        );
                   } else {
                        return (
                            <IconButton
                                key={itemConfig.displayName}
                                title={itemConfig.displayName}
                                ariaLabel={itemConfig.displayName}
                                className="tag-input-toolbar-iconbutton"
                                iconProps={{iconName: itemConfig.icon}}
                                onClick={(e) => this.onToolbarItemClick(e, itemConfig)} />
                        );
                   }
                } else if (itemConfig.category === Categories.Separator) {
                    return (<div className="tag-input-toolbar-separator" key={itemConfig.displayName}></div>);
                } else if (itemConfig.category === Categories.Modifier) {
                    return (
                        <IconButton
                            key={itemConfig.displayName}
                            disabled={modifierDisabled}
                            title={itemConfig.displayName}
                            ariaLabel={itemConfig.displayName}
                            className={modifierClassName}
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
