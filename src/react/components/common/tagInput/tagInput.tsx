// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { KeyboardEvent } from "react";
import {
    ContextualMenu,
    ContextualMenuItemType,
    Customizer,
    FontIcon,
    IContextualMenuItem,
    ICustomizations,
    Spinner,
    SpinnerSize,
} from "@fluentui/react";
import { strings } from "../../../../common/strings";
import { getDarkTheme } from "../../../../common/themes";
import { AlignPortal } from "../align/alignPortal";
import { getNextColor } from "../../../../common/utils";
import { IRegion, ITag, ILabel, FieldType, FieldFormat, NamedItem, FormattedItem } from "../../../../models/applicationState";
import { ColorPicker } from "../colorPicker";
import "./tagInput.scss";
import "../condensedList/condensedList.scss";
import TagInputItem, { ITagInputItemProps, ITagClickProps } from "./tagInputItem";
import TagInputToolbar, {ItemToolbarOptions} from "./tagInputToolbar";
import { toast } from "react-toastify";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../../common/tagColors.json");

enum TagMenuItem {
    Delete = "delete",
    MoveUp = "moveup",
    MoveDown = "movedown",
    Rename = "rename",
}

export enum TagOperationMode {
    None,
    ColorPicker,
    ContextualMenu,
    Rename,
}

export interface ITagInputProps {
    /** Current list of tags */
    tags: ITag[];
    /** Named items */
    namedItems: NamedItem[];
    /** Function called on tags change */
    onChange: (tags: ITag[]) => void;
    /** Currently selected regions in canvas */
    selectedRegions?: IRegion[];
    /** The labels in the canvas */
    labels: ILabel[];
    /** Tags that are currently locked for editing experience */
    lockedTags?: string[];
    /** Updates to locked tags */
    onLockedTagsChange?: (locked: string[]) => void;
    /** Show tags when loaded */
    tagsLoaded: boolean;
    /** Place holder for input text box */
    placeHolder?: string;
    /** Function to call on clicking individual tag */
    onTagClick?: (tag: ITag) => void;
    /** Function to call on clicking individual tag while holding CTRL key */
    onCtrlTagClick?: (tag: ITag) => void;
    /** Function to call when tag is renamed */
    onRename?: (oldTag: ITag, newTag: ITag, cancelCallback: () => void) => void;
    /** Function to call when tag is deleted */
    onTagDeleted?: (tagName: string) => void;
    /** Always show tag input box */
    showTagInputBox?: boolean;
    /** Always show tag search box */
    showSearchBox?: boolean;
    /** Callback function for TagInputItemLabel mouse enter */
    onLabelEnter: (label: ILabel) => void;
    /** Callback function for TagInputItemLabel mouse leave */
    onLabelLeave: (label: ILabel) => void;
    /** Function to handle tag change */
    onTagChanged?: (oldTag: ITag, newTag: ITag) => void;
}

export interface ITagInputState {
    tagOperation: TagOperationMode;
    addTags: boolean;
    searchTags: boolean;
    searchQuery: string;
    selectedTag: ITag;
}

function filterFormat(type: FieldType): FieldFormat[] {
    switch (type) {
        case FieldType.String:
            return [
                FieldFormat.NotSpecified,
                FieldFormat.Alphanumeric,
                FieldFormat.NoWhiteSpaces,
            ];
        case FieldType.Number:
            return [
                FieldFormat.NotSpecified,
                FieldFormat.Currency,
            ];
        case FieldType.Date:
            return [
                FieldFormat.NotSpecified,
                FieldFormat.DMY,
                FieldFormat.MDY,
                FieldFormat.YMD,
            ];
        default:
            return [ FieldFormat.NotSpecified ];
    }
}

function isNameEqual(x: string, y: string) {
    return x.trim().toLocaleLowerCase() === y.trim().toLocaleLowerCase();
}

export const dark: ICustomizations = {
    settings: {
      theme: getDarkTheme(),
    },
    scopedSettings: {},
};

