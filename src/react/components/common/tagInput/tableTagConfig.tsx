

import React, { useState } from 'react';
import "./tableTagConfig.scss";
import { Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, IDropdownOption, SelectionMode, DetailsListLayoutMode, FontIcon } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, TagInputMode } from '../../../../models/applicationState';


interface IShareProps {
    // appSettings?: IAppSettings,
    // currentProject?: IProject;
}
interface IShareState {
    // appSettings: IAppSettings,
    // currentProject: IProject;
}

// function mapStateToProps(state: IApplicationState) {
//     return {
//         appSettings: state.appSettings,
//         currentProject: state.currentProject,
//     };
// }

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






export default function TableTagConfig(props: ITableTagConfigProps) {
    const { setTagInputMode = null, addTableTag = null } = props;

    const initialState: ITableTagConfigState = {
        name: "",
        format: "fixed",
        rows: [{ name: "", type: FieldType.String, format: FieldFormat.NotSpecified }],
        columns: [{ name: "", type: FieldType.String, format: FieldFormat.NotSpecified }],
    };

    const [name, setName] = useState(initialState.name);
    const [format, setFormat] = useState(initialState.format);
    const [columns, setColumns] = useState(initialState.columns);
    const [rows, setRows] = useState(initialState.rows);




    // public componentDidUpdate = async (prevProps: Readonly<ITableTagConfigProps>, prevState: Readonly<ITableTagConfigState>) => {  // }

    const typeOptions: IDropdownOption[] = [
        { key: FieldType.String, text: FieldType.String },
    ];

    const formatOptions: IDropdownOption[] = [
        { key: FieldFormat.NotSpecified, text: FieldFormat.NotSpecified },
    ];

    const columnListColumns: IColumn[] = [
        {
            key: "name",
            name: "name",
            // className: "composed-icon-cell",
            className: "column-name_input",
            fieldName: "name",
            minWidth: 100,
            maxWidth: 360,
            isResizable: false,
            onRender: (row, index) => (
                    <TextField
                    theme={getGreenWithWhiteBackgroundTheme()}
                        onChange={(event) => setColumnName(index, event.target["value"])}
                        value={row.name}
                    />),
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
                <Dropdown
                    className="type_dropdown"
                    selectedKey={FieldType.String}
                    options={typeOptions}
                    theme={getGreenWithWhiteBackgroundTheme()}
                // onChange={this.selectSource}
                />
        },
        {
            key: "format",
            name: "format",
            fieldName: "format",
            minWidth: 100,
            maxWidth: 100,
            isResizable: false,
            onRender: (row, index) =>
                <Dropdown
                    className="format_dropdown"
                    selectedKey={FieldFormat.NotSpecified}
                    options={formatOptions}
                    theme={getGreenWithWhiteBackgroundTheme()}
                // onChange={this.selectSource}
                />
        },
    ];

    const rowListColumns: IColumn[] = [
        {
            key: "name",
            name: "name",
            // className: "composed-icon-cell",
            fieldName: "name",
            minWidth: 100,
            maxWidth: 360,
            isResizable: false,
            onRender: (row, index) => {
                return (
                        <TextField
                            className="row-name_input"
                            theme={getGreenWithWhiteBackgroundTheme()}
                            onChange={(event) => setRowName(index, event.target["value"])}
                            value={row.name}
                        />
                )
            },
            headerClassName: "list-header",
        },
    ];



    const addColumn = () => setColumns([...columns, { name: "", type: FieldType.String, format: FieldFormat.NotSpecified }]);
    const addRow = () => setRows([...rows, { name: "", type: FieldType.String, format: FieldFormat.NotSpecified }]);

    const setRowName = (rowIndex, name) => {
        setRows(
            rows.map((row, currIndex) => (rowIndex === currIndex) ?
                { name, type: row.type, format: row.format }
                : row)
        );
    };

    const setColumnName = (rowIndex, name) => {
        setColumns(
            columns.map((row, currIndex) => (rowIndex === currIndex)
                ? { name, type: row.type, format: row.format }
                : row)
        );
    };


    return (
        <Customizer {...dark}>
            <div className="config-view_container">
                <h4 className="mt-2">Configure table tag</h4>
                <h5 className="mt-3 ">Name:</h5>
                <TextField
                    className="table-name_input ml-12px"
                    theme={getGreenWithWhiteBackgroundTheme()}
                    onChange={(event) => setName(event.target["value"])}
                    value={name}
                />
                <h5 className="mt-4">Format:</h5>
                <ChoiceGroup
                    className="ml-12px"
                    onChange={(event, option) => setFormat(option.key)}
                    defaultSelectedKey="fixed"
                    options={options}
                    theme={getRightPaneDefaultButtonTheme()}
                />
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
                            selectionMode={SelectionMode.none}
                            layoutMode={DetailsListLayoutMode.justified}
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
                { format === "fixed" &&
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
                                selectionMode={SelectionMode.none}
                                layoutMode={DetailsListLayoutMode.justified}
                            />
                            <PrimaryButton
                                theme={getPrimaryBlueTheme()}
                                className="add_button ml-12px"
                                autoFocus={true}
                                onClick={addRow}>
                                <FontIcon iconName="Add" className="mr-2" />
                                Add row
                            </PrimaryButton>
                        </div>
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
                        onClick={() => {
                            addTableTag({name, format, rows, columns});
                            setTagInputMode(TagInputMode.Basic)
                        }}>Save</PrimaryButton>
                </div>
            </div>
        </Customizer>
    );
}


