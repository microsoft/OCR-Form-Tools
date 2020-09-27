import { Customizer, ICustomizations, Modal, PrimaryButton, Spinner, SpinnerSize } from '@fluentui/react';
import React from 'react';
import { strings } from "../../../../common/strings";
import { getDarkGreyTheme, getDefaultDarkTheme, getPrimaryGreenTheme, getPrimaryGreyTheme } from '../../../../common/themes';
import './uploadToTrainingSetView.scss';

interface IUploadToTrainingSetViewProp {
    onConfirm?: () => Promise<void>;
    showOption: boolean;
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
            isLoading: !props.showOption,
        };
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
    }
    open() {
        this.setState({
            hideModal: false,
            isLoading: !this.props.showOption
        });
    }
    close() {
        this.setState({ hideModal: true });
    }
    async onConfirm() {
        this.setState({ isLoading: true });
        if (this.props.onConfirm) {
            await this.props.onConfirm();
        }
        this.close();
    }
    render() {
        const dark: ICustomizations = {
            settings: {
                theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };
        const notifyMessage = this.props.showOption ? strings.predict.editAndUploadToTrainingSetNotify : strings.predict.editAndUploadToTrainingSetNotify2;

        return (
            <>
                <Customizer {...dark}>
                    <Modal
                        isOpen={!this.state.hideModal}
                        isModeless={false}
                        containerClassName="modal-container upload-to-training-set-modal"
                        scrollableContentClassName="scrollable-content"
                    >
                        <h4>Notice: <small>{notifyMessage}</small></h4>
                        <div className="modal-buttons-container mt-4">
                            {this.state.isLoading ?
                                <div>
                                    <Spinner
                                        label={strings.predict.uploadInPrgoress}
                                        ariaLive="assertive"
                                        labelPosition="right"
                                        theme={getDefaultDarkTheme()}
                                        size={SpinnerSize.large} />
                                </div> :
                                <div>
                                    <PrimaryButton
                                        className="mr-3"
                                        text={strings.predict.editAndUploadToTrainingSet}
                                        theme={getPrimaryGreenTheme()}
                                        onClick={this.onConfirm} />
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