export class TagInput extends React.Component<ITagInputProps, ITagInputState> {

    public state: ITagInputState = {
        tagOperation: TagOperationMode.None,
        addTags: this.props.showTagInputBox,
        searchTags: this.props.showSearchBox,
        searchQuery: "",
        selectedTag: null,
    };

    private tagItemRefs: Map<string, TagInputItem> = new Map<string, TagInputItem>();
    private headerRef = React.createRef<HTMLDivElement>();
    private inputRef = React.createRef<HTMLInputElement>();

    public componentDidUpdate(prevProps: ITagInputProps) {
        if (prevProps.tags !== this.props.tags) {
            let selectedTag = this.state.selectedTag;
            if (selectedTag) {
                selectedTag = this.props.tags.find((tag) => isNameEqual(tag.name, selectedTag.name));
            }

            this.setState({
                selectedTag,
            });
        }

        if (prevProps.selectedRegions !== this.props.selectedRegions && this.props.selectedRegions.length > 0) {
            this.setState({
                selectedTag: null,
            });
        }
    }


    private onHideContextualMenu = () => {
        this.setState({tagOperation: TagOperationMode.None});
    }

    public render() {

        const { selectedTag, tagOperation } = this.state;
        const selectedRef = selectedTag ? this.tagItemRefs.get(selectedTag.name).getTagNameRef() : null;
        const toolbarOpts = [
            ItemToolbarOptions.add,
            ItemToolbarOptions.search,
            ItemToolbarOptions.rename,
            ItemToolbarOptions.moveDown,
            ItemToolbarOptions.moveUp,
            ItemToolbarOptions.delete,
        ]
        return (
            <div className="tag-input">
                <div ref={this.headerRef} className="tag-input-header p-2">
                    <span className="tag-input-title">{strings.tags.title}</span>
                    <TagInputToolbar
                        selected={this.state.selectedTag}
                        onAdd={() => this.setState({ addTags: !this.state.addTags })}
                        onSearch={() => this.setState({
                            searchTags: !this.state.searchTags,
                            searchQuery: "",
                        })}
                        onRename={this.toggleRenameMode}
                        onLock={this.onLockTag}
                        onDelete={this.onDeleteTag}
                        onReorder={this.onReOrder}
                        options={toolbarOpts}
                    />
                </div>
                {
                    this.props.tagsLoaded ?
                    <div className="tag-input-body-container">
                        <div className="tag-input-body">
                            {
                                this.state.searchTags &&
                                <div className="tag-input-text-input-row search-input">
                                    <input
                                        className="tag-search-box"
                                        type="text"
                                        onKeyDown={this.onSearchKeyDown}
                                        onChange={(e) => this.setState({ searchQuery: e.target.value })}
                                        placeholder="Search tags"
                                        autoFocus={true}
                                    />
                                    <FontIcon iconName="Search" />
                                </div>
                            }
                            <div className="tag-input-items">
                                {this.renderTagItems()}
                                <Customizer {...dark}>
                                    {
                                        tagOperation === TagOperationMode.ContextualMenu && selectedRef &&
                                        <FormattedItemContextMenu
                                            item={this.state.selectedTag}
                                            onRename={this.toggleRenameMode}
                                            onDelete={this.onDeleteTag}
                                            onReOrder={this.onReOrder}
                                            selectedRef={selectedRef}
                                            onHideContextualMenu={this.onHideContextualMenu}
                                            onItemChanged={this.props.onTagChanged}
                                        />
                                    }
                                </Customizer>
                                <ColorPickerPortal
                                    selectedItem={this.state.selectedTag}
                                    operation={this.state.tagOperation}
                                    handleColorChange={this.handleColorChange}
                                    alignRef={this.headerRef}
                                />
                            </div>
                            {
                                this.state.addTags &&
                                <div className="tag-input-text-input-row new-tag-input">
                                    <input
                                        className="tag-input-box"
                                        type="text"
                                        onKeyDown={this.onAddTagKeyDown}
                                        // Add mouse event
                                        onBlur={this.onAddTagWithBlur}
                                        placeholder="Add new tag"
                                        autoFocus={true}
                                        ref={this.inputRef}
                                    />
                                    <FontIcon iconName="Tag" />
                                </div>
                            }
                        </div>
                    </div>
                    :
                    <Spinner className="loading-tag" size={SpinnerSize.large}/>
                }
            </div>
        );
    }

