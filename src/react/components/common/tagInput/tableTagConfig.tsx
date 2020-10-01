// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux'

import { Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, SelectionMode, DetailsListLayoutMode, FontIcon, CheckboxVisibility, IContextualMenuItem, CommandBar, Selection, Separator } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme, getDefaultTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, IApplicationState, TagInputMode } from '../../../../models/applicationState';
import { filterFormat } from "../../../../common/utils";
import { toast } from "react-toastify";
import "./tableTagConfig.scss";
import { strings } from "../../../../common/strings";
import _ from "lodash";




interface IShareProps {
    // appSettings?: IAppSettings,
    // currentProject?: IProject;
}

interface ItableCell {
    fieldKey: string,
    fieldType: string,
    fieldFormat: string,
}
interface IShareState {
    // appSettings: IAppSettings,
    // currentProject: IProject;
}



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
interface ITableConfigItem {
    index?: number,
    name: string,
    format: string,
    type: string;
}

const tableFormatOptions: IChoiceGroupOption[] = [
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
const headersFormatAndTypeOptions: IChoiceGroupOption[] = [
    {
        key: 'columns',
        text: 'Column headers',
    },
    {
        key: 'rows',
        text: 'Row headers',
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
        rows: [{ name: "", type: FieldType.String, format: FieldFormat.NotSpecified, index: 0 }],
        columns: [{ name: "", type: FieldType.String, format: FieldFormat.NotSpecified, index: 0 }],

    };
    const tags = useSelector((state: IApplicationState) => {
        return state.currentProject.tags
    });

    const [name, setName] = useState<string>(table.name);
    const [format, setFormat] = useState<string>(table.format);
    const [columns, setColumns] = useState<ITableConfigItem[]>(table.columns);
    const [rows, setRows] = useState<ITableConfigItem[]>(table.rows);
    const [notUniqueNames, setNotUniqueNames] = useState<{ columns: [], rows: [], tags: boolean }>({ columns: [], rows: [], tags: false });
    const [headersFormatAndType, setHeadersFormatAndType] = useState<string>("columns");
    const [selectedColumn, setSelectedColumn] = useState(undefined);
    const [selectedRow, setSelectedRow] = useState(undefined)


    // const getSelectionDetails = (): string =>  {
    //     let selectionCount = selection.getSelectedCount();

    //     switch (selectionCount) {
    //         case 0:
    //             return 'No items selected';
    //         case 1:
    //             return '1 item selected: '
    //         default:
    //             return `${selectionCount} items selected`;
    //     }
    // }
    // const [selectionDetails, setSelectionDetails] = useState({})
    // const [selection, setSelection] = useState(new Selection({
    //     onSelectionChanged: () => setSelectionDetails(getSelectionDetails())
    // }))
    // const [selection, setSelection] = useState(new Selection({
    //     onSelectionChanged: () => setSelectionDetails(getSelectionDetails())
    // }))



    function selectColumnType(idx: number, type: string) {
        setColumns(columns.map((col, currIdx) => idx === currIdx ? { ...col, type, format: FieldFormat.NotSpecified } : col
        ));
    }

    function selectColumnFormat(idx: number, format: string) {
        setColumns(columns.map((col, currIdx) => idx === currIdx ? { ...col, format } : col
        ));
    }
    function selectRowType(idx: number, type: string) {
        setRows(rows.map((row, currIdx) => idx === currIdx ? { ...row, type, format: FieldFormat.NotSpecified } : row
        ));
    }

    function selectRowFormat(idx: number, format: string) {
        setRows(rows.map((row, currIdx) => idx === currIdx ? { ...row, format } : row
        ));
    }

    const columnListColumns: IColumn[] = [
        {
            key: "name",
            name: "name",
            // className: "composed-icon-cell",
            fieldName: "name",
            isRowHeader: false,
            minWidth: 360,
            maxWidth: 360,
            isResizable: false,
            onRender: (row, index) => {
                return (
                    <TextField
                        className="column-name_input"
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(event) => setColumnName(index, event.target["value"])}
                        value={row.name}
                        placeholder={`header name ${index + 1}`}
                        errorMessage={getTextInputError(notUniqueNames.columns, row.name, index)}
                    />
                )
            },
            headerClassName: "list-header",
        },
        {
            key: "type",
            name: "type",
            fieldName: "type",
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender: (row, index) => headersFormatAndType === "columns" ?
                <Customizer {...defaultTheme}>
                    <Dropdown
                        className="type_dropdown"
                        placeholder={row.type}
                        defaultSelectedKey={FieldType.String}
                        options={typeOptions()}
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(e, val) => {
                            selectColumnType(index, val.text);
                        }}
                    />
                </Customizer>
                : <></>
        },
        {
            key: "format",
            name: "format",
            fieldName: "format",
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender: (row, index) => headersFormatAndType === "columns" ?
                <Customizer {...defaultTheme}>
                    <Dropdown
                        className="format_dropdown"
                        placeholder={row.format}
                        selectedKey={row.format}
                        options={formatOptions(row.type)}
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(e, val) => {
                            selectColumnFormat(index, val.text);
                        }}
                    />
                </Customizer>
                : <></>
        },
    ];

    const rowListColumns: IColumn[] = [
        {
            key: "name",
            name: "name",
            // className: "composed-icon-cell",
            fieldName: "name",
            minWidth: 360,
            maxWidth: 360,
            isResizable: false,
            // isRowHeader: true,
            onRender: (row, index) => {
                return (
                    <TextField
                        className="row-name_input"
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(event) => setRowName(index, event.target["value"])}
                        value={row.name}
                        placeholder={`header name ${index + 1}`}
                        errorMessage={getTextInputError(notUniqueNames.rows, row.name, index)}
                    />
                )
            },
            headerClassName: "list-header",
        },
        {
            key: "type",
            name: "type",
            fieldName: "type",
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender: (row, index) => headersFormatAndType === "rows" ?
                <Customizer {...defaultTheme}>
                    <Dropdown
                        className="type_dropdown"
                        placeholder={row.type}
                        defaultSelectedKey={FieldType.String}
                        options={typeOptions()}
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(e, val) => {
                            selectRowType(index, val.text);
                        }}
                    />
                </Customizer>
                : <></>
        },
        {
            key: "format",
            name: "format",
            fieldName: "format",
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender: (row, index) => headersFormatAndType === "rows" ?
                <Customizer {...defaultTheme}>
                    <Dropdown
                        className="format_dropdown"
                        placeholder={row.format}
                        selectedKey={row.format}
                        options={formatOptions(row.type)}
                        theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(e, val) => {
                            selectRowFormat(index, val.text);
                        }}
                    />
                </Customizer>
                : <></>
        },
    ];



    function addColumn() {
        return setColumns([...columns, { name: "", type: FieldType.String, format: FieldFormat.NotSpecified, index: columns.length++ }]);
    }

    function addRow() {
        return setRows([...rows, { name: "", type: FieldType.String, format: FieldFormat.NotSpecified, index: rows.length++ }]);
    }

    function setRowName(rowIndex: number, name: string) {
        setRows(
            rows.map((row, currIndex) => (rowIndex === currIndex) ?
                { ...row, name }
                : row)
        );
    }

    function setColumnName(colIndex: number, name: string) {
        setColumns(
            columns.map((column, currIndex) => (colIndex === currIndex)
                ? { ...column, name }
                : column)
        );
    }

    function setTableName(name: string) {
        setName(name);
    }

    // CommandBar
    // function _getHeaderFarItems(): IContextualMenuItem[] { }
    function getRowsHeaderItems(): IContextualMenuItem[] {
        return [
            {
                key: 'ingore',
                text: '',
                disabled: true,
            },
            {
                key: 'Name',
                text: 'Name',
                style: { width: 250, textAlign: "left", marginLeft: -48 },
                disabled: true,
            },
            {
                key: 'moveUp',
                text: 'Move up',
                iconOnly: true,
                iconProps: { iconName: 'Up' },
                onClick: (e) => {
                    onReOrder(selectedRow, -1, "rows")
                },
                disabled: !selectedRow!,
            },
            {
                key: 'moveDown',
                text: 'Move down',
                iconOnly: true,
                iconProps: { iconName: 'Down' },
                onClick: (e) => {
                    onReOrder(selectedRow, 1, "rows")
                },
                disabled: !selectedRow!,
            },
            {
                key: 'deleteRow',
                text: 'Delete row',
                iconOnly: true,
                iconProps: { iconName: 'Delete' },
                onClick: (e) => {
                    setRows(rows
                        .filter((row) => row.index !== selectedRow.index)
                        .map((row, newIdx) => ({ ...row, index: newIdx })));
                },
                disabled: !selectedRow!,

            },
            {
                key: 'type',
                text: 'Type',
                style: { width: 100, textAlign: "left", marginLeft: 12 },
                disabled: true,

            },
            {
                key: 'format',
                text: 'Format',
                style: { width: 100, textAlign: "left", marginLeft: 12 },
                disabled: true,
            },
        ];
    };
    function getColumnsHeaderItems(): IContextualMenuItem[] {
        return [
            {
                key: 'ingore',
                text: '',
                disabled: true,
            },
            {
                key: 'Name',
                text: 'Name',
                style: { width: 250, textAlign: "left", marginLeft: -48 },
                disabled: true,
            },
            {
                key: 'moveUp',
                text: 'Move up',
                iconOnly: true,
                iconProps: { iconName: 'Up' },
                onClick: (e) => {
                    onReOrder(selectedColumn, -1, "columns")

                },
                disabled: !selectedColumn,
            },
            {
                key: 'moveDown',
                text: 'Move down',
                iconOnly: true,
                iconProps: { iconName: 'Down' },
                onClick: (e) => {
                    onReOrder(selectedColumn, 1, "columns")
                },
                disabled: !selectedColumn,
            },
            {
                key: 'deleteColumn',
                text: 'Delete column',
                iconOnly: true,
                iconProps: { iconName: 'Delete' },
                onClick: (e) => {
                    setColumns(columns
                        .filter((col) => col.index !== selectedColumn.index)
                        .map((col, newIdx) => ({ ...col, index: newIdx })));
                },
                disabled: !selectedColumn,

            },
            {
                key: 'type',
                text: 'Type',
                style: { width: 100, textAlign: "left", marginLeft: 12 },
                disabled: true,

            },
            {
                key: 'format',
                text: 'Format',
                style: { width: 100, textAlign: "left", marginLeft: 12 },
                disabled: true,
            },
        ];
    };

    // Validation //
    function getTextInputError(array: any[], rowName: string, index: number) {
        if (!rowName?.length) {
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

    // check input names as you type[]
    useEffect(() => {
        checkNameUniqueness(columns, "columns");
    }, [columns]);
    useEffect(() => {
        checkNameUniqueness(rows, "rows");
    }, [rows]);

    useEffect(() => {
        const existingTagName = tags.find((item) => item.name === name);
        setNotUniqueNames({ ...notUniqueNames, tags: existingTagName !== undefined ? true : false })
    }, [name, tags]);

    function save(rows: ITableConfigItem[], columns: ITableConfigItem[]) {
        addTableTag({ name, format, rows, columns, headersFormatAndType });
        setTagInputMode(TagInputMode.Basic);
    }

    function hasEmptyNames(array: ITableConfigItem[]) {
        return array.find((i) => !i.name.length) !== undefined ? true : false
    }

    function resetTypAndFormatAndSave(headersFormatAndType) {
        let newRows = rows;
        let newColumns = columns;
        if (headersFormatAndType === "columns") {
            newRows = rows.map((row) => {
                return {
                    ...row,
                    type: FieldType.String,
                    format: FieldFormat.NotSpecified,
                }
            });
        } else if (headersFormatAndType === "rows") {
            newColumns = columns.map((col) => ({
                ...col,
                type: FieldType.String,
                format: FieldFormat.NotSpecified
            }));
        }
        save(newRows, newColumns);
    }

    function validateInputAndSave() {
        if (notUniqueNames.columns.length > 0
            || notUniqueNames.rows.length > 0
            || notUniqueNames.tags
            || !name.length
            || hasEmptyNames(rows) || hasEmptyNames(columns)) {
            toast.error(strings.tags.regionTableTags.configureTag.errors.checkFields, { autoClose: 8000 });
        } else {
            resetTypAndFormatAndSave(headersFormatAndType);
        }
    }

    // row selection
    const rowSelection = useMemo(() =>
        new Selection({
            onSelectionChanged: () => {
                setSelectedRow(rowSelection.getSelection()[0])
            }, selectionMode: SelectionMode.single,
        }), []
    );

    const columnSelection = useMemo(() =>
        new Selection({
            onSelectionChanged: () => {
                setSelectedColumn(columnSelection.getSelection()[0])
            }, selectionMode: SelectionMode.single,
        }), []
    );

    // reorder items
    function onReOrder(item, displacement, role) {

        if (!item.name) {
            return;
        }
        // debugger;
        const items = role === "rows" ? [...rows] : [...columns];
        const newItem = items.find(i => i.name === item.name);

        const currentIndex = items.indexOf(newItem);
        const newIndex = currentIndex + displacement;
        if (newIndex < 0 || newIndex > items.length) {
            return;
        }

        items.splice(currentIndex, 1);
        items.splice(newIndex, 0, { ...newItem, index: newIndex });

        const updatedIndicesItems = items.map((i, newIdx) => ({ ...i, index: newIdx }));

        if (role === "rows") {
            setRows(updatedIndicesItems);
        } else {
            setColumns(updatedIndicesItems);
        }
    }

    // useEffect(() => {
    //     console.log("# rows:", rows, ", cols:", columns)
    // }, [columns, rows]);


    // Table preview
    function getTableBody() {
        let tableBody = null;
        if (table.rows.length !== 0 && table.columns.length !== 0) {
            tableBody = [];
            for (let i = 0; i < rows.length + 1; i++) {
                const tableRow = [];
                for (let j = 0; j < columns.length + 1; j++) {
                    if (i === 0 && j !== 0) {
                        tableRow.push(<th key={`col-h-${j}`} className={"column_header"}>{columns[j - 1].name}</th>);
                    } else if (j === 0 && i !== 0) {
                        tableRow.push(<th key={`row-h-${j}`} className={"row_header"}>{rows[i - 1].name}</th>);
                    } else if (j === 0 && i === 0) {
                        tableRow.push(<th key={"ignore"}  className={"empty_header"} />);
                    } else {
                        tableRow.push(<td key={`cell-${i}-${j}`}className={"table-cell"} />);
                    }
                }
                tableBody.push(<tr key={`row-${i}`}>{tableRow}</tr>);
            }
        }
        return tableBody
    };

    const [tableChanged, setTableChanged] = useState(false);

    useEffect(() => {
        setTableChanged(
            (_.isEqual(columns, table.columns) && _.isEqual(rows, table.rows)) ? false : true)
    }, [columns, rows, table.columns, table.rows]);


    // render
    return (
        <Customizer {...dark}>
            <div className="config-view_container">
                <h4 className="mt-2">Configure table tag</h4>
                <h5 className="mt-3 ">Name:</h5>
                <TextField
                    className="table-name_input ml-12px"
                    theme={getGreenWithWhiteBackgroundTheme()}
                    onChange={(event) => setTableName(event.target["value"])}
                    value={name}
                    errorMessage={name ? notUniqueNames.tags ? strings.tags.regionTableTags.configureTag.errors.notUniqueTagName : "" : strings.tags.regionTableTags.configureTag.errors.assignTagName}
                />
                <h5 className="mt-4">Format:</h5>
                <ChoiceGroup
                    className="ml-12px"
                    onChange={(event, option) => {
                        setFormat(option.key)
                        if (option.key === "rowDynamic") {
                            setHeadersFormatAndType("columns");
                        }
                    }}
                    defaultSelectedKey="fixed"
                    options={tableFormatOptions}
                    theme={getRightPaneDefaultButtonTheme()}
                />
                {format === "fixed" && <>
                    <h5 className="mt-4" >Configure type and format for:</h5>
                    <ChoiceGroup
                        className="ml-12px"
                        defaultSelectedKey={"columns"}
                        options={headersFormatAndTypeOptions}
                        onChange={(e, option) => setHeadersFormatAndType(option.key)}
                        required={false} />
                </>
                }
                <div className="columns_container">
                    <h5 className="mt-3">Column headers:</h5>
                    <div className="columns-container">
                        <DetailsList
                            className="columns"
                            items={columns}
                            columns={columnListColumns}
                            isHeaderVisible={true}
                            theme={getRightPaneDefaultButtonTheme()}
                            compact={true}
                            setKey="none"
                            // selectionMode={SelectionMode.single}
                            selection={columnSelection}
                            layoutMode={DetailsListLayoutMode.justified}
                            checkboxVisibility={CheckboxVisibility.always}
                            onRenderDetailsHeader={() => (
                                <>
                                    <CommandBar items={getColumnsHeaderItems()} />
                                    <Separator styles={{ root: { height: 2, padding: 0 } }} />
                                </>
                            )}

                        />

                        <PrimaryButton
                            theme={getPrimaryBlueTheme()}
                            className="add_button ml-12px"
                            autoFocus={true}
                            onClick={addColumn}>
                            <FontIcon iconName="Add" className="mr-2" />
                    Add column
                </PrimaryButton>
                    </div>
                </div>
                {format === "fixed" &&
                    <div className="rows_container">
                        <h5 className="">Row headers:</h5>
                        <div className="rows-list_container">
                            <DetailsList
                                className="rows"
                                items={rows}
                                columns={rowListColumns}
                                isHeaderVisible={true}
                                theme={getRightPaneDefaultButtonTheme()}
                                compact={true}
                                setKey="none"
                                // selectionMode={SelectionMode.single}
                                selection={rowSelection}
                                layoutMode={DetailsListLayoutMode.justified}
                                checkboxVisibility={CheckboxVisibility.always}
                                selectionPreservedOnEmptyClick={true}
                                onRenderDetailsHeader={() => (
                                    <>
                                        <CommandBar items={getRowsHeaderItems()} />
                                        <Separator styles={{ root: { height: 2, padding: 0 } }} />
                                    </>
                                )}
                            />
                        </div>
                        <PrimaryButton
                            theme={getPrimaryBlueTheme()}
                            className="add_button ml-12px"
                            autoFocus={true}
                            onClick={addRow}>
                            <FontIcon iconName="Add" className="mr-2" />
                                Add row
                            </PrimaryButton>
                    </div>
                }
                {
                    tableChanged &&
                    <div className="preview_container">
                        <h5 className="mt-3 ">Preview:</h5>
                        <table className="table">
                            <tbody>
                                {getTableBody()}
                            </tbody>
                        </table>
                    </div>
                }
                <div className="control-buttons_container">
                    <PrimaryButton
                        className="cancel"
                        theme={getPrimaryGreyTheme()}
                        onClick={() => setTagInputMode(TagInputMode.Basic)}
                    >Cancel</PrimaryButton>
                    <PrimaryButton
                        className="save"
                        theme={getPrimaryGreenTheme()}
                        onClick={() =>
                            validateInputAndSave()
                        }>Save</PrimaryButton>
                </div>
            </div>
        </Customizer>
    );
};
