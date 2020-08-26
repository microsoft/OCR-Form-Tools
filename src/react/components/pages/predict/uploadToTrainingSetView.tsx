import { Customizer, ICustomizations, Label, Modal, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import React from 'react';
import { getDarkGreyTheme, getPrimaryGreenTheme, getPrimaryGreyTheme } from '../../../../common/themes';
import './uploadToTrainingSetView.scss';
import { strings } from "../../../../common/strings";
interface IUploadToTrainingSetViewProp {
    onConfirm?: () => Promise<void>;
}
interface IUploadToTrainingSetViewState {
    hideModal: boolean;
    isLoading: boolean;
}
export class UploadToTrainingSetView extends React.Component<IUploadToTrainingSetViewProp, IUploadToTrainingSetViewState>{
    constructor(props) {
        super(props);
        this.state = {
            hideModal: true,
            isLoading: false,
        };
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
    }
    open() {
        this.setState({ hideModal: false });
    }
    close() {
        this.setState({ hideModal: true });
    }
    async onConfirm() {
        this.setState({
            isLoading: true
        });
        if (this.props.onConfirm) {
            await this.props.onConfirm();
        }
        this.setState({
            isLoading: false,
        });
        this.close();
    }
    render() {
        const dark: ICustomizations = {
            settings: {
                theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };
        return (
            <>
                <Customizer {...dark}>
                    <Modal
                        isOpen={!this.state.hideModal}
                        isModeless={false}
                        containerClassName="modal-container upload-to-training-set-modal"
                        scrollableContentClassName="scrollable-content"
                    >
                        <h4>Notice: <small>{strings.predict.editAndUploadToTrainingSetNotify}</small></h4>
                        <div className="modal-buttons-container mt-4">
                            {this.state.isLoading ?
                                <div>
                                    <Stack horizontal>
                                        <Label>Uploading</Label>
                                        <Spinner></Spinner>
                                    </Stack>
                                </div> :
                                <div>
                                    <PrimaryButton
                                        className="mr-3"
                                        text={strings.predict.editAndUploadToTrainingSet}
                                        theme={getPrimaryGreenTheme()}
                                        onClick={this.onConfirm}
                                    />
                                    <PrimaryButton
                                        className="modal-cancel"
                                        theme={getPrimaryGreyTheme()}
                                        onClick={this.close}
                                        text="Cancel" />
                                </div>
                            }
                        </div>
                    </Modal>
                </Customizer>
            </>
        )
    }
}
