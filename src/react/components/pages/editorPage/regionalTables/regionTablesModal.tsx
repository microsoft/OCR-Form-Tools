// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { useState, useEffect } from "react";
import { Modal } from "@fluentui/react/lib/Modal";
import { ICustomizations, Customizer, TextField, ChoiceGroup, IChoiceGroupOption, FontIcon, IDragOptions, ContextualMenu, PrimaryButton } from "@fluentui/react/";
import { getDarkGreyTheme } from "../../../../../common/themes";
import * as _ from 'lodash';
import { IRegion } from "../../../../../models/applicationState";
// import StaticTable from "./staticTable";
// import { useSelector } from "react-redux";
import "./regionTablesModal.scss";
import Form from './Form';


export interface IRegionalTablesProps {
    openModal: boolean;
    selectedRegions?: IRegion[];
}

export interface IButtonAddTable {
    // These are set based on the toggles shown above the examples (not needed in real code)
    disabled?: boolean;
    checked?: boolean;
}

interface IHeaderProps {
    role: string;
    data?: {};
    items?: any[];
}

interface IItem {
    index: number;
    value: string;
    type: string;
}

const dark: ICustomizations = {
    settings: {
        theme: getDarkGreyTheme(),
    },
    scopedSettings: {},
};

const dragOptions: IDragOptions = {
    moveMenuItemText: "Move",
    closeMenuItemText: "Close",
    menu: ContextualMenu,
};
// ------------------
const tableOptions: IChoiceGroupOption[] = [
    { key: 'fixed', text: 'Fixed', iconProps: { iconName: 'Table' } },
    { key: 'dynamicRows', text: 'Dynamic Rows', iconProps: { iconName: 'InsertRowsBelow' } },
];

const onAddTable = () => {
    console.log("# Add table!")
}



// ------------------ RegionalTableModal Component ------------------ //

export const RegionalTableModal: React.FC<IRegionalTablesProps> = (props) => {
    // const { currentProject }: IApplicationState = useSelector((state) => state);

    const { openModal, selectedRegions } = props;
    const [showModal, setShowModal] = useState(openModal);
    const closeModal = () => setShowModal(false);
    useEffect(() => {
        setShowModal(openModal)
    }, [openModal]);

    const selection = props.selectedRegions?.map(({ value }: IRegion) => value).join(" ")
    useEffect(() => {
        copyToClipboard(selection);
    }, [selection]);


    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [tableKind, setTableKind] = useState(tableOptions[0].key)

    const onReset = () => {
        setColumns([]);
        setRows([]);
    };

    function updateColumns() {
        setColumns(_.clone(columns));
    };

    function updateRows() {
        setRows(_.clone(rows));
    };

    // Render Region Tables Component
    return (
        <Customizer {...dark}>
            <Modal
                titleAriaId={"Add Regional Table Modal"}
                isOpen={true}
                isBlocking={false}
                dragOptions={dragOptions}
                containerClassName="container"
                isModeless={true}
            // scrollableContentClassName="scroll"
            >
                <div className="header">
                    <h3>
                        <FontIcon className="table-icon" role="button" onClick={closeModal} iconName="Table" />
                        Regional Table Form
                    </h3>
                    <FontIcon className="close-modal" role="button" onClick={closeModal} iconName="Cancel" />
                </div>
                <div className="table-creator-container mt-8">
                    <section className="table-name-and-type">
                        <TextField
                            label="Table name:"
                            className="table-name"
                            inputClassName="table-name-input"
                            borderless={true}
                        />
                        <ChoiceGroup
                            label="Choose table type:"
                            className="table-type"
                            defaultSelectedKey={tableKind}
                            options={tableOptions}
                            height={"3rem"}
                            onChange={(ev,opt) => setTableKind(opt.key)}
                        />
                    </section>
                    <section className="table-setup-container">
                        <Form className="headers flex flex-column"
                            role="column"
                            key="column"
                            data={columns}
                            onChange={updateColumns}
                        />
                        <Form className="headers flex flex-column"
                            role="row"
                            key='row'
                            data={rows}
                            onChange={updateRows}
                            fixedTable={tableKind === "fixed"}
                            />
                    </section>
                    <section className="table-container mt-2">
                        {/* <StaticTable /> */}
                    </section>
                </div>
                <section className="control-buttons">
                    <PrimaryButton text="Reset"
                        onClick={onReset}
                        allowDisabledFocus
                        disabled={false}
                        checked={false}
                    />

                    <PrimaryButton text="Create Table"
                        onClick={onAddTable}
                        allowDisabledFocus
                        disabled={false}
                        checked={true}
                        className="create-table-button" />
                </section>
            </Modal>
        </Customizer>
    );
};


// helpers
const copyToClipboard = async (value: string) => {
    const clipboard = (navigator as any).clipboard;
    if (clipboard && clipboard.writeText) {
        await clipboard.writeText(value);
    }
}

