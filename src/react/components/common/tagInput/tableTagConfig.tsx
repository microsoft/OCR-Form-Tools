import React, { useEffect, useState } from 'react';
import "./tableTagConfig.scss";
import { Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, IDropdownOption, SelectionMode, DetailsListLayoutMode, FontIcon } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, TagInputMode } from '../../../../models/applicationState';
import { filterFormat } from "../../../../common/utils";


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
                <Dropdown
                    placeholder={row.type}
                    defaultSelectedKey={FieldType.String}
                    options={typeOptions()}
                    theme={getGreenWithWhiteBackgroundTheme()}
                    onChange={(e, val) => {
                        selectColumnType(index, val.text);
                    }}
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
                    placeholder={row.format}
                    selectedKey={row.format}
                    options={formatOptions(row.type)}
                    theme={getGreenWithWhiteBackgroundTheme()}
                    onChange={(e, val) => {
                        selectColumnFormat(index, val.text);
                    }}
                />
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
                ? { ...column, name}
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
                        />
                    </div>
                )
            },
            // headerClassName: "list-header",
        },
    ];

    return (
        <Customizer {...dark}>
            <div className="zzpppzz">
                <h4 className="mt-2">Configure table tag</h4>
                <h5 className="mt-3">Name:</h5>
                <TextField
                    className="zzyy"
                    theme={getGreenWithWhiteBackgroundTheme()}
                    onChange={(event) => setName(event.target["value"])}
                    value={name}
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
                { format === "fixed" &&
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
                        onClick={() => {
                            addTableTag({name, format, rows, columns});
                            setTagInputMode(TagInputMode.Basic)
                            console.log("# table:",{name, format, rows, columns} )
                        }}>Save</PrimaryButton>
                </div>
            </div>
        </Customizer>
    );
}


