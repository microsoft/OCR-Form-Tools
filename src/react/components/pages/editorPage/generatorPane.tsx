// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { IGeneratorRegion } from "./editorPage";

/**
 * Properties for Generator Pane
 * @member generatorRegion - Info for selected region
 */
export interface IGeneratorPaneProps {
    generatorRegions: IGeneratorRegion[]
    selectedIndex: number
}

/**
 * @name - Generator Pane
 * @description - Controlling generator settings for pane
 */
const GeneratorPane: React.FunctionComponent<IGeneratorPaneProps> = (props) => {
    const [tagName, setTagName] = useState("");
    if (props.generatorRegions.length === 0) {
        return null;
    }
    let activeID;
    if (props.selectedIndex === -1) {
        activeID = "None";
    } else {
        activeID = props.generatorRegions[props.selectedIndex].uid;
    }
    return (
        <div>
            Total regions: {props.generatorRegions.length}.
            Active region: {activeID}
        </div>
    );
}

export default GeneratorPane;