    public triggerNewTagBlur() {
        if (this.inputRef.current) {
            this.inputRef.current.blur();
        }
    }

    private toggleRenameMode = (tag: ITag) => {
        const tagOperation = this.state.tagOperation === TagOperationMode.Rename
            ? TagOperationMode.None : TagOperationMode.Rename;
        this.setState({
            tagOperation,
        });
    }

    private onLockTag = (tag: ITag) => {
        if (!tag) {
            return;
        }
        let lockedTags = [...this.props.lockedTags];
        if (lockedTags.find((str) => isNameEqual(tag.name, str))) {
            lockedTags = lockedTags.filter((str) => !isNameEqual(tag.name, str));
        } else {
            lockedTags.push(tag.name);
        }
        this.props.onLockedTagsChange(lockedTags);
    }

    private onReOrder = (tag: ITag, displacement: number) => {
        if (!tag) {
            return;
        }
        const tags = [...this.props.tags];
        const currentIndex = tags.indexOf(tag);
        const newIndex = currentIndex + displacement;
        if (newIndex < 0 || newIndex >= tags.length) {
            return;
        }
        tags.splice(currentIndex, 1);
        tags.splice(newIndex, 0, tag);
        this.props.onChange(tags);
    }

    private handleColorChange = (color: string) => {
        const tag = this.state.selectedTag;
        const tags = this.props.tags.map((t) => {
            return (isNameEqual(t.name, tag.name)) ? {
                ...tag,
                color,
            } : t;
        });
        this.setState({
            tagOperation: TagOperationMode.None,
        });
        this.props.onChange(tags);
    }

    private addTag = (tag: ITag) => {
        try {
            validateNameLength(tag);
            validateNameUniqueness(tag, this.props.tags);
        } catch (error) {
            toast.warn(error.toString());
            return;
        }

        const tags = [...this.props.tags, tag];
        this.props.onChange(tags);
    }

    private onDeleteTag = (tag: ITag) => {
        if (!tag) {
            return;
        }
        this.props.onTagDeleted(tag.name);
    }

    private renderTagItems = () => {
        let props = this.createTagItemProps();
        const query = this.state.searchQuery;
        this.tagItemRefs.clear();

        if (query.length) {
            props = props.filter((prop) => prop.tag.name.toLowerCase().includes(query.toLowerCase()));
        }

        return props.map((prop) =>
            <TagInputItem
                {...prop}
                key={prop.tag.name}
                labels={this.getTagLabels(prop.tag.name)}
                ref={(item) => this.setTagItemRef(item, prop.tag)}
                onLabelEnter={this.props.onLabelEnter}
                onLabelLeave={this.props.onLabelLeave}
                onTagChanged={this.props.onTagChanged}
            />);
    }

    private setTagItemRef = (item: TagInputItem, tag: ITag) => {
        this.tagItemRefs.set(tag.name, item);
        return item;
    }

    private getTagLabels = (key: string): ILabel[] => {
        return this.props.labels.filter((label) => label.label === key);
    }

