// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { IGeneratorRegion } from "./editorPage";

/**
 * Properties for Generator Pane
 * @member generatorRegion - Info for selected region
 */
export interface IGeneratorPaneProps {
    generatorRegion?: IGeneratorRegion
}

/**
 * @name - Generator Pane
 * @description - Controlling generator settings for pane
 */
const GeneratorPane: React.FunctionComponent<IGeneratorPaneProps> = (props) => {
    const [tagName, setTagName] = useState("");
    if (!props.generatorRegion) {
        return null;
    }
    return (
        <div>
            ID: {props.generatorRegion.uid}
        </div>
    );
}

export default GeneratorPane;
