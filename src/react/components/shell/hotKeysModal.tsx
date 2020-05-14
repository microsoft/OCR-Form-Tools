// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { Modal } from "office-ui-fabric-react/lib/Modal";
import { FontIcon, IFontIconProps } from "office-ui-fabric-react";
import { ICustomizations, Customizer } from "office-ui-fabric-react/lib/Utilities";
import { getDarkGreyTheme } from "../../../common/themes";
import "./hotKeysModal.scss";

export interface IHotKeysModalState {
    showModal: boolean;
}
export interface IHotkeysItems {
    id: string;
    name: string;
    ariaLabel: string;
    keys?: string;
    description: string;
    icon?: IFontIconProps;
}

export const HotKeysModal: React.FunctionComponent = () => {
    const dark: ICustomizations = {
        settings: {
            theme: getDarkGreyTheme(),
        },
        scopedSettings: {},
    };

    const [showModal, setShowModal] = useState(false);
    const closeModal = () => setShowModal(false);
    const hotkeysItems: IHotkeysItems[] = [
        {
            id: "squareBrackets",
            name: "square brackets",
            ariaLabel: "< or >",
            keys: "<  or  >",

            description: "can be used move the selection to the previous or the next word",
        },
        {
            id: "greaterAndLessThan",
            name: "greater-than and less-than",
            ariaLabel: "[  or  ]",
            keys: "[  or  ]",
            description: "can be used go to the previous or the next page in multi-pages documents",
        }, {
            id: "zoomKeys",
            name: "zoom keys",
            ariaLabel: "- or + and /",
            keys: "- or + and /",
            description: "can be used to zoom in/out and reset zoom of editing page",
        },
    ];
    const tipsItems = [
        {
            id: "tips1",
            name: "keys 1 through 0 and all letters ",
            description: "Hotkeys of 1 through 0 and all letters are assigned to first 36 tags, after you selected one or multiple words from the highlighted text elements, by pressing these hotkeys, you can label the selected words.",
        },
        {
            id: "tips2",
            name: "Alt and click",
            description: "Hold Alt key and click on tag name, user can change the tag's name.",
        },
        {
            id: "tips3",
            name: "click and hover",
            description: "Click and hold on word, than  hover over other words to do multiple words selection at a time.",
        },
    ];

    //
    return (
        <Customizer {...dark}>
            <FontIcon
                className="hotkeys-modal-button"
                iconName="BookAnswers"
                role="button"
                onClick={() => setShowModal(true)}
            />
            <Modal
                titleAriaId={"Hot Keys Modal"}
                isOpen={showModal}
                onDismiss={closeModal}
                isBlocking={false}
                containerClassName={"container"}
            >
                <FontIcon className="close-modal" role="button" onClick={closeModal} iconName="Cancel" />
                <div className="container"
                >

                    <div className="header">
                        <h4>HOT KEYS &amp; TIPS</h4>
                        <p className="intro-text">
                            Labeling tool allows a number of keyboard shortcuts to support accessibility and also sometimes make labeling easier and faster.</p>
                    </div>
                    <div className={"body"}>
                        <h6 className="header">HOT KEYS LIST</h6>
                        <ul className="hotkeys-list">
                            {
                                hotkeysItems.map((item) =>
                                    (
                                        <li key={item.id}>
                                            <code>{item.keys}</code>
                                            <p>{item.description}</p>
                                        </li>
                                    ))
                            }
                        </ul>
                        <div>
                            <h6 className="header">TIPS</h6>
                            <ul className="hotkeys-list">
                                {
                                    tipsItems.map((item) =>
                                        (
                                            <li key={item.id}>
                                                <code>{item.name}</code>
                                                <p>{item.description}</p>
                                            </li>
                                        ))
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            </Modal>
        </Customizer>

    );
};
