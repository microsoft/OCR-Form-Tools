// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import TrainRecord, { ITrainRecordProps } from "./trainRecord";
import { getPrimaryGreyTheme } from "../../../../common/themes";
import { PrimaryButton } from "office-ui-fabric-react";

export interface ITrainPanelProps {
    currTrainRecord: ITrainRecordProps;
    updateViewTypeCallback: (viewType: "tableView" | "chartView") => void;
    viewType: "chartView" | "tableView";
}

export interface ITrainPanelState {}

export default class TrainPanel
    extends React.Component<ITrainPanelProps, ITrainPanelState> {

    public render() {
        const currTrainRecord = this.props.currTrainRecord;

        return (
            <div className="m-3">
            <h4> Training record </h4>
            <PrimaryButton
                theme={getPrimaryGreyTheme()}
                className="mt-3 d-none">
                <i className="ms-Icon ms-Icon--Download mr-2"></i>
                Download model zip
            </PrimaryButton>
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
        );
    }
}
