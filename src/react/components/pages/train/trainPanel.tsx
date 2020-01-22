import React from "react";
import TrainRecord, { ITrainRecordProps } from "./trainRecord";

export interface ITrainPanelProps {
    currTrainRecord: ITrainRecordProps,
    updateViewTypeCallback: (viewType: "tableView" | "chartView") => void;
    viewType: "chartView" | "tableView";
};

export interface ITrainPanelState {};

export default class TrainPanel
    extends React.Component<ITrainPanelProps, ITrainPanelState> {

    public render() {
        const currTrainRecord = this.props.currTrainRecord;

        return (
            <div className="m-3">
            <h4> Training record </h4>

            <button className="btn btn-primary mt-3 d-none">
                <i className="fas fa-download"></i>
                <h6 className="d-inline ml-2">Download Model ZIP</h6>
            </button>

            {currTrainRecord &&
                <TrainRecord
                    averageAccuracy={currTrainRecord.averageAccuracy}
                    modelInfo={currTrainRecord.modelInfo} />
            }
        </div>
        );
    }

    private renderButton = (vt: "tableView" | "chartView", faClass: string) => {
        const active: boolean = this.props.viewType === vt;

        return (
                <button
                className={"btn btn-light " + (active ? "active" : "")}
                aria-pressed={active}
                onClick={() => this.props.updateViewTypeCallback(vt)}>
                    <i className={"fas " + faClass}></i>
                </button>
        )
    }
}