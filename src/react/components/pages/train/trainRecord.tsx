import React from "react";

export interface ITrainRecordProps {
    accuracies?: object,
    averageAccuracy: number,
    modelInfo: {
        modelId: string,
        createdDateTime: string,
    },
};
export interface ITrainRecordState {};

export default class TrainRecord extends React.Component<ITrainRecordProps, ITrainRecordState> {
    public render() {
        return (
            <aside className="mt-3">
                <h5> Model Info </h5>
                <div>
                    <h6> Model ID </h6>
                    <p>
                        {this.props.modelInfo.modelId}
                    </p>
                    <h6> Created Date Time</h6>
                    <p>
                        {new Date(this.props.modelInfo.createdDateTime).toLocaleString()}
                    </p>
                    <h6> Average Accuracy </h6>
                    <p>
                        {(this.props.averageAccuracy*100).toFixed(2) + '%'}
                    </p>
                    <div className="accuracy-info">
                        <a href="https://aka.ms/form-recognizer/docs/train" target="_blank">
                            <i className={`fas fa-info-circle`}/><span>Learn more about improving model accuracy.</span>
                        </a>
                    </div>
                </div>
            </aside>
        );
    }
}