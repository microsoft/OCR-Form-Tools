// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

function backFillAriaLabelledBy(id: string) {
    const element = document.getElementById(id);
    if (element) {
        if (!element.hasAttribute("aria-labelledby")) {
            const ariaAttrNode = document.createAttribute("aria-labelledby");
            ariaAttrNode.value = `${id}_errors`;
            element.setAttributeNode(ariaAttrNode);
        }
    }
}

function getPropertiesIds(properties: any) {
    const Ids: string[] = [];
    Object.keys(properties).forEach((item) => Ids.push(`root_${item}`));
    return Ids;
}

export {backFillAriaLabelledBy, getPropertiesIds};
