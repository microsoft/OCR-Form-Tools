// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState } from "react";
import { Modal } from "office-ui-fabric-react/lib/Modal";
import { FontIcon, IFontIconProps } from "office-ui-fabric-react";
import { ICustomizations, Customizer } from "office-ui-fabric-react/lib/Utilities";
import { useId } from "@uifabric/react-hooks";
import { getDarkGreyTheme } from "../../../common/themes";
import { strings } from "../../../common/strings";

import "./keyboardShortcuts.scss";

export interface IHotKeysModalState {
    showModal: boolean;
}
interface IKey {
    key: string;
    modifier?: string;
}
export interface IShortcutsItems {
    name: string;
    ariaLabel: string;
    keys: IKey[];
    description: string;
}

export const KeyboardShortcuts: React.FC = () => {
    const dark: ICustomizations = {
        settings: {
            theme: getDarkGreyTheme(),
        },
        scopedSettings: {},
    };
    const uniqueId: string = useId("shortcuts");

    const [showModal, setShowModal] = useState(true);
    const closeModal = () => setShowModal(false);

    const shortcutsItems: IShortcutsItems[] = [
        {
            name: strings.shortcuts.squareBrackets.name,
            ariaLabel: strings.shortcuts.squareBrackets.ariaLabel,
            keys: [
                {
                    key: strings.shortcuts.squareBrackets.keys.key1,
                    modifier: strings.shortcuts.modifiers.or,
                },
                {
                    key: strings.shortcuts.squareBrackets.keys.key2,
                },
            ],
            description: strings.shortcuts.squareBrackets.description,
        },
        {
            name: strings.shortcuts.greaterAndLessThan.name,
            ariaLabel: strings.shortcuts.greaterAndLessThan.ariaLabel,
            keys: [
                {
                    key: strings.shortcuts.greaterAndLessThan.keys.key1,
                    modifier: strings.shortcuts.modifiers.or,
                },
                {
                    key: strings.shortcuts.greaterAndLessThan.keys.key2,
                },
            ],
            description: strings.shortcuts.greaterAndLessThan.description,
        },
        {
            name: strings.shortcuts.zoomKeys.name,
            ariaLabel: strings.shortcuts.zoomKeys.name,
            keys: [
                {
                    key: strings.shortcuts.zoomKeys.keys.key1,
                    modifier: strings.shortcuts.modifiers.or,
                },
                {
                    key: strings.shortcuts.zoomKeys.keys.key2,
                    modifier: strings.shortcuts.modifiers.and,
                },
                {
                    key: strings.shortcuts.zoomKeys.keys.key3,
                },
            ],
            description: strings.shortcuts.zoomKeys.description,
        },
        {
            name: strings.shortcuts.deleteAndBackspace.name,
            ariaLabel: strings.shortcuts.deleteAndBackspace.ariaLabel,
            keys: [
                {
                    key: strings.shortcuts.deleteAndBackspace.keys.key1,
                    modifier: strings.shortcuts.modifiers.or,
                },
                {
                    key: strings.shortcuts.deleteAndBackspace.keys.key2,
                },
            ],
            description: strings.shortcuts.deleteAndBackspace.description,
        },

    ];

    const tipsItems = [
        {
            name: strings.shortcuts.tips.quickLabeling.name,
            description: strings.shortcuts.tips.quickLabeling.description,
        },
        {
            name: strings.shortcuts.tips.renameTag.name,
            description: strings.shortcuts.tips.renameTag.description,
        },
        {
            name: strings.shortcuts.tips.multipleWordSelection.name,
            description: strings.shortcuts.tips.multipleWordSelection.description,
        },
    ];
    const ShortcutsListItem = ({ item }): JSX.Element => {
        const { id, description, keys } = item;
        return (
            <li key={id} className="shortcut">
                <span className="shortcut-keys">
                    {
                         keys.map((item) => {
                             return Object.keys(item).map((el) => (
                                 <span key={`${uniqueId}`} className={`keyboard-${el}`}>{item[el]}</span>));
                         })
                    }
                </span>
                <span className="shortcut-description description">{description}</span>

            </li>);
    };

    const TipsListItem = ({ item }): JSX.Element => (
        <li key={item.id}>
            <h6>{item.name}</h6>
            <p className="description">{item.description}</p>
        </li>
    );

    return (
        <Customizer {...dark}>
            <FontIcon
                className="shortcuts-modal-button"
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
                <div className="shortcuts-list-container">
                    <h3 className="header">{strings.shortcuts.headers.keyboardShortcuts}</h3>
                    <ul className="shortcuts-list">
                        {
                            shortcutsItems.map((item) => <ShortcutsListItem item={item} />)
                        }
                    </ul>
                </div>
                <div className="tips-list-container">
                    <h3 className="header">{strings.shortcuts.headers.otherTips}</h3>
                    <ul className="tips-list">
                        {
                            tipsItems.map((item) => <TipsListItem item={item} />)
                        }
                    </ul>
                </div>
            </Modal>
        </Customizer>
    );
};