    private createTagItemProps = (): ITagInputItemProps[] => {
        const { selectedTag, tagOperation } = this.state;
        const { tags } = this.props;
        const selectedRegionTagSet = this.getSelectedRegionTagSet();
        const onCancel = () => {
            this.setState({
                tagOperation: TagOperationMode.None,
            });
        }

        return tags.map((tag) => (
            {
                tag,
                index: tags.findIndex((t) => isNameEqual(t.name, tag.name)),
                isLocked: this.props.lockedTags
                    && this.props.lockedTags.findIndex((str) => isNameEqual(tag.name, str)) > -1,
                isRenaming: selectedTag && isNameEqual(selectedTag.name, tag.name)
                    && tagOperation === TagOperationMode.Rename,
                isSelected: selectedTag && isNameEqual(selectedTag.name, tag.name),
                appliedToSelectedRegions: selectedRegionTagSet.has(tag.name),
                onClick: this.onTagItemClick.bind(this, tag),
                cancelRename: onCancel,
                onRename: onItemRename.bind(this, this.props.namedItems, tag, onCancel, this.props.onRename), // TODO use global tags
            } as ITagInputItemProps
        ));
    }

    private getSelectedRegionTagSet = (): Set<string> => {
        const result = new Set<string>();
        if (this.props.selectedRegions) {
            for (const region of this.props.selectedRegions) {
                for (const tag of region.tags) {
                    result.add(tag);
                }
            }
        }
        return result;
    }

    private onTagItemClick = (tag: ITag, props: ITagClickProps) => {
        if (props.ctrlKey && this.props.onCtrlTagClick) { // Lock tags
            this.props.onCtrlTagClick(tag);
        } else if (props.altKey) { // Edit tag
            this.setState({
                selectedTag: tag,
                tagOperation: TagOperationMode.Rename,
            });
        } else if (props.clickedDropDown) {
            const { selectedTag } = this.state;
            const showContextualMenu = !selectedTag || !isNameEqual(selectedTag.name, tag.name)
                || this.state.tagOperation !== TagOperationMode.ContextualMenu;
            const tagOperation = showContextualMenu ? TagOperationMode.ContextualMenu : TagOperationMode.None;
            this.setState({
                selectedTag: showContextualMenu ? tag: selectedTag,
                tagOperation,
            });
        } else if (props.clickedColor) {
            const { selectedTag, tagOperation } = this.state;
            const showColorPicker = tagOperation !== TagOperationMode.ColorPicker;
            const newTagOperation = showColorPicker ? TagOperationMode.ColorPicker : TagOperationMode.None;
            this.setState({
                selectedTag: showColorPicker ? tag : selectedTag,
                tagOperation: newTagOperation,
            });
        } else { // Select tag
            const { selectedTag, tagOperation: oldTagOperation } = this.state;
            const selected = selectedTag && isNameEqual(selectedTag.name, tag.name);
            const tagOperation = selected ? oldTagOperation : TagOperationMode.None;
            let deselect = selected && oldTagOperation === TagOperationMode.None;

            // Only fire click event if a region is selected
            const { selectedRegions, onTagClick, labels } = this.props;
            if (selectedRegions && selectedRegions.length && onTagClick) {
                const { category } = selectedRegions[0];
                const { format, type, documentCount, name } = tag;
                const tagCategory = getTagCategory(type);
                if (tagCategory === category ||
                    (documentCount === 0 && type === FieldType.String && format === FieldFormat.NotSpecified)) {
                    if (category === "checkbox" && this.labelAssigned(labels, name)) {
                        toast.warn(strings.tags.warnings.checkboxPerTagLimit);
                        return;
                    }
                    onTagClick(tag);
                    deselect = false;
                } else {
                    toast.warn(strings.tags.warnings.notCompatibleTagType);
                }
            }
            this.setState({
                selectedTag: deselect ? null : tag,
                tagOperation,
            });
        }
    }

    private labelAssigned = (labels, name): boolean => {
         return labels.find((label) => label.label === name ? true : false);
    }

