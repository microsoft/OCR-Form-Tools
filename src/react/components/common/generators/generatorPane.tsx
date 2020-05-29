// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState, KeyboardEvent } from "react";
import { IGeneratorRegion } from "../../pages/editorPage/editorPage";
import {
    FontIcon,
    Spinner,
    SpinnerSize,
} from "office-ui-fabric-react";
import "./generatorPane.scss";
import "../condensedList/condensedList.scss";
import { dark, TagOperationMode } from "../tagInput/tagInput";
import { toast } from "react-toastify";

/**
 * TODO
 * per region info
 * optional names for regions
 * onleave and onenter
 * num copies info
 * add search bar
 * enable context menu
 */

/**
 * Properties for Generator Pane
 * @member generatorRegion - Info for selected region
 */
export interface IGeneratorPaneProps {
    generatorRegions: IGeneratorRegion[]
    selectedIndex: number,
    generatorsLoaded: boolean,
    onDeselectedGeneratorRegion: () => void,
}

const strings = {
    generator: {
        title: "Generators",
        search: {
            placeholder: "Search generators"
        }
    }
}

/**
 * @name - Generator Pane
 * @description - Controlling generator settings for pane
 */
const GeneratorPane: React.FunctionComponent<IGeneratorPaneProps> = (props) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [operation, setOperation] = useState(TagOperationMode.None);

    if (props.generatorRegions.length === 0) {
        return null;
    }
    let activeID;
    if (props.selectedIndex === -1) {
        activeID = "None";
    } else {
        activeID = props.generatorRegions[props.selectedIndex].uid;
    }

    const onEditorClick = (region: IGeneratorRegion) => {
        // props describe the type of click that occurred
        // TODO add them props back (needed for the type assignment)
        const { generatorRegions, selectedIndex } = props;
        const selected =  generatorRegions[selectedIndex].uid === region.uid;
        const newOperation = selected ? operation : TagOperationMode.None;
        // do we deselect? By default, if we click on already selected, do deselect
        if (selected && operation === TagOperationMode.None) {
            props.onDeselectedGeneratorRegion();
        }
        setOperation(newOperation);
    }

    // ughhh we probably need logic to not conflict with old tagssssss
    const onEditorRename = (region: IGeneratorRegion, name: string, cancel: () => void) => {}

    const renderGenerators = () => {
        const { generatorRegions, selectedIndex } = props;
        // this.tagItemRefs.clear();
        let regions = generatorRegions;
        if (searchQuery.length) {
            regions = regions.filter((r) => !r.name ||
            r.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        const perRegionProps = regions.map((r,index) => ({
            r,
            index: 1, // why?
            isRenaming: operation === TagOperationMode.Rename && index === selectedIndex,
            isSelected: index === selectedIndex,
            onClick: onEditorClick,
            onRename: () => null,
        }));
        return regions.map((r, index) =>
            <RegionInput
                {...perRegionProps[index]}
                key={r.uid}
                onRegionEnter={props.onLabelEnter}
                onRegionLeave={props.onLabelLeave}
            />);
    }

    const

    const onSearchKeyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") {
            setSearchOpen(false);
        }
    }

    return (
        <div className="tag-input">
            <div ref={this.headerRef} className="tag-input-header p-2">
                <span className="tag-input-title">{strings.generator.title}</span>
                Total regions: {props.generatorRegions.length}.
            </div>
            {
                this.props.generatorsLoaded ?
                <div className="tag-input-body-container">
                    <div className="tag-input-body">
                        Active region: {activeID}
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
                        </div>
                    </div>
                </div>
                :
                <Spinner className="loading-generator" size={SpinnerSize.large}/>
            }
        </div>
    );
}

export default GeneratorPane;


// Context menu stuff
// {/* <Customizer {...dark}> */}
// {/* {
//     tagOperation === TagOperationMode.ContextualMenu && selectedTagRef &&
//     <ContextualMenu
//         className="tag-input-contextual-menu"
//         items={this.getContextualMenuItems()}
//         target={selectedTagRef}
//         onDismiss={this.onHideContextualMenu}
//     />
// } */}
// </Customizer>
