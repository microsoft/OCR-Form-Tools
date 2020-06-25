// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState, useRef, KeyboardEvent } from "react";
import {
    FontIcon,
    Spinner,
    SpinnerSize,
    Customizer,
    PrimaryButton,
} from "@fluentui/react";
import "./generatorPane.scss";
import "../condensedList/condensedList.scss";
import GeneratorEditor from "./generatorEditor";
import { dark, TagOperationMode, onItemRename, FormattedItemContextMenu, ColorPickerPortal } from "../tagInput/tagInput";
import { ITagClickProps } from "../tagInput/tagInputItem";
import { getPrimaryGreenTheme } from "../../../../common/themes";

import { FormattedItem, NamedItem, IGenerator, IGeneratorSettings } from "../../../../models/applicationState";
import TagInputToolbar, { ItemToolbarOptions } from "../tagInput/tagInputToolbar";
import { KeyboardBinding } from "../keyboardBinding/keyboardBinding";
import { KeyEventType } from "../keyboardManager/keyboardManager";

export interface IGeneratorPaneProps {
    generators: IGenerator[],
    assetGeneratorSettings: IGeneratorSettings,
    namedItems: NamedItem[],
    selectedIndex: number,
    generatorsLoaded: boolean,
    onSelectedGenerator: (region?: IGenerator) => void,
    onGeneratorsChanged: (newGenerators?: IGenerator[]) => void,
    onGeneratorsDeleted: (deletedGenerator: IGenerator[]) => void,
    onEditorEnter: (generator: IGenerator) => void,
    onEditorLeave: (generator: IGenerator) => void,
    setGeneratorSettings: (settings: Partial<IGeneratorSettings>) => void;
    onGenerateClick: () => void;
}

const MAX_GENERATE_COUNT = 100;
const strings = {
    generator: {
        title: "Generators",
        search: {
            placeholder: "Search generators"
        },
        generateCount: "Generation Count:",
        generateDesc: "Preview Generation",
        generateAction: "Generate",
    }
}

/**
 * @name - Generator Pane
 * @description - Controlling generator settings for pane
 */
