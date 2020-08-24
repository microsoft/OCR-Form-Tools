// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React, { useState } from 'react';
// import useForm from "./useForm";
import { TextField, Dropdown, IconButton, PrimaryButton, FontIcon, IDropdownOption } from "@fluentui/react";
import { getPrimaryRedTheme, getPrimaryGreenTheme } from "../../../../../common/themes";
import { FieldType } from "../../../../../models/applicationState";
import * as _ from 'lodash';

const dropDownOptions = () => {
    const options: IDropdownOption[] = [];
    Object.entries(FieldType).forEach(([key, value]) => {
        options.push({ key: value, text: value, title: `${value} data type` })
    })
    return options;
};

interface IItem {
    index: number;
    value: string;
    type: string;
}





const Form = (props) => {
    const { role, data, onChange, fixedTable } = props;
    const [items, setItems] = useState(data);

    function addItem(ev) {
        setItems([...items, {uuid: Math.random()}]);
        onChange();
    }

    function onDeleteItem(idx) {
        items.splice(idx, 1)
        setItems(_.clone(items))
        onChange();
    }

    return (
        <div className="headers-form">
            {items.length > 0 && <div className="header-title">
                <h6 className="input-title">{role}s:</h6>
                <h6 className="dropdown-title">Data type (required):</h6>
            </div>}
            <ul className="headers-list">
                {items.map((item, idx) => <HeaderInput
                    role={role}
                    key={item.uuid}
                    idx={idx}
                    data={item}
                    onDelete={() => onDeleteItem(idx)}
                    onChange={onChange} />)
                }
            </ul>
            <PrimaryButton
                type="submit"
                theme={getPrimaryGreenTheme()}
                className="add-header-button"
                text={"Add " + role}
                allowDisabledFocus
                disabled={false}
                checked={false}
                onClick={addItem}
                primaryDisabled={role === "row" && fixedTable}
            >
            <FontIcon role="button" iconName= {'Add'} className="add-icon" />
            </PrimaryButton>
        </div>
    )
}


const HeaderInput = ({ role, idx, data, onDelete, onChange }) => {
    return (
        <li className="header-item">
            <TextField
                name={`${role}-${[role].length + 1}`}
                className="header-item_input"
                placeholder={`${role} #${idx + 1} name`}
                value={data.value}
                onChange={(e, text) => {
                    data.value = text;
                    onChange();
                }}
            />
            <Dropdown
                className="header-item_dropdown"
                selectedKey={data.type ? data.type : FieldType.String}
                options={dropDownOptions()}
                required
                onChange={(ev, text) => {
                    data.type = text.key;
                    onChange();
                }}

            />
            <IconButton
                iconProps={{ iconName: 'Delete' }}
                theme={getPrimaryRedTheme()}
                className="header-item-delete_button"
                allowDisabledFocus
                disabled={false}
                checked={false}
                onClick={onDelete}
            >
            </IconButton>
        </li>
    );
};

export default Form;



