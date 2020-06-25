// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { FontIcon, PrimaryButton } from "@fluentui/react";
import TrainRecord, { ITrainRecordProps } from "./trainRecord";
import { getPrimaryGreyTheme } from "../../../../common/themes";

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
                <FontIcon iconName="Download" className="mr-2" />
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
