import {DefaultButton, FontIcon, TextField} from '@fluentui/react';
import React from 'react';
import {getGreenWithWhiteBackgroundTheme, getPrimaryGreyTheme} from '../../../../common/themes';
import {IPrebuiltSettings} from '../../../../models/applicationState';
import IAppPrebuiltSettingsActions from '../../../../redux/actions/prebuiltSettingsActions';

interface IPrebuiltSettingProps {
    prebuiltSettings: IPrebuiltSettings;
    actions?: IAppPrebuiltSettingsActions;
    disabled: boolean;
}

interface IPrebuiltSettingState {
    showInputedAPIKey: boolean;
}

export class PrebuiltSetting extends React.Component<IPrebuiltSettingProps, IPrebuiltSettingState>{
    state = {
        showInputedAPIKey: false
    };

    render() {
        const {disabled} = this.props;
        return <>
            <div className="p-3" style={{marginTop: "8px"}}>
                <h5>Service configuration</h5>
                <div style={{marginBottom: "3px"}}>Form recognizer service endpoint</div>
                <TextField
                    className="mb-1"
                    theme={getGreenWithWhiteBackgroundTheme()}
                    value={this.props.prebuiltSettings?.serviceURI}
                    onChange={this.setInputedServiceURI}
                    disabled={disabled}
                />
                <div style={{marginBottom: "3px"}}>API key</div>
                <div className="apikeyContainer">
                    <TextField
                        className="apikey"
                        theme={getGreenWithWhiteBackgroundTheme()}
                        type={this.state.showInputedAPIKey ? "text" : "password"}
                        value={this.props.prebuiltSettings?.apiKey}
                        onChange={this.setInputedAPIKey}
                        disabled={disabled}
                    />
                    <DefaultButton
                        className="portected-input-margin"
                        theme={getPrimaryGreyTheme()}
                        title={this.state.showInputedAPIKey ? "Hide" : "Show"}
                        disabled={disabled}
                        onClick={this.toggleAPIKeyVisibility}
                    >
                        <FontIcon iconName={this.state.showInputedAPIKey ? "Hide3" : "View"} />
                    </DefaultButton>
                    <DefaultButton
                        theme={getPrimaryGreyTheme()}
                        type="button"
                        title="Copy"
                        disabled={disabled}
                        onClick={() => this.copyKey()}
                    >
                        <FontIcon iconName="Copy" />
                    </DefaultButton>
                </div>
            </div>

        </>
    }

    private setInputedServiceURI = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        // this.setState({inputedServiceURI: event.target.value});
        this.props.actions.update({...this.props.prebuiltSettings, serviceURI: newValue});
    }

    private setInputedAPIKey = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        this.props.actions.update({...this.props.prebuiltSettings, apiKey: newValue});
    }
    private toggleAPIKeyVisibility = () => {
        this.setState({
            showInputedAPIKey: !this.state.showInputedAPIKey,
        });
    }

    private async copyKey() {
        const clipboard = (navigator as any).clipboard;
        if (clipboard && clipboard.writeText && typeof clipboard.writeText === "function") {
            await clipboard.writeText(this.props.prebuiltSettings.apiKey);
        }
    }
}