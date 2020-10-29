import {Customizer, ICustomizations, IModalStyles, Modal, PrimaryButton, Slider} from "@fluentui/react";
import React from "react";
import {ModalBody} from "reactstrap";
import {constants} from "../../../../common/constants";
import {getDarkGreyTheme, getPrimaryGreenTheme, getPrimaryGreyTheme} from "../../../../common/themes";

interface IBatchSizeModalProps {
    onConfirm?: (batchSize: number) => void;
}

interface IBatchSizeModalState {
    showModal: boolean;
    batchSize: number;
}

export class BatchSizeModal extends React.Component<IBatchSizeModalProps, IBatchSizeModalState>{
    state = {
        showModal: false,
        batchSize: 3
    };

    onConfirm = () => {
        this.setState({showModal: false});
        if (this.props.onConfirm) {
            this.props.onConfirm(this.state.batchSize);
        }
    }
    onCancel = () => {
        this.setState({showModal: false});
    }

    onBatchSizeChange = (value: number) => {
        this.setState({
            batchSize: value
        });
    }

    openModal() {
        this.setState({
            batchSize: constants.autoLabelBatchSizeMin,
            showModal: true,
        });
    }

    render() {
        const dark: ICustomizations = {
            settings: {
                theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };
        const styles: Partial<IModalStyles> = {
            main: {
                width: "400px!important",
            }
        };
        return (
            <Customizer {...dark}>
                <Modal
                    isOpen={this.state.showModal}
                    isModeless={false}
                    containerClassName="modal-container"
                    styles={styles}
                >
                    <h4>Set Auto Labeling Batch Size</h4>
                    <ModalBody>
                        <Slider value={this.state.batchSize}
                            min={constants.autoLabelBatchSizeMin}
                            max={constants.autoLabelBatchSizeMax}
                            onChange={this.onBatchSizeChange} />
                    </ModalBody>
                    <div className="modal-buttons-container">
                        <PrimaryButton
                            className="model-confirm"
                            theme={getPrimaryGreenTheme()}
                            onClick={this.onConfirm}>
                            Ok
                        </PrimaryButton>
                        <PrimaryButton
                            className="modal-cancel"
                            theme={getPrimaryGreyTheme()}
                            onClick={this.onCancel}
                        >Cancel</PrimaryButton>
                    </div>
                </Modal>
            </Customizer>
        );
    }
}