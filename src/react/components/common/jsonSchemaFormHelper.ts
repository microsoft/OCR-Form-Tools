// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

function backFillAriaLabelledBy(id: string) {
    const element = document.getElementById(id);
    if (element && !element.hasAttribute("aria-labelledby")) {
        const errorId = `${id}_errors`;
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            const ariaAttrNode = document.createAttribute("aria-labelledby");
            ariaAttrNode.value = errorId;
            element.setAttributeNode(ariaAttrNode);
        }
    }
}

function getPropertiesIds(properties: any) {
    const Ids: string[] = [];
    Object.keys(properties).map((item) => Ids.push(`root_${item}`));
    return Ids;
}

export {backFillAriaLabelledBy, getPropertiesIds};
