import React from 'react';
import { toast } from "react-toastify";
import "./tableTagConfig.scss";
import { IconButton, Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, IDropdownOption, SelectionMode, DetailsListLayoutMode, FontIcon } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, TagInputMode, ITag, IRegion } from '../../../../models/applicationState';


interface ITableTagLabelingProps {
    setTagInputMode: (addTableMode: TagInputMode) => void;
    selectedTag: ITag,
    selectedRegions?: IRegion[];
    onTagClick?: (tag: ITag) => void;
}


interface ITableTagLabelingState {
    selectedRowIndex: number;
    selectedColumnIndex: number;
    tableBody: any[];
}

// @connect(mapStateToProps)
export default class TableTagLabeling extends React.Component<ITableTagLabelingProps> {
    public static defaultProps: ITableTagLabelingProps = {
        setTagInputMode: null,
        selectedTag: null,
    };

    public state: ITableTagLabelingState = {
        selectedRowIndex: null,
        selectedColumnIndex: null,
        tableBody: [],
    };

    public componentDidMount = async () => {
        this.getTableBody();
        console.log(this.props.selectedRegions)

    }

    public componentDidUpdate = async (prevProps: Readonly<ITableTagLabelingProps>, prevState: Readonly<ITableTagLabelingState>) => {
        console.log(this.props.selectedRegions)

    }

    public render() {

          const dark: ICustomizations = {
            settings: {
              theme: getRightPaneDefaultButtonTheme(),
            },
            scopedSettings: {},
        };

        return (
            <Customizer {...dark}>

                <div className="zzpppzz">
                    <h4 className="mt-2">{"Label table"}</h4>
                    <div className="table-view-container">
                        <table className="viewed-table">
                            <tbody>
                                {this.state.tableBody}
                            </tbody>
                        </table>
                    </div>

                    <div className="modal-buttons-container mb-2 mr-1">

                        <PrimaryButton
                            className="modal-cancel mr-3"
                            theme={getPrimaryGreyTheme()}
                            onClick={() => this.props.setTagInputMode(TagInputMode.Basic)}
                        >
                            Cancel
                        </PrimaryButton>
                        <PrimaryButton
                            className="modal-cancel"
                            theme={getPrimaryGreenTheme()}
                            onClick={() => {
                                this.props.setTagInputMode(TagInputMode.Basic)
                            }}
                        >
                            Apply
                        </PrimaryButton>
                    </div>

                </div>
            </Customizer>
        )
    }

    private getTableBody = () => {
        const table = {rows: this.props.selectedTag.rowKeys, columns: this.props.selectedTag.columnKeys};
        let tableBody = null;
        if (table.rows.length !== 0 && table.columns.length !== 0) {
            tableBody = [];
            const rows = table["rows"];
            const columns = table["columns"];
            for (let i = 0; i < rows.length+1; i++) {
                const tableRow = [];
                for (let j = 0; j < columns.length+1; j++) {
                    if (i === 0 && j !== 0) {
                        tableRow.push(<td key={j}>{columns[j-1].fieldKey}</td>);
                    } else if (j === 0 && i !== 0) {
                        tableRow.push(<td key={j}>{rows[i-1].fieldKey}</td>);
                    } else {
                        tableRow.push(<td onClick={() => this.handleCellClick(i, j)} key={j}></td>);
                    }
                }
                tableBody.push(<tr key={i}>{tableRow}</tr>);
            }
        }
        this.setState({tableBody})
    }

    private handleCellClick = (iToChange, jToChange) => {
        console.log(this.props.selectedRegions)
        const prevTableBody = this.state.tableBody;
        const tableBody = [];
        for (let i = 0; i < prevTableBody.length; i++) {
            const tableRow = [];
            for (let j = 0; j < prevTableBody[i].props.children.length; j++) {
                if (i !== iToChange || j !== jToChange) {
                    tableRow.push(<td onClick={() => this.handleCellClick(i, j)} key={j}> {prevTableBody[i].props.children[j].props.children} </td>);
                }
                else {
                    tableRow.push(<td onClick={() => this.handleCellClick(i, j)} key={j}>{this.props.selectedRegions.map((region) => region.value).join(" ")}</td>);
                }
            }
            tableBody.push(<tr key={i}>{tableRow}</tr>);
        }

        console.log(tableBody)
        console.log(this.state.tableBody)
        this.setState({tableBody})
        this.props.onTagClick(this.props.selectedTag)
    }
}
