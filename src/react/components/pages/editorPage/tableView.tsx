import * as React from "react";
import { ICustomizations, Customizer, ContextualMenu, IDragOptions, Modal, FontIcon } from "@fluentui/react";
import { getDarkGreyTheme } from "../../../../common/themes";
import "./tableView.scss";
import { TooltipHost, TooltipDelay, DirectionalHint, ITooltipProps, ITooltipHostStyles } from "@fluentui/react";
import { useId } from '@uifabric/react-hooks';

function Tooltip({ children, content }) {
    const makeTooltipProps = (content: object): ITooltipProps => ({
        onRenderContent: () => (
            <ul style={{ margin: 10, padding: 0 }}>
                {Object.keys(content).map((key, index) => content[key] ? <li key={index}>{`${key}: ${content[key]}`}</li> : null)}
            </ul>
        ),
    });
    const hostStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };
    const tooltipId = useId('tooltip');
    const tooltipProps = makeTooltipProps(content);
    return (
        <TooltipHost
            delay={TooltipDelay.zero}
            directionalHint={DirectionalHint.topCenter}
            id={tooltipId}
            tooltipProps={tooltipProps}
            styles={hostStyles}
        >
            {children}
        </TooltipHost>
    )
}

interface ITableViewProps {
    handleTableViewClose: () => any;
    tableToView: object;
    showToolTips?: boolean;
}

export const TableView: React.FunctionComponent<ITableViewProps> = ({ handleTableViewClose, tableToView, showToolTips = false }) => {
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
        const table = tableToView;
        let tableBody = null;
        if (table !== null) {
            tableBody = [];
            const rowCount = table["rows"];
            for (let i = 0; i < rowCount; i++) {
                const tableRow = [];
                tableBody.push(<tr key={i}>{tableRow}</tr>);
            }
            table["cells"].forEach(({ rowIndex, columnIndex, rowSpan, columnSpan, text, confidence, isHeader }) => {
                const content = { confidence: confidence || null };
                const hasContentValue = Object.values(content).reduce((hasValue, value) => value || hasValue, false);
                tableBody[rowIndex]["props"]["children"][columnIndex] = (
                    <td key={columnIndex} colSpan={columnSpan} rowSpan={rowSpan} className={ isHeader ? "table-header" : ""}>
                        {showToolTips && hasContentValue ? (
                            <Tooltip content={content}>
                                {text}
                            </Tooltip>
                        ) : (
                            <React.Fragment>{text}</React.Fragment>
                        )}
                    </td>
                )
            });
        }
        return tableBody;
    }
    return (
        <Customizer {...dark}>
            <Modal
                titleAriaId={"Table view"}
                isOpen={tableToView !== null}
                isModeless={false}
                isDarkOverlay={true}
                dragOptions={dragOptions}
                onDismiss={handleTableViewClose}
                scrollableContentClassName={"table-view-scrollable-content"}
            >
                <FontIcon
                    className="close-modal"
                    role="button"
                    iconName="Cancel"
                    onClick={handleTableViewClose}
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
