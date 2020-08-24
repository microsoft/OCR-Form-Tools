import React from 'react';
import { toast } from "react-toastify";
import "./tableTagConfig.scss";
import { IconButton, Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, IDropdownOption, SelectionMode, DetailsListLayoutMode, FontIcon } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme } from '../../../../common/themes';
import { FieldFormat, FieldType } from '../../../../models/applicationState';


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
    cancel: (addTableMode: boolean) => void;
    addTableTag: (table: any) => void;
}


interface ITableTagConfigState {
    rows: any[],
    columns: any[],
    name: string,
}

// @connect(mapStateToProps)
export default class TableTagConfig extends React.Component<ITableTagConfigProps> {
    public static defaultProps: ITableTagConfigProps = {
        cancel: null,
        addTableTag: null,
    };

    public state: ITableTagConfigState = {
        rows: [{name: "", type: FieldType.String, format: FieldFormat.NotSpecified}],
        columns: [{name: "", type: FieldType.String, format: FieldFormat.NotSpecified}],
        name: "",

    };

    public componentDidMount = async () => {

    }

    public componentDidUpdate = async (prevProps: Readonly<ITableTagConfigProps>, prevState: Readonly<ITableTagConfigState>) => {

    }

    public render() {
        const options: IChoiceGroupOption[] = [
            { key: 'fixed', text: 'fixed', iconProps: { iconName: 'Table' } },
            { key: 'rowDynamic', text: 'row-dynamic', iconProps: { iconName: 'InsertRowsBelow' } },
          ];

          const dark: ICustomizations = {
            settings: {
              theme: getRightPaneDefaultButtonTheme(),
            },
            scopedSettings: {},
        };

        const typeOptions: IDropdownOption[] = [
            { key: FieldType.String, text: FieldType.String },
        ];

        const formatOptions: IDropdownOption[] = [
            { key: FieldFormat.NotSpecified, text: FieldFormat.NotSpecified },
        ];

          const columnListcolumns: IColumn[] = [
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
                    onChange={(event) => this.setColumnName(index,  event.target["value"])}
                    value={row.name}
                />

                        </div>

                )
                },
                // headerClassName: "list-header",
            },
            {
                key: "type",
                name: "type",
                fieldName: "type",
                minWidth: 100,
                maxWidth: 100,
                isResizable: false,
                onRender: (row, index) => {
                    return (      
                    <Dropdown
                        // className="sourceDropdown"
                        selectedKey={FieldType.String}
                        options={typeOptions}
                        theme={getGreenWithWhiteBackgroundTheme()}

                        // onChange={this.selectSource}
                    />)
                
                    }            
                },
                {
                    key: "format",
                    name: "format",
                    fieldName: "format",
                    minWidth: 100,
                    maxWidth: 100,
                    isResizable: false,
                    onRender: (row, index) => {
                        return (      
                        <Dropdown
                            // className="sourceDropdown"
                            selectedKey={FieldFormat.NotSpecified}
                            options={formatOptions}
                            theme={getGreenWithWhiteBackgroundTheme()}
    
                            // onChange={this.selectSource}
                        />)
                    
                        }            
                    },
        ]

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
                                onChange={(event) => this.setRowName(index,  event.target["value"])}
                                value={row.name}
                            />
                        </div>
)
                },
                // headerClassName: "list-header",
            },
        ]
          
        return (
            <Customizer {...dark}>

            <div className="zzpppzz">
                <h4 className="mt-2">Configure table tag</h4>
                <h5 className="mt-3">Name:</h5>
                <TextField
                className="zzyy"
                theme={getGreenWithWhiteBackgroundTheme()}
                    onChange={(event) => this.setState({name: event.target["value"]}) }
                    value={this.state.name}
                />
                <h5 className="mt-3">Type:</h5>
                <ChoiceGroup 
                    defaultSelectedKey="fixed"
                    options={options}
                    theme={getRightPaneDefaultButtonTheme()}
                 />
                <h5 className="mt-3">Column headers:</h5> 
                <div className="details-list-container">
                <DetailsList
                    className="detailsListRows"
                    items={this.state.columns}
                    columns={columnListcolumns}
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
                    onClick={this.addColumn}>
                    <FontIcon iconName = "AddTo" className="mr-2" />
                    Add column
                </PrimaryButton>
                </div>

                <h5 className="mt-3">Row headers:</h5>
                 <div className="details-list-container zzyy">
                    <DetailsList
                        // className="zzpppzz"
                        items={this.state.rows}
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
                    onClick={this.addRow}>
                    <FontIcon iconName = "AddTo" className="mr-2" />
                    Add row
                </PrimaryButton>
                </div>

                <div className="modal-buttons-container mb-2 mr-1">

                    <PrimaryButton
                        className="modal-cancel mr-3"
                        theme={getPrimaryGreyTheme()}
                        onClick={() => this.props.cancel(false)}
                    >
                        Cancel
                    </PrimaryButton>
                    <PrimaryButton
                        className="modal-cancel"
                        theme={getPrimaryGreenTheme()}
                        onClick={() => {
                            this.props.addTableTag(this.state)
                            this.props.cancel(false)
                        }}
                    >
                        Save
                    </PrimaryButton>
                </div>

            </div>
            </Customizer>
        )
    }

    private addColumn = () => {
        this.setState({
            columns: [...this.state.columns, {name: "", type: FieldType.String, format: FieldFormat.NotSpecified}]
        })
    }

    private addRow = () => {
        this.setState({
            rows: [...this.state.rows, {name: "", type: FieldType.String, format: FieldFormat.NotSpecified}]
        })
    }

    private setRowName = (rowIndex, name) => {
        this.setState({
            rows: this.state.rows.map((row, currIndex) => {
                if (rowIndex === currIndex) {
                    return {name, type: row.type, format: row.format}
                } else {
                    return row;
                }
            })
        })
    }

    private setColumnName = (rowIndex, name) => {
        this.setState({
            columns: this.state.columns.map((row, currIndex) => {
                if (rowIndex === currIndex) {
                    return {name, type: row.type, format: row.format}
                } else {
                    return row;
                }
            })
        })
    }
}
