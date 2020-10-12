import React from 'react';
import { toast } from "react-toastify";
import "./tableTagConfig.scss";
import { IconButton, Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, IDropdownOption, SelectionMode, DetailsListLayoutMode, FontIcon, ThemeSettingName, DefaultButton, DetailsRowBase } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, TagInputMode, ITag, IRegion, ITableTag, ITableRegion, IField } from '../../../../models/applicationState';
import "./tableTagLabeling.scss";

import clone from "rfdc";
import { strings } from "../../../../common/strings";


interface ITableTagLabelingProps {
    setTagInputMode: (addTableMode: TagInputMode) => void;
    selectedTag: ITableTag,
    selectedRegions?: IRegion[];
    onTagClick?: (tag: ITableTag) => void;
    selectedTableTagBody: ITableRegion[][][];
    handleTableCellClick: (iTableCellIndex, jTableCellIndex) => void;
    splitPaneWidth: number;
}


interface ITableTagLabelingState {
    selectedRowIndex: number;
    selectedColumnIndex: number;
    containerWidth: number;
    rows: IField[],
    columns: IField[],
    selectedTableTagBody: any,
}

// @connect(mapStateToProps)
export default class TableTagLabeling extends React.Component<ITableTagLabelingProps> {
    public state: ITableTagLabelingState = {
        selectedRowIndex: null,
        selectedColumnIndex: null,
        containerWidth: this.props.splitPaneWidth,
        rows: this.props.selectedTag.rowKeys,
        columns: this.props.selectedTag.columnKeys,
        selectedTableTagBody: this.props.selectedTableTagBody,

    };

    public componentDidMount = async () => {
        console.log(this.props)
    }

    public componentDidUpdate = async (prevProps: Readonly<ITableTagLabelingProps>, prevState: Readonly<ITableTagLabelingState>) => {
        // console.log(this.props.selectedRegions)

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
                <div className="table-labeling_container"
                    style={{ width: this.props.splitPaneWidth < 650 ? 650 : this.props.splitPaneWidth }}>
                    <h4 className="mt-2  ml-4">{strings.tags.regionTableTags.tableLabeling.title}</h4>
                    <div className="labeling-guideline">
                        To start labeling your table:
                        <ol>
                            <li>Select the words on the document you want to label</li>
                            <li>Click the table cell you want to label selected words to</li>
                        </ol>
                    </div>
                    <h5 className="mb-4 ml-1 table-name">
                        <span style={{ borderBottom: `4px solid ${this.props.selectedTag.color}` }}>Table name: {this.props.selectedTag.name}</span>
                    </h5>
                    <div className="table-view-container">
                        <table className="viewed-table">
                            <tbody>
                                {this.getTableBody(this.state.rows, this.state.columns)}
                            </tbody>
                        </table>
                    </div>
                    {this.props.selectedTag.format === FieldFormat.RowDynamic &&  <div className="add-row-button_container">
                        <PrimaryButton
                            theme={getPrimaryBlueTheme()}
                            className="add_button ml-6"
                            autoFocus={true}
                            onClick={this.addRow}
                        >
                            <FontIcon iconName="Add" className="mr-2" />
                                Add row
                            </PrimaryButton>
                    </div>}
                    <div className="buttons-container">
                        <PrimaryButton
                            className="button-done"
                            theme={getPrimaryGreenTheme()}
                            onClick={() => {
                                this.props.setTagInputMode(TagInputMode.Basic)
                            }}
                        >{strings.tags.regionTableTags.tableLabeling.buttons.done}
                        </PrimaryButton>
                        <DefaultButton
                            className="button-reconfigure"
                            theme={getPrimaryGreenTheme()}
                            onClick={() => { this.props.setTagInputMode(TagInputMode.ConfigureTable)}}
                        >{strings.tags.regionTableTags.tableLabeling.buttons.reconfigureTable}
                        </DefaultButton>
                    </div>

                </div>
            </Customizer>
        )
    }

    public getTableBody = (rows: any, columns: any) => {
        const table = { rows, columns };
        let selectedTableTagBody = this.props.selectedTableTagBody;
        console.log("#: TableTagLabeling -> publicgetTableBody -> rows", rows);
        const isRowDynamic = this.props.selectedTag.format === FieldFormat.RowDynamic;

        if (isRowDynamic) {
            selectedTableTagBody = new Array(rows.length);
            for (let i = 0; i < selectedTableTagBody.length; i++) {
                selectedTableTagBody[i] = new Array(columns.length);
            }
        }

        let tableBody = null;
        if (table.rows.length !== 0 && table.columns.length !== 0) {
            tableBody = [];
            const rows = table["rows"];
            const columns = table["columns"];
            for (let i = 0; i < rows.length + 1; i++) {
                const tableRow = [];
                for (let j = 0; j < columns.length + 1; j++) {
                    if (i === 0 && j !== 0) {
                        tableRow.push(<th key={j} className={"column_header"}>{columns[j - 1].fieldKey}</th>);
                    } else if (j === 0 && i !== 0) {
                        tableRow.push(<th key={j} className={`row_header ${isRowDynamic ? "hidden" : ""}`}>{rows[i - 1].fieldKey}</th>);
                    } else if (j === 0 && i === 0) {
                        tableRow.push(<th key={j} className={`empty_header  ${isRowDynamic ? "hidden" : ""}`} />);
                    } else {
                            console.log(
                                "\nselectedTableTagBody", selectedTableTagBody, "\ntableRow:", tableRow
                            );
                            tableRow.push(
                                <td className={"table-cell"} onClick={() => this.handleCellClick(i - 1, j - 1)} key={j}>{selectedTableTagBody[i - 1][j - 1]?.map((tableRegion) => tableRegion.value).join(" ")}
                                </td>);
                    }
                }
                tableBody.push(<tr key={i}>{tableRow}</tr>);
            }
        }
        return tableBody
    }

    private addRow = () => {
        // Add row to dynamic table
        const rows = [...this.state.rows, {
            fieldKey: `#${this.state.rows.length + 1}`,
            fieldType: FieldType.String,
            fieldFormat: FieldFormat.NotSpecified
        }]
        this.setState({ rows });
    };

    private handleCellClick = (iToChange, jToChange) => {
        // const tableBody = clone()(this.props.tableBody);
        // tableBody[iToChange].props.children[jToChange] = this.props.selectedRegions.map((region) => region.value).join(" ")};
        this.props.handleTableCellClick(iToChange, jToChange)
    }
}