// TODO memoize callbacks
// https://reactjs.org/docs/hooks-reference.html#usecallback
const GeneratorPane: React.FunctionComponent<IGeneratorPaneProps> = (props) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [operation, setOperation] = useState(TagOperationMode.None);

    const headerRef = useRef<HTMLDivElement>();

    const itemRefs = useRef<Map<string, React.MutableRefObject<HTMLDivElement>>>(new Map()); // er...

    if (props.generators.length === 0) {
        return null;
    }

    const selectedGenerator = props.selectedIndex !== -1 ? props.generators[props.selectedIndex]: null;
    const onEditorClick = (region: IGenerator, clickProps: ITagClickProps) => {
        const selected = selectedGenerator && selectedGenerator.id === region.id;
        let newOperation;
        if (clickProps.clickedDropDown) {
            const showContextualMenu = !selectedGenerator || !selected
                || operation !== TagOperationMode.ContextualMenu;
            newOperation = showContextualMenu ? TagOperationMode.ContextualMenu : TagOperationMode.None;
            if (showContextualMenu) {
                props.onSelectedGenerator(region);
            }
        } else if (clickProps.clickedColor) {
            const showColorPicker = operation !== TagOperationMode.ColorPicker;
            newOperation = showColorPicker ? TagOperationMode.ColorPicker : TagOperationMode.None;
            if (showColorPicker) {
                props.onSelectedGenerator(region);
            }
        } else { // Select tag
            newOperation = selected ? operation : TagOperationMode.None;
            const deselect = selected && operation === TagOperationMode.None;
            // do we deselect? By default, if we click on already selected, do deselect
            if (selected && operation === TagOperationMode.None) {
                props.onSelectedGenerator();
            }
            if (!deselect) {
                props.onSelectedGenerator(region);
            }
        }
        setOperation(newOperation);
    }

    const setItemRef = (divRef: React.MutableRefObject<HTMLDivElement>, item: FormattedItem) => {
        // TODO use id instead?
        itemRefs.current.set(item.name, divRef);
    }

    const renderGenerators = () => {
        const { generators, selectedIndex, namedItems } = props;
        let regions = generators;
        if (searchQuery.length) {
            regions = regions.filter((r) => !r.tag?.name ||
            r.tag?.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        const onCancel = () => {
            setOperation(TagOperationMode.None);
        }
        const editorProps = regions.map((r,index) => ({
            region: r,
            index: 1, // why?
            isRenaming: operation === TagOperationMode.Rename && index === selectedIndex,
            isSelected: index === selectedIndex,
            onClick: onEditorClick.bind(this, r),
            cancelRename: onCancel,
            onRename: onItemRename.bind(this, namedItems, r, onCancel, handleNameChange),
            setRef: (divRef) => setItemRef(divRef, r.tag),
            onEnter: props.onEditorEnter.bind(this, r),
            onLeave: props.onEditorLeave.bind(this, r),
        }));
        itemRefs.current.clear();
        return [];
        // return regions.map((r, index) =>
        //     <GeneratorEditor
        //         {...editorProps[index]}
        //         key={r.id}
        //     />);
    }

    const onSearchKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            setSearchOpen(false);
        }
    }

    const setValidGenerateCount = (event: any) => {
        const { value, min, max } = event.target;
        const validValue = Math.max(Number(min), Math.min(Number(max), Number(value)));
        props.setGeneratorSettings({generateCount: validValue});
    }

    const onHideContextualMenu = () => {
        setOperation(TagOperationMode.None);
    }

    const toggleRenameMode = () => {
        const newOperation = operation === TagOperationMode.Rename
            ? TagOperationMode.None : TagOperationMode.Rename;
        setOperation(newOperation);
    }

    const handleKeyDown = (keyEvent) => {
        switch (keyEvent.key) {
            case "R":
                toggleRenameMode();
                break;
        }
    }

    const onItemFormatChanged = (oldItem: FormattedItem, newItem: Partial<FormattedItem>) => {
        const newGenerators = props.generators.map(g => {
            return g.tag === oldItem ? {...g, tag: {...g.tag, ...newItem}} : g;
        })
        props.onGeneratorsChanged(newGenerators);
        // find the selected item and change it and call the generators changed
    }

    const onReOrder = (item: FormattedItem, displacement: number) => {
        if (!item) {
            return;
        }
        const items = [...props.generators];
        const currentIndex = items.findIndex(g => g.tag === item);
        const newIndex = currentIndex + displacement;
        if (newIndex < 0 || newIndex >= items.length) {
            return;
        }
        const splicedGen = items.splice(currentIndex, 1)[0];
        items.splice(newIndex, 0, splicedGen);
        props.onSelectedGenerator(props.generators[newIndex]);
        props.onGeneratorsChanged(items);
    }

    const onDelete = (item: FormattedItem) => {
        if (!item) {
            return;
        }
        const deletedGen = props.generators.find(g => g.tag === item);
        props.onGeneratorsDeleted([deletedGen]);
    }

    const handleColorChange = (color: string) => {
        // ok, are we sure this only fires when a generator is selected?
        if (!selectedGenerator) {
            // this is bad
            console.error("no generator selected on color change?");
            return;
        }
        setOperation(TagOperationMode.None);
        onItemFormatChanged(selectedGenerator.tag, {color});
    }

    // Odd arg due to tagInput format
    const handleNameChange = (oldItem: FormattedItem, newItem: FormattedItem, cancelCallback: () => void) => {
        onItemFormatChanged(oldItem, newItem); // drop cancel since we have no confirmation box
    }

    // TODO shouldn't the color portal be aligned to the itemref and not the headerref?
    const selectedRef = selectedGenerator ? itemRefs.current.get(selectedGenerator.tag?.name) : null;

    const toolbarOpts = [
        ItemToolbarOptions.search,
        ItemToolbarOptions.rename,
        ItemToolbarOptions.moveDown,
        ItemToolbarOptions.moveUp,
        ItemToolbarOptions.delete,
    ]
    return (
        <div className="tag-input">
            <KeyboardBinding
                displayName={"Generator tools"}
                key={"Generator Tools"}
                keyEventType={KeyEventType.KeyDown}
                accelerators={["R"]}
                handler={handleKeyDown}
            />
            <div ref={headerRef} className="tag-input-header p-2">
                <span className="tag-input-title">{strings.generator.title}</span>
                <TagInputToolbar
                    selected={selectedGenerator?.tag}
                    onSearch={() => {
                      setSearchOpen(!searchOpen);
                      setSearchQuery("");
                    }}
                    onRename={toggleRenameMode}
                    onDelete={onDelete}
                    onReorder={onReOrder}
                    options={toolbarOpts}
                />
            </div>
            <div className="tag-input-body-container">
            {
                props.generatorsLoaded ?
                    <div className="tag-input-body">
                        <div className="tag-input">
                            <div className="tag-input-text-input-row">
                                <span className="tag-input-input-row-desc">
                                    {strings.generator.generateCount}
                                </span>
                                <input
                                    className="tag-search-box"
                                    type="number"
                                    onChange={setValidGenerateCount}
                                    value={props.assetGeneratorSettings.generateCount}
                                    placeholder="1"
                                    min="1"
                                    max={MAX_GENERATE_COUNT}
                                />
                            </div>
                            <div className="tag-input-text-input-row">
                                <span className="tag-input-input-row-desc">
                                    {strings.generator.generateDesc}
                                </span>
                                <PrimaryButton
                                    id="generate_generateButton"
                                    theme={getPrimaryGreenTheme()}
                                    autoFocus={true}
                                    className="flex-center"
                                    onClick={props.onGenerateClick}>
                                    <FontIcon iconName="MachineLearning" />
                                    <h6 className="d-inline text-shadow-none ml-2 mb-0"> {strings.generator.generateAction} </h6>
                                </PrimaryButton>
                            </div>
                        </div>
                        {
                            searchOpen &&
                            <div className="tag-input-text-input-row search-input">
                                <input
                                    className="tag-search-box"
                                    type="text"
                                    onKeyDown={onSearchKeyDown}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={strings.generator.search.placeholder}
                                    autoFocus={true}
                                />
                                <FontIcon iconName="Search" />
                            </div>
                        }
                        <div className="tag-input-items">
                            {renderGenerators()}
                            <Customizer {...dark}>
                                {
                                    operation === TagOperationMode.ContextualMenu && selectedRef &&
                                    <FormattedItemContextMenu
                                        item={selectedGenerator?.tag}
                                        onRename={toggleRenameMode}
                                        onDelete={onDelete}
                                        onReOrder={onReOrder}
                                        selectedRef={selectedRef}
                                        onHideContextualMenu={onHideContextualMenu}
                                        onItemChanged={onItemFormatChanged}
                                    />
                                }
                            </Customizer>
                            <ColorPickerPortal
                                selectedItem={selectedGenerator?.tag}
                                operation={operation}
                                handleColorChange={handleColorChange}
                                alignRef={headerRef}
                            />
                        </div>
                    </div>
                :
                <Spinner className="loading-generator" size={SpinnerSize.large}/>
            }
            </div>
        </div>
    );
}

export default GeneratorPane;
