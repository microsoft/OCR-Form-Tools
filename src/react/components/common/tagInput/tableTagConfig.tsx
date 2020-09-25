// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'

import { Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, SelectionMode, DetailsListLayoutMode, FontIcon } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme, getDefaultTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, IApplicationState, TagInputMode } from '../../../../models/applicationState';
import { filterFormat } from "../../../../common/utils";
import { toast } from "react-toastify";
import "./tableTagConfig.scss";
import { strings } from "../../../../common/strings";



interface IShareProps {
    // appSettings?: IAppSettings,
    // currentProject?: IProject;
}
interface IShareState {
    // appSettings: IAppSettings,
    // currentProject: IProject;
}



// const dark: ICustomizations = {
//     settings: {
//       theme: getDarkGreyTheme(),
//     },
//     scopedSettings: {},
// };

interface ITableTagConfigProps {
    setTagInputMode: (addTableMode: TagInputMode) => void;
    addTableTag: (table: any) => void;
}


interface ITableTagConfigState {
    rows: any[],
    columns: any[],
    name: string,
    format: string,
}

const options: IChoiceGroupOption[] = [
    {
        key: 'fixed',
        text: 'fixed',
        iconProps: { iconName: 'Table' }
    },
    {
        key: 'rowDynamic',
        text: 'row-dynamic',
        iconProps: { iconName: 'InsertRowsBelow' }
    },
];

const dark: ICustomizations = {
    settings: {
        theme: getRightPaneDefaultButtonTheme(),
    },
    scopedSettings: {},
};
const defaultTheme: ICustomizations = {
    settings: {
        theme: getDefaultTheme(),
    },
    scopedSettings: {},
};

const formatOptions = (type = "string") => {
    const options = [];
    const formats = filterFormat(type)
    Object.entries(formats).forEach(([key, value]) => {
        options.push({ key, text: value })
    });

    return options;
};
const typeOptions = () => {
    const options = [];
    Object.entries(FieldType).forEach(([key, value]) => {
        options.push({ key, text: value })
    });
    return options;
};

/**
 * @name - Table tag configuration
 * @description - Configures table tag (assigns row's/column's headers and their respective data types and formats)
 */