    private onSearchKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            this.setState({
                searchTags: false,
            });
        }
    }

    private onAddTagKeyDown = (event) => {
        // Add handle mouse event functionality
        if (event.key === "Enter") {
            // validate and add
            this.creatTagInput(event.target.value.trim());
            event.target.value = "";
        }
        if (event.key === "Escape") {
            this.setState({
                addTags: false,
            });
        }
    }

    private onAddTagWithBlur = (event: any) => {
        if (event.target.value) {
            this.creatTagInput(event.target.value.trim());
            event.target.value = "";
        }
    }

    private creatTagInput = (value: any) => {
        const newTag: ITag = {
                name: value,
                color: getNextColor(this.props.tags),
                type: FieldType.String,
                format: FieldFormat.NotSpecified,
                documentCount: 0,
        };
        if (newTag.name.length && ![...this.props.tags, newTag].containsDuplicates((t) => t.name)) {
            this.addTag(newTag);
        } else if (!newTag.name.length) {
            toast.warn(strings.tags.warnings.emptyName);
        } else {
            toast.warn(strings.tags.warnings.existingName);
        }
    }
}

export interface IFormattedItemContextMenuProps {
    item?: FormattedItem;
    selectedRef: React.RefObject<HTMLDivElement>
    onHideContextualMenu: () => void;
    onReOrder: (item: FormattedItem, displacement: number) => void;
    onRename: (item: FormattedItem) => void;
    onDelete: (item: FormattedItem) => void;
    onItemChanged: (item: FormattedItem, newItem: FormattedItem) => void;
}

export const FormattedItemContextMenu: React.FunctionComponent<IFormattedItemContextMenuProps> = (props) => {
    const { item, selectedRef, onHideContextualMenu } = props;
    if (!item) {
        return (<ContextualMenu
            className="tag-input-contextual-menu"
            items={[]}
            target={selectedRef}
            onDismiss={onHideContextualMenu}
        />);
    }

    const onTypeSelect = (event: React.MouseEvent<HTMLButtonElement>, contextItem?: IContextualMenuItem): void => {
        event.preventDefault();
        const type = contextItem.text as FieldType;
        if (type === item.type) {
            return;
        }

        const newItem = {
            ...item,
            type,
            format: FieldFormat.NotSpecified,
        };

        props.onItemChanged(item, newItem);
    }

    const onFormatSelect = (event: React.MouseEvent<HTMLButtonElement>, contextItem?: IContextualMenuItem): void => {
        event.preventDefault();
        const format = contextItem.text as FieldFormat;
        if (format === item.format) {
            return;
        }

        const newTag = {
            ...item,
            format,
        };

        props.onItemChanged(item, newTag);
    }

    const getTypeSubMenuItems = (item: FormattedItem): IContextualMenuItem[] => {
        const types = Object.values(FieldType);
        return types.map((type) => {
            const isCompatible = isTypeCompatibleWithTag(item, type);
            return {
                key: type,
                text: type,
                canCheck: isCompatible,
                isChecked: type === item.type,
                onClick: onTypeSelect,
                disabled: !isCompatible,
            } as IContextualMenuItem;
        });
    }

    const getFormatSubMenuItems = (item: FormattedItem): IContextualMenuItem[] => {
        const formats = filterFormat(item.type);

        return formats.map((format) => {
            return {
                key: format,
                text: format,
                canCheck: true,
                isChecked: format === item.format,
                onClick: onFormatSelect,
            } as IContextualMenuItem;
        });
    }

    const onMenuItemClick = (event: React.MouseEvent<HTMLButtonElement>, contextItem?: IContextualMenuItem): void => {
        event.preventDefault();
        if (!item) { // TODO make sure this is the right item
            return;
        }

        switch (contextItem.key) {
            case TagMenuItem.MoveDown:
                props.onReOrder(item, 1);
                break;
            case TagMenuItem.MoveUp:
                props.onReOrder(item, -1);
                break;
            case TagMenuItem.Rename:
                props.onRename(item);
                break;
            case TagMenuItem.Delete:
                props.onDelete(item);
                break;
        }
    }

    const menuItems: IContextualMenuItem[] = [
        {
            key: "type",
            iconProps: {
                iconName: "Link",
            },
            text: item.type ? item.type : strings.tags.toolbar.type,
            subMenuProps: {
                items: getTypeSubMenuItems(item),
            },
        },
        {
            key: "format",
            iconProps: {
                iconName: "Link",
            },
            text: item.format ? item.format : strings.tags.toolbar.format,
            subMenuProps: {
                items: getFormatSubMenuItems(item),
            },
        },
        {
            key: "divider_1",
            itemType: ContextualMenuItemType.Divider,
        },
        {
            key: TagMenuItem.Rename,
            iconProps: {
                iconName: "Rename",
            },
            text: strings.tags.toolbar.rename,
            onClick: onMenuItemClick,
        },
        {
            key: TagMenuItem.MoveUp,
            iconProps: {
                iconName: "Up",
            },
            text: strings.tags.toolbar.moveUp,
            onClick: onMenuItemClick,
        },
        {
            key: TagMenuItem.MoveDown,
            iconProps: {
                iconName: "Down",
            },
            text: strings.tags.toolbar.moveDown,
            onClick: onMenuItemClick,
        },
        {
            key: TagMenuItem.Delete,
            iconProps: {
                iconName: "Delete",
            },
            text: strings.tags.toolbar.delete,
            onClick: onMenuItemClick,
        },
    ];

    return (<ContextualMenu
        className="tag-input-contextual-menu"
        items={menuItems}
        target={selectedRef}
        onDismiss={onHideContextualMenu}
    />);

}


