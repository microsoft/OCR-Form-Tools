import * as React from "react";
import { ICustomizations, Customizer, ContextualMenu, IDragOptions, Modal, IconButton, IIconProps, FontIcon } from "office-ui-fabric-react";
import { getDarkGreyTheme } from "../../../../common/themes";
import "./tableView.scss";

interface ITableViewProps {
    handleTableViewClose: () => any;
    tableToView: object;
}

export const TableView: React.FunctionComponent<ITableViewProps> = (props) => {
    const dark: ICustomizations = {
        settings: {
            theme: getDarkGreyTheme(),
        },
        scopedSettings: {},
    };

    const dragOptions: IDragOptions = {
        moveMenuItemText: "Move",
        closeMenuItemText: "Close",
        menu: ContextualMenu,
      };

    const table = props.tableToView;
    let tableBody = null;
    if (table !== null) {
        tableBody = [];
        const rows = table["rows"];
        const columns = table["columns"];
        for (let i = 0; i < rows; i++) {
            const tableRow = [];
            for (let j = 0; j < columns; j++) {
                tableRow.push(<td key={j}></td>);
            }
            tableBody.push(<tr key={i}>{tableRow}</tr>);
        }
        table["cells"].forEach((cell) => {
            const rowIndex = cell["rowIndex"];
            const columnIndex = cell["columnIndex"];
            tableBody[rowIndex]["props"]["children"][columnIndex] = <td key={columnIndex}>{cell["text"]}</td>;
        });
    }

    return (
        <Customizer {...dark}>
            <Modal
                titleAriaId={""}
                isOpen={props.tableToView !== null}
                isModeless={true}
                dragOptions={dragOptions}
            >
            <FontIcon
                className="close-modal"
                role="button"
                iconName="Cancel"
                onClick={props.handleTableViewClose}
            />
            <table>
                <tbody className="viewed-table">
                    {tableBody}
                </tbody>
            </table>
            </Modal>
        </Customizer>
    );
};