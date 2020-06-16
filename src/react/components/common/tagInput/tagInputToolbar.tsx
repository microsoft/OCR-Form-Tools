// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { IconButton } from "@fluentui/react";
import { strings } from "../../../../common/strings";
import { ITag, FormattedItem } from "../../../../models/applicationState";

enum Categories {
    General,
    Separator,
    Modifier,
}

export enum ItemToolbarOptions {
    add,
    search,
    lock,
    rename,
    delete,
    moveUp,
    moveDown,
    separator,
}


/** Properties for tag input toolbar */
export interface ITagInputToolbarProps {
    /** Currently selected tag */
    selected: FormattedItem;
    /** Function to call when add tags button is clicked */
    onAdd?: () => void;
    /** Function to call when search tags button is clicked */
    onSearch?: () => void;
    /** Function to call when lock tags button is clicked */
    onLock?: (item: FormattedItem) => void;
    /** Function to call when edit tag button is clicked */
    onRename?: (item: FormattedItem) => void;
    /** Function to call when delete button is clicked */
    onDelete?: (item: FormattedItem) => void;
    /** Function to call when one of the re-order buttons is clicked */
    onReorder?: (item: FormattedItem, displacement: number) => void;
    /** Options to include in search bar **/
    options: ItemToolbarOptions[];
}

interface ITagInputToolbarItemProps {
    displayName: string;
    icon?: string;
    category?: Categories;
    handler?: () => void;
    accelerators?: string[];
}

const TagInputToolbar: React.FunctionComponent<ITagInputToolbarProps> = (props) => {

    const onToolbarItemClick = (e: any, itemConfig: ITagInputToolbarItemProps): void => {
        e.stopPropagation();
        itemConfig.handler();
    }

    const handleAdd = () => {
        props.onAdd();
    }

    const handleSearch = () => {
        props.onSearch();
    }

    const handleRename = () => {
        if (props.selected) {
            props.onRename(props.selected);
        }
    }

    const handleMoveUp = () => {
        if (props.selected) {
            props.onReorder(props.selected, -1);
        }
    }

    const handleMoveDown = () => {
        if (props.selected) {
            props.onReorder(props.selected, 1);
        }
    }

    const handleDelete = () => {
        if (props.selected) {
            props.onDelete(props.selected);
        }
    }

    const optionToItemProps = {
        [ItemToolbarOptions.add]: {
            displayName: strings.tags.toolbar.add,
            icon: "Add",
            category: Categories.General,
            handler: handleAdd,
        },
        [ItemToolbarOptions.search]: {
            displayName: strings.tags.toolbar.search,
            icon: "Search",
            category: Categories.General,
            handler: handleSearch,
        },
        [ItemToolbarOptions.separator]: {
            displayName: strings.tags.toolbar.vertiline,
            category: Categories.Separator,
        }, // ???
        [ItemToolbarOptions.rename]: {
            displayName: strings.tags.toolbar.rename,
            icon: "Rename",
            category: Categories.Modifier,
            handler: handleRename,
        },
        [ItemToolbarOptions.moveUp]: {
            displayName: strings.tags.toolbar.moveUp,
            icon: "Up",
            category: Categories.Modifier,
            handler: handleMoveUp,
        },
        [ItemToolbarOptions.moveDown]: {
            displayName: strings.tags.toolbar.moveDown,
            icon: "Down",
            category: Categories.Modifier,
            handler: handleMoveDown,
        },
        [ItemToolbarOptions.delete]: {
            displayName: strings.tags.toolbar.delete,
            icon: "Delete",
            category: Categories.Modifier,
            handler: handleDelete,
        }
    };

    const renderItems = () => {
        const modifierDisabled = !props.selected;
        const modifierClassNames = ["tag-input-toolbar-iconbutton"];
        if (modifierDisabled) {
            modifierClassNames.push("tag-input-toolbar-iconbutton-disabled");
        }

        const modifierClassName = modifierClassNames.join(" ");
        // by default, inject a separator after the search
        // const searchIndex = props.options.findIndex
        const searchIndex = props.options.findIndex(p => p === ItemToolbarOptions.search);
        const sepOpts = [...props.options];
        if (searchIndex !== -1) {
            sepOpts.splice(searchIndex+1, 0, ItemToolbarOptions.separator);
        }

        return(
            sepOpts.map(o => optionToItemProps[o]).map((itemConfig, index) => {
                if (itemConfig.category === Categories.General) {
                    return (
                        <IconButton
                            key={itemConfig.displayName}
                            title={itemConfig.displayName}
                            ariaLabel={itemConfig.displayName}
                            className="tag-input-toolbar-iconbutton"
                            iconProps={{iconName: itemConfig.icon}}
                            autoFocus={!index}
                            onClick={(e) => onToolbarItemClick(e, itemConfig)} />
                    );
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
                            onClick={(e) => onToolbarItemClick(e, itemConfig)} />
                    );
                } else {
                    throw new Error(`Unsupported item category ${itemConfig.category}`);
                }
            })
        );
    }

    return (
        <div className="tag-input-toolbar">
            {renderItems()}
        </div>
    );
}

export default TagInputToolbar;
