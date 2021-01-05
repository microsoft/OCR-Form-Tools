import {DefaultButton, FontIcon, TextField, TooltipHost} from '@fluentui/react';
import React from 'react';
import {strings} from '../../../../common/strings';
import {getGreenWithWhiteBackgroundTheme, getPrimaryGreyTheme} from '../../../../common/themes';
import {IPrebuiltSettings} from '../../../../models/applicationState';
import IAppPrebuiltSettingsActions from '../../../../redux/actions/prebuiltSettingsActions';
import "./prebuiltSetting.scss";

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
            <div className="p-3 prebuilt-setting" style={{marginTop: "-2rem"}}>

                <div style={{marginBottom: "3px"}}>{strings.prebuiltSetting.serviceEndpointTitle}</div>
                <TooltipHost
                    content={strings.prebuiltSetting.endpointTooltip}>
                    <TextField
                        className="mb-1"
                        name="endpointUrl"
                        placeholder={strings.prebuiltSetting.endpointPlaceholder}
                        theme={getGreenWithWhiteBackgroundTheme()}
                        value={this.props.prebuiltSettings?.serviceURI}
                        onChange={this.setInputedServiceURI}
                        disabled={disabled}
                    />
                </TooltipHost>
                <div style={{marginBottom: "3px"}}>{strings.prebuiltSetting.apiKeyTitle}</div>
                <div className="apikeyContainer">
                    <TooltipHost
                        content={strings.prebuiltSetting.apiKeyTooltip}>
                        <TextField
                            className="apikey"
                            name="apikey"
                            placeholder={strings.prebuiltSetting.apiKeyPlaceholder}
                            theme={getGreenWithWhiteBackgroundTheme()}
                            type={this.state.showInputedAPIKey ? "text" : "password"}
                            value={this.props.prebuiltSettings?.apiKey}
                            onChange={this.setInputedAPIKey}
                            disabled={disabled}
                        />
                    </TooltipHost>
                    <DefaultButton
                        className="portected-input-margin"
                        theme={getPrimaryGreyTheme()}
                        title={this.state.showInputedAPIKey ? "Hide" : "Show"}
                        disabled={disabled}
                        onClick={this.toggleAPIKeyVisibility}
                    >
                        <FontIcon iconName={this.state.showInputedAPIKey ? "Hide3" : "View"} />
                    </DefaultButton>
                </div>
            </div>
        </>
    }

    private setInputedServiceURI = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
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
