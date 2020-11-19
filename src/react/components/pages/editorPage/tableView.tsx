import * as React from "react";
import { ICustomizations, Customizer, ContextualMenu, IDragOptions, Modal, FontIcon } from "@fluentui/react";
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

    function getTableBody() {
        const table = props.tableToView;
        let tableBody = null;
        if (table !== null) {
            tableBody = [];
            const rows = table["rows"];
            // const columns = table["columns"];
            for (let i = 0; i < rows; i++) {
                const tableRow = [];
                tableBody.push(<tr key={i}>{tableRow}</tr>);
            }
            table["cells"].forEach((cell) => {
                const rowIndex = cell["rowIndex"];
                const columnIndex = cell["columnIndex"];
                const rowSpan = cell["rowSpan"];
                const colSpan = cell["columnSpan"];
                tableBody[rowIndex]["props"]["children"][columnIndex] =
                    <td key={columnIndex} colSpan={colSpan} rowSpan={rowSpan}>
                        {cell["text"]}
                    </td>;
            });
        }
        return tableBody;
    }

    return (
        <Customizer {...dark}>
            <Modal
                titleAriaId={"Table view"}
                isOpen={props.tableToView !== null}
                isModeless={false}
                isDarkOverlay={true}
                dragOptions={dragOptions}
                onDismiss={props.handleTableViewClose}
                scrollableContentClassName={"table-view-scrollable-content"}
            >
            <FontIcon
                className="close-modal"
                role="button"
                iconName="Cancel"
                onClick={props.handleTableViewClose}
                />
                <div className="table-view-container">
                    <table className="viewed-table">
                        <tbody>
                            {getTableBody()}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </Customizer>
    );
};