const getTagCategory = (tagType: string) => {
    switch (tagType) {
        case FieldType.SelectionMark:
            return "checkbox";
        default:
            return "text";
    }
}

const isTypeCompatibleWithTag = (tag, type) => {
    // If free tag we can assign any type
    if (tag && tag.documentCount <= 0) {
        return true;
    }
    const tagType = getTagCategory(tag.type);
    const menuItemType = getTagCategory(type);
    return tagType === menuItemType;
}

// Name input
export const validateNameLength = (item: NamedItem) => {
    if (!item.name.trim().length) {
        throw new Error(strings.tags.warnings.emptyName);
    }
    if (item.name.length >= 128) {
        throw new Error("Name is too long (>= 128).");
    }
}

export const validateNameUniqueness = (item: NamedItem, otherItems: NamedItem[]) => {
    if (otherItems.map(i => i.name).some((n) => isNameEqual(n, item.name))) {
        throw new Error(strings.tags.warnings.existingName); // TODO probably update this string
    }
}

export const onItemRename = (
    otherItems: NamedItem[],
    item: NamedItem,
    onCancel: () => void,
    onRename: (oldItem: NamedItem, newItem: NamedItem, cancelCallback: () => void) => void,
    name: string,
    cancelCallback: () => void,
) => {
    const cancelRename = () => {
        cancelCallback();
        onCancel();
    };

    if (isNameEqual(item.name, name)) {
        cancelRename();
        return;
    }

    const newItem = {
        ...item,
        name,
    };

    try {
        otherItems = otherItems.filter((elem) => !isNameEqual(elem.name, item.name)); // pull out diff items
        validateNameLength(newItem);
        validateNameUniqueness(newItem, otherItems);
    } catch (error) {
        toast.warn(error.toString());
        return;
    }

    if (onRename) {
        onRename(item, newItem, cancelRename);
    }
}

export interface IColorPickerPortalProps {
    selectedItem: FormattedItem,
    operation: TagOperationMode,
    handleColorChange: (color: string) => void,
    alignRef: React.RefObject<HTMLDivElement>
}
export const ColorPickerPortal: React.FunctionComponent<IColorPickerPortalProps> = (
    { selectedItem, operation, handleColorChange, alignRef }
) => {
    const showColorPicker = operation === TagOperationMode.ColorPicker;
    return (
        <AlignPortal align={{points: [ "tr", "tl" ]}} target={() => alignRef.current}>
            <div className="tag-input-colorpicker-container">
                {
                    showColorPicker &&
                    <ColorPicker
                        color={selectedItem && selectedItem.color}
                        colors={tagColors}
                        onEditColor={handleColorChange}
                        show={showColorPicker}
                    />
                }
            </div>
        </AlignPortal>
    );
}
