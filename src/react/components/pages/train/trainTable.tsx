// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export interface ITrainTableProps {
    trainMessage: string;
    accuracies: object;
}

export interface ITrainTableState {}

export default class TrainTable
    extends React.Component<ITrainTableProps, ITrainTableState> {

    public render() {
        return (
            <div className="train-accuracy-table-container">
                {!this.props.accuracies && <table className="accuracy-table">
                    <tbody>
                        <tr>
                            <th> Train message </th>
                            <td> {this.props.trainMessage} </td>
                        </tr>
                    </tbody>
                </table>}
                {this.props.accuracies &&
                    <table className="accuracy-table table-sm">
                        <tbody>
                            <tr>
                                <th className="tag-name">
                                    Tag
                                </th>
                                <th className="text-right">
                                    Estimated Accuracy
                                </th>
                            </tr>
                            {
                                Object.entries(this.props.accuracies).map((entry) =>
                                    <tr key={entry[0]}>
                                        <td className="tag-name">{entry[0]}</td>
                                        <td className="text-right">{(entry[1] * 100).toFixed(2) + "%"}</td>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                }
            </div>
        );
    }
}
