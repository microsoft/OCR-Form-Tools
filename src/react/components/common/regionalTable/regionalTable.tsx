import React from "react";

export interface IRegionalTableState { }

export interface IRegionalTableProps {
    regionalTableToView?: any;
    tableTagColor: string;
    onMouseEnter: (rowName: string, columnName: string) => void;
    onMouseLeave: () => void;
}

export default class RegionalTable extends React.Component<IRegionalTableProps, IRegionalTableState> {
    makeOnMouseEnter = (rowName, columnName) => () => {
        this.props.onMouseEnter(rowName, columnName);
    }

    onMouseLeave = () => {
        this.props.onMouseLeave();
    }

    private displayRegionalTable = (regionalTableToView) => {
        const tableBody = [];
        if (regionalTableToView?.type === "array") {
            const columnHeaderRow = [];
            const colKeys = Object.keys(regionalTableToView?.valueArray?.[0]?.valueObject || {});
            if (colKeys.length === 0) {
                return (
                    <div>
                        <h5 className="mb-4 ml-2 mt-2 pb-1">
                            <span style={{ borderBottom: `4px solid ${this.props.tableTagColor}` }}>Table name: {regionalTableToView.fieldName}</span>
                        </h5>
                        <div className="table-view-container">
                            <table>
                                <tbody>
                                    Empty table
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            for (let i = 0; i < colKeys.length + 1; i++) {
                if (i === 0) {
                    columnHeaderRow.push(
                        <th key={i} className={"empty_header hidden"} />
                    );
                } else {
                    columnHeaderRow.push(
                        <th key={i} className={"column_header"}>
                            {colKeys[i - 1]}
                        </th>
                    );
                }
            }
            tableBody.push(<tr key={0}>{columnHeaderRow}</tr>);
            regionalTableToView?.valueArray?.forEach((row, rowIndex) => {
                const rowName = `#${rowIndex}`;
                const tableRow = [];
                tableRow.push(
                    <th key={0} className={"row_header hidden"}>
                        {rowName}
                    </th>
                );
                Object.keys(row?.valueObject).forEach((columnName, columnIndex) => {
                    const tableCell = row?.valueObject?.[columnName];
                    tableRow.push(
                        <td
                            className={"table-cell"}
                            key={columnIndex + 1}
                            onMouseEnter={this.makeOnMouseEnter(rowName, columnName)}
                            onMouseLeave={this.onMouseLeave}
                        >
                            {tableCell ? tableCell.text : null}
                        </td>
                    );
                })
                tableBody.push(<tr key={(rowIndex + 1)}>{tableRow}</tr>);
            })
        } else {
            const columnHeaderRow = [];
            const colKeys = this.getColumnNames(regionalTableToView);
            if (colKeys.length === 0) {
                return (
                    <div>
                        <h5 className="mb-4 ml-2 mt-2 pb-1">
                            <span style={{ borderBottom: `4px solid ${this.props.tableTagColor}` }}>Table name: {regionalTableToView.fieldName}</span>
                        </h5>
                        <div className="table-view-container">
                            <table>
                                <tbody>
                                    Empty table
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            for (let i = 0; i < colKeys.length + 1; i++) {
                if (i === 0) {
                    columnHeaderRow.push(
                        <th key={i} className={"empty_header hidden"} />
                    );
                } else {
                    columnHeaderRow.push(
                        <th key={i} className={"column_header"}>
                            {colKeys[i - 1]}
                        </th>
                    );
                }
            }
            tableBody.push(<tr key={0}>{columnHeaderRow}</tr>);
            Object.keys(regionalTableToView?.valueObject).forEach((rowName, index) => {
                const tableRow = [];
                tableRow.push(
                    <th key={0} className={"row_header"}>
                        {rowName}
                    </th>
                );
                if (regionalTableToView?.valueObject?.[rowName]) {
                    Object.keys(regionalTableToView?.valueObject?.[rowName]?.valueObject)?.forEach((columnName, index) => {
                        const tableCell = regionalTableToView?.valueObject?.[rowName]?.valueObject?.[columnName];
                        tableRow.push(
                            <td
                                className={"table-cell"}
                                key={index + 1}
                                onMouseEnter={() => {
                                    this.setState({ highlightedTableCellRowKey: rowName, highlightedTableCellColumnKey: columnName })
                                }}
                                onMouseLeave={() => {
                                    this.setState({ highlightedTableCellRowKey: null, highlightedTableCellColumnKey: null })
                                }}
                            >
                                {tableCell ? tableCell.text : null}
                            </td>
                        );
                    });
                } else {
                    colKeys.forEach((columnName, index) => {
                        tableRow.push(
                            <td
                                className={"table-cell"}
                                key={index + 1}
                            >
                                {null}
                            </td>
                        );
                    })
                }
                tableBody.push(<tr key={index + 1}>{tableRow}</tr>);
            });
        }

        return (
            <div>
                <h5 className="mb-4 ml-2 mt-2 pb-1">
                    <span style={{ borderBottom: `4px solid ${this.props.tableTagColor}` }}>Table name: {regionalTableToView.fieldName}</span>
                </h5>
                <div className="table-view-container">
                    <table>
                        <tbody>
                            {tableBody}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    private getColumnNames = (table) => {
        const rows = Object.values(table?.valueObject || {});
        const firstNonNullRow = rows.find(r => r != null) as any;
        return Object.keys(firstNonNullRow?.valueObject || {});
    }

    render() {
        return (
            <>
                {this.displayRegionalTable(this.props.regionalTableToView)}
            </>
        );
    }
}
