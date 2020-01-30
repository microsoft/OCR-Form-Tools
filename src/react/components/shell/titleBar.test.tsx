// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { mount, ReactWrapper } from "enzyme";
import { TitleBar, ITitleBarProps, ITitleBarState } from "./titleBar";

describe("TileBar Component", () => {
    let wrapper: ReactWrapper<ITitleBarProps, ITitleBarState>;
    const defaultProps: ITitleBarProps = {
        title: "Test Title",
        icon: "fas fa-tags",
    };

    let handlerMapping = {};

    const mockMenu: any = {
        items: [{
            label: "Top Level Menu",
            type: "submenu",
            visible: true,
            enabled: true,
            submenu: {
                items: [
                    {
                        label: "Normal Item", accelerator: "CmdOrCtrl+O",
                        click: jest.fn(), visible: true, enabled: true, type: "normal",
                    },
                    { type: "separator", visible: true, enabled: true },
                    { label: "Checkbox Item", type: "checkbox", checked: true, visible: true, enabled: true },
                    { label: "Disabled Item", enabled: false, visible: true, type: "normal" },
                    { label: "Invisible Item", visible: false, enabled: true, type: "normal" },
                    { label: "Role Item", role: "quit", visible: true, enabled: true, type: "normal" },
                ],
            },
        }],
    };

    const electronCurrentWindow = {
        on: jest.fn((evt, handler) => {
            handlerMapping[evt] = handler;
        }),
        isMaximized: jest.fn(() => false),
        isFullScreen: jest.fn(() => false),
        setTitle: jest.fn(),
        minimize: jest.fn(),
        maximize: jest.fn(),
        unmaximize: jest.fn(),
        close: jest.fn(),
    };

    const electronMock = {
        remote: {
            getCurrentWindow: jest.fn(() => electronCurrentWindow),
            Menu: {
                getApplicationMenu: jest.fn(() => mockMenu),
            },
        },
    };

    function createComponent(props?: ITitleBarProps): ReactWrapper<ITitleBarProps, ITitleBarState> {
        props = props || defaultProps;
        return mount(
            <TitleBar {...props}>
                <ul>
                    <li>
                        <a title="Profile" href="#/profile">
                            <i className="fas fa-user-circle"></i>
                        </a>
                    </li>
                </ul>
            </TitleBar>,
        );
    }

    beforeEach(() => {
        handlerMapping = {};
        wrapper = createComponent();
    });

    describe("Web", () => {
        beforeAll(() => {
            window["require"] = undefined;
            Object.defineProperty(global.process, "platform", {
                value: undefined,
            });
        });

        it("renders ico, title and children", () => {
            const icon = wrapper.find(".title-bar-icon");
            const title = wrapper.find(".title-bar-main");

            expect(icon.exists()).toBe(true);
            expect(icon.find(".fa-tags").exists()).toBe(true);
            expect(title.exists()).toBe(true);
            expect(title.text()).toEqual(`${defaultProps.title} - Form UX`);
            expect(wrapper.find(".fa-user-circle").exists()).toBe(true);
        });
    });
});
