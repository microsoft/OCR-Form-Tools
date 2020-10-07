import React from 'react';
import { toast } from "react-toastify";
import "./tableTagConfig.scss";
import { IconButton, Customizer, ICustomizations, ChoiceGroup, IChoiceGroupOption, PrimaryButton, DetailsList, IColumn, TextField, Dropdown, IDropdownOption, SelectionMode, DetailsListLayoutMode, FontIcon, ThemeSettingName, DefaultButton } from "@fluentui/react";
import { getPrimaryGreyTheme, getPrimaryGreenTheme, getRightPaneDefaultButtonTheme, getGreenWithWhiteBackgroundTheme, getPrimaryBlueTheme } from '../../../../common/themes';
import { FieldFormat, FieldType, TagInputMode, ITag, IRegion, ITableTag, ITableRegion } from '../../../../models/applicationState';
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
}

// @connect(mapStateToProps)
export default class TableTagLabeling extends React.Component<ITableTagLabelingProps> {
    public state: ITableTagLabelingState = {
        selectedRowIndex: null,
        selectedColumnIndex: null,
        containerWidth: this.props.splitPaneWidth
    };

    public componentDidMount = async () => {
        console.log(this.props)
        console.log("TableTagLabeling -> publiccomponentDidMount -> this.props", this.props)

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
        // console.log(this.props.selectedTableTagBody)

        return (
            <Customizer {...dark}>
                <div className="table-labeling_container" style={{width: this.props.splitPaneWidth}}>
                    <h4 className="mt-2  ml-4">{strings.tags.regionTableTags.tableLabeling.title}</h4>
                    <div className="labeling-guideline">
                        To start labeling your table:
                        <ol>
                            <li>Select the words on the document you want to label</li>
                            <li>Click the table cell you want to label selected words to</li>
                        </ol>
                    </div>
                    <div className="table-view-container">
                        <h5 className="mb-4 table-name">
                            <span  style={{borderBottom: `4px solid ${this.props.selectedTag.color}`}}>Table name: {this.props.selectedTag.name}</span>
                        </h5>
                        <table className="viewed-table">
                            <tbody>
                                {this.getTableBody()}
                            </tbody>
                        </table>
                    </div>
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

    public getTableBody = () => {
        const table = { rows: this.props.selectedTag.rowKeys, columns: this.props.selectedTag.columnKeys };
        const isFixedTable = this.props.selectedTag.format === FieldFormat.Fixed;

        let tableBody = null;
        if (table.rows.length !== 0 && table.columns.length !== 0) {
            tableBody = [];
            const rows = table["rows"];
            const columns = table["columns"];
            for (let i = 0; i < rows.length+1; i++) {
                const tableRow = [];
                for (let j = 0; j < columns.length+1; j++) {
                    if (i === 0 && j !== 0) {
                        tableRow.push(<th key={j} className={"column_header"}>{columns[j-1].fieldKey}</th>);
                    } else if (j === 0 && i !== 0) {
                        if (isFixedTable) {
                            tableRow.push(<th key={j} className={"row_header"}>{rows[i - 1].fieldKey}</th>);
                        }
                    } else if (j === 0 && i === 0) {
                        if (isFixedTable) {
                            tableRow.push(<th key={j} className={"empty_header"} />);
                        }
                    } else {
                            tableRow.push(
                                <td className={"table-cell"} onClick={() => this.handleCellClick(i - 1, j - 1)} key={j}>
                                    {this.props.selectedTableTagBody[i - 1][j - 1]?.map((tableRegion) => tableRegion.value).join(" ")}
                                </td>);
                    }
                }
                tableBody.push(<tr key={i}>{tableRow}</tr>);
            }
        }
        return tableBody
    }

    private handleCellClick = (iToChange, jToChange) => {
        // const tableBody = clone()(this.props.tableBody);
        // tableBody[iToChange].props.children[jToChange] = this.props.selectedRegions.map((region) => region.value).join(" ")};
        this.props.handleTableCellClick(iToChange, jToChange)
    }
}
