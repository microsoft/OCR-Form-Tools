import React from 'react';
import "./tableTagConfig.scss";
import { PrimaryButton, FontIcon, DefaultButton } from "@fluentui/react";
import { getPrimaryGreenTheme, getPrimaryBlueTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, TagInputMode, IRegion, ITableTag, ITableRegion, TableElements, ITableKeyField, TableVisualizationHint } from '../../../../models/applicationState';
import "./tableTagLabeling.scss";

import { strings } from "../../../../common/strings";


interface ITableTagLabelingProps {
    setTagInputMode: (addTableMode: TagInputMode, selectedTableTagToLabel?: ITableTag, selectedTableTagBody?: ITableRegion[][][]) => void;
    selectedTag: ITableTag,
    selectedRegions?: IRegion[];
    onTagClick?: (tag: ITableTag) => void;
    selectedTableTagBody: ITableRegion[][][];
    handleTableCellClick: (iTableCellIndex: number, jTableCellIndex: number) => void;
    handleTableCellMouseEnter: (regions: IRegion[]) => void
    handleTableCellMouseLeave: () => void
    addRowToDynamicTable: () => void;
    splitPaneWidth?: number;
}


interface ITableTagLabelingState {
    selectedRowIndex: number;
    selectedColumnIndex: number;
    rows: ITableKeyField[],
    columns: ITableKeyField[],
    selectedTableTagBody: any,
}

// @connect(mapStateToProps)
export default class TableTagLabeling extends React.Component<ITableTagLabelingProps> {
    public state: ITableTagLabelingState = {
        selectedRowIndex: null,
        selectedColumnIndex: null,
        rows: this.props.selectedTag.type === FieldType.Array || this.props.selectedTag?.visualizationHint === TableVisualizationHint.Vertical ? this.props.selectedTag.fields : this.props.selectedTag.definition.fields,
        columns: this.props.selectedTag.type === FieldType.Array || this.props.selectedTag.visualizationHint === TableVisualizationHint.Vertical ? this.props.selectedTag.definition.fields : this.props.selectedTag.fields,
        selectedTableTagBody: this.props.selectedTableTagBody,
    };

    public componentDidMount = async () => {
        if (this.props.selectedTag.type === FieldType.Array) {
            const rows = [{ fieldKey: "#0", fieldType: FieldType.String, fieldFormat: FieldFormat.NotSpecified }]
            for (let i = 1; i < this.props.selectedTableTagBody.length; i++) {
                rows.push({ fieldKey: "#" + i, fieldType: FieldType.String, fieldFormat: FieldFormat.NotSpecified });
            }
            this.setState({ rows });
        }
    }

    public componentDidUpdate = async (prevProps: Readonly<ITableTagLabelingProps>, prevState: Readonly<ITableTagLabelingState>) => {
        if (this.props.selectedTableTagBody.length !== prevProps.selectedTableTagBody.length) {
            const rows = [{ fieldKey: "#0", fieldType: FieldType.String, fieldFormat: FieldFormat.NotSpecified }]
            for (let i = 1; i < this.props.selectedTableTagBody.length; i++) {
                rows.push({ fieldKey: "#" + i, fieldType: FieldType.String, fieldFormat: FieldFormat.NotSpecified });
            }
            this.setState({ rows });
        }
    }

    public render() {
        return (
            <div className="table-labeling_container">
                <h4 className="mt-2">{strings.tags.regionTableTags.tableLabeling.title}</h4>
                <div className="labeling-guideline">
                    {strings.tags.regionTableTags.tableLabeling.description.title}
                    <ol>
                        <li>{strings.tags.regionTableTags.tableLabeling.description.stepOne}</li>
                        <li>{strings.tags.regionTableTags.tableLabeling.description.stepTwo}</li>
                    </ol>
                </div>
                <h5 className="mb-4 table-name">
                    <span style={{ borderBottom: `4px solid ${this.props.selectedTag.color}` }}>{`${strings.tags.regionTableTags.tableLabeling.tableName}: ${this.props.selectedTag.name}`}</span>
                </h5>
                { (this.props.selectedTag.type === FieldType.Object && this.props.selectedTag.fields && this.props.selectedTag.definition.fields) || this.props.selectedTag.definition.fields ?
                    <div className="table-view-container">
                        <table className="viewed-table">
                            <tbody>
                                {this.getTableBody()}
                            </tbody>
                        </table>
                    </div>
                    :
                    <div>Missing fields. Please Reconfigure table.</div>
                }
                {this.props.selectedTag.type === FieldType.Array && <div className="add-row-button_container">
                    <PrimaryButton
                        theme={getPrimaryBlueTheme()}
                        className="add_button ml-6"
                        autoFocus={true}
                        onClick={this.addRow}
                    >
                        <FontIcon iconName="Add" className="mr-2" />
                        {strings.tags.regionTableTags.tableLabeling.buttons.addRow}
                    </PrimaryButton>
                </div>}
                <div className="buttons-container">
                    <PrimaryButton
                        className="button-done"
                        theme={getPrimaryGreenTheme()}
                        onClick={() => {
                            this.props.setTagInputMode(TagInputMode.Basic, null, null)
                        }}
                    >{strings.tags.regionTableTags.tableLabeling.buttons.done}
                    </PrimaryButton>
                    <DefaultButton
                        className="button-reconfigure"
                        theme={getPrimaryGreenTheme()}
                        onClick={() => { this.props.setTagInputMode(TagInputMode.ConfigureTable) }}
                    >{strings.tags.regionTableTags.tableLabeling.buttons.reconfigureTable}
                    </DefaultButton>
                </div>
            </div>
        )
    }

    public getTableBody = () => {
        const table = { rows: this.state.rows, columns: this.state.columns };
        const selectedTableTagBody = this.props.selectedTableTagBody;
        const isRowDynamic = this.props.selectedTag.type === FieldType.Array;

        let tableBody = null;
        if (table.rows && table.rows?.length !== 0 && table.columns.length !== 0) {
            tableBody = [];
            const rows = table[TableElements.rows];
            const columns = table[TableElements.columns];
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
                        tableRow.push(
                            <td
                                className={"table-cell"}
                                onClick={() => this.handleCellClick(i - 1, j - 1)} key={j}
                                onMouseEnter={() => this.handleTableCellMouseEnter(selectedTableTagBody[i - 1][j - 1])}
                                onMouseLeave={() => this.handleTableCellMouseLeave()}
                            >
                                {selectedTableTagBody[i - 1][j - 1]?.find((tableRegion) => tableRegion.value === "") && <FontIcon className="pr-1 pl-1" iconName="FieldNotChanged" />}
                                {selectedTableTagBody[i - 1][j - 1]?.map((tableRegion) => tableRegion.value).join(" ")}
                            </td>);
                    }
                }
                tableBody.push(<tr key={i}>{tableRow}</tr>);
            }
        }

        return tableBody
    }

    private addRow = () => {
        this.props.addRowToDynamicTable()
    };

    private handleCellClick = (iToChange: number, jToChange: number) => {
        this.props.handleTableCellClick(iToChange, jToChange)
    }
    private handleTableCellMouseEnter = (regions: IRegion[]) => {
        this.props.handleTableCellMouseEnter(regions)
    }
    private handleTableCellMouseLeave = () => {
        this.props.handleTableCellMouseLeave();
    }
}