export default function TableTagConfig(props: ITableTagConfigProps) {
    const { setTagInputMode = null, addTableTag = null } = props;
    const table: ITableTagConfigState = {
        name: "",
        format: "fixed",
        rows: [{ name: "", type: FieldType.String, format: FieldFormat.NotSpecified }],
        columns: [{ name: "", type: FieldType.String, format: FieldFormat.NotSpecified }],
    };
    const tags = useSelector((state: IApplicationState) => {
        return state.currentProject.tags
    });

    const [name, setName] = useState(table.name);
    const [format, setFormat] = useState(table.format);
    const [columns, setColumns] = useState(table.columns);
    const [rows, setRows] = useState(table.rows);
    const [notUniqueNames, setNotUniqueNames] = useState({ columns: [], rows: [], tags: false });


    const selectColumnType = (idx: number, type: string) => {
        setColumns(columns.map((col, currIdx) =>
            idx === currIdx ? { ...col, type, format: FieldFormat.NotSpecified } : col
        ));
    };

    const selectColumnFormat = (idx: number, format: string) => {
        setColumns(columns.map((col, currIdx) =>
            idx === currIdx ? { ...col, format } : col
        ));
    };

    const columnListColumns: IColumn[] = [
        {
            key: "name",
            name: "name",
            // className: "composed-icon-cell",
            fieldName: "name",
            minWidth: 100,
            maxWidth: 400,
            isResizable: false,
            onRender: (row, index) => (
                <div className="maxyoo">
                    <TextField
                        className="maxyoo"
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(event) => setColumnName(index, event.target["value"])}
                        value={row.name}
                        placeholder={`header name ${index + 1}`}
                        errorMessage={getTextInputError(notUniqueNames.columns, row.name, index)}
                    />
                </div>),
            // headerClassName: "list-header",
        },
        {
            key: "type",
            name: "type",
            fieldName: "type",
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender: (row, index) =>
                <Customizer {...defaultTheme}>
                    <Dropdown
                        placeholder={row.type}
                        defaultSelectedKey={FieldType.String}
                        options={typeOptions()}
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(e, val) => {
                            selectColumnType(index, val.text);
                        }}

                    />
                </Customizer>
        },
        {
            key: "format",
            name: "format",
            fieldName: "format",
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender: (row, index) =>
                <Customizer {...defaultTheme}>
                    <Dropdown
                        placeholder={row.format}
                        selectedKey={row.format}
                        options={formatOptions(row.type)}
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(e, val) => {
                            selectColumnFormat(index, val.text);
                        }}
                    />
                </Customizer>

        },
    ]



    const addColumn = () => setColumns([...columns, { name: "", type: FieldType.String, format: FieldFormat.NotSpecified }]);
    const addRow = () => setRows([...rows, { name: "", type: FieldType.String, format: FieldFormat.NotSpecified }]);

    const setRowName = (rowIndex, name) => {
        setRows(
            rows.map((row, currIndex) => (rowIndex === currIndex) ?
                { ...row, name }
                : row)
        );
    };

    const setColumnName = (colIndex, name) => {
        setColumns(
            columns.map((column, currIndex) => (colIndex === currIndex)
                ? { ...column, name }
                : column)
        );

    };

    const rowListColumns: IColumn[] = [
        {
            key: "name",
            name: "name",
            // className: "composed-icon-cell",
            fieldName: "name",
            minWidth: 100,
            maxWidth: 400,
            isResizable: false,
            onRender: (row, index) => {
                return (
                    <div className="maxyoo">
                        <TextField
                            className="maxyoo"
                            theme={getGreenWithWhiteBackgroundTheme()}
                            onChange={(event) => setRowName(index, event.target["value"])}
                            value={row.name}
                            placeholder={`header name ${index + 1}`}
                            errorMessage={getTextInputError(notUniqueNames.rows, row.name, index)}
                        />
                    </div>
                )
            },
            // headerClassName: "list-header",
        },
    ];

    function setTableName(name: string) {
        setName(name);
    }


    // Validation //

    function getTextInputError(array: any[], rowName: string, index: number) {
        if (!rowName.length) {
            return strings.tags.regionTableTags.configureTag.errors.emptyName
        } else if (array.length && array.findIndex((item) => (item === index)) !== -1) {
            return strings.tags.regionTableTags.configureTag.errors.notUniqueName;
        } else {
            return undefined
        }
    };

    function checkNameUniqueness(array, arrayName) {
        const duplicates = {};
        let notUnique = [];
        array.forEach((item, idx) => {
            if (item.name && item.name.length) {
                duplicates[item.name] = duplicates[item.name] || [];
                duplicates[item.name].push(idx)
            }

        });
        for (const name in duplicates) {
            if (duplicates[name].length > 1) {
                notUnique = duplicates[name];
            }
        }
        setNotUniqueNames({ ...notUniqueNames, [arrayName]: notUnique })
    }

    // check input names as you type
    useEffect(() => {
        checkNameUniqueness(columns, "columns");
    }, [columns]);
    useEffect(() => {
        checkNameUniqueness(rows, "rows");
    }, [rows]);

    useEffect(() => {
        const existingTagName = tags.find((item) => item.name === name);
        setNotUniqueNames({ ...notUniqueNames, tags: existingTagName !== undefined ? true : false})
    }, [name, tags]);

    function save() {
        addTableTag({ name, format, rows, columns });
        setTagInputMode(TagInputMode.Basic);
    }

    function hasEmptyNames(array) {
       return array.find((i) => !i.name.length) !== undefined ? true : false
    }

    function validateInputAndSave() {
        if (notUniqueNames.columns.length > 0 || notUniqueNames.rows.length > 0 || notUniqueNames.tags || !name.length || hasEmptyNames(rows) || hasEmptyNames(columns)) {
            toast.error(strings.tags.regionTableTags.configureTag.errors.checkFields, { autoClose: 8000 });
        } else {
            save();
        }
    }

    // render
    return (
        <Customizer {...dark}>
            <div className="zzpppzz">
                <h4 className="mt-2">Configure table tag</h4>
                <h5 className="mt-3">Name:</h5>
                <TextField
                    className="zzyy"
                    theme={getGreenWithWhiteBackgroundTheme()}
                    onChange={(event) => setTableName(event.target["value"])}
                    value={name}
                    errorMessage={name ? notUniqueNames.tags ? strings.tags.regionTableTags.configureTag.errors.notUniqueTagName : "" : strings.tags.regionTableTags.configureTag.errors.assignTagName}
                />
                <h5 className="mt-3">Format:</h5>
                <ChoiceGroup
                    onChange={(event, option) => setFormat(option.key)}
                    defaultSelectedKey="fixed"
                    options={options}
                    theme={getRightPaneDefaultButtonTheme()}
                />
                <h5 className="mt-3">Column headers:</h5>
                <div className="details-list-container">
                    <DetailsList
                        className="detailsListRows"
                        items={columns}
                        columns={columnListColumns}
                        isHeaderVisible={true}
                        theme={getRightPaneDefaultButtonTheme()}
                        compact={true}
                        setKey="none"
                        selectionMode={SelectionMode.none}
                        layoutMode={DetailsListLayoutMode.justified}
                    />
                    <PrimaryButton
                        theme={getPrimaryBlueTheme()}
                        className="ml-2 mt-1"
                        autoFocus={true}
                        onClick={addColumn}>
                        <FontIcon iconName="AddTo" className="mr-2" />
                    Add column
                </PrimaryButton>
                </div>
                {format === "fixed" &&
                    <>
                        <h5 className="mt-3">Row headers:</h5>
                        <div className="details-list-container zzyy">
                            <DetailsList
                                className="zzpppzz"
                                items={rows}
                                columns={rowListColumns}
                                isHeaderVisible={true}
                                theme={getRightPaneDefaultButtonTheme()}
                                compact={true}
                                setKey="none"
                                selectionMode={SelectionMode.none}
                                layoutMode={DetailsListLayoutMode.justified}
                            />
                            <PrimaryButton
                                theme={getPrimaryBlueTheme()}
                                className="ml-2 mt-1"
                                autoFocus={true}
                                onClick={addRow}>
                                <FontIcon iconName="AddTo" className="mr-2" />
                                Add row
                            </PrimaryButton>
                        </div>
                    </>
                }

                <div className="modal-buttons-container mb-2 mr-1">
                    <PrimaryButton
                        className="modal-cancel mr-3"
                        theme={getPrimaryGreyTheme()}
                        onClick={() => setTagInputMode(TagInputMode.Basic)}
                    >Cancel</PrimaryButton>
                    <PrimaryButton
                        className="modal-cancel"
                        theme={getPrimaryGreenTheme()}
                        onClick={() =>
                            validateInputAndSave()
                        }>Save</PrimaryButton>
                </div>
            </div>
        </Customizer>
    );
}


