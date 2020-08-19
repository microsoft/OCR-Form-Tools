import React from 'react';
import { getSasFolderString } from "../../../common/utils";
import { IProject, IAppSettings, ISecurityToken, IApplicationState } from "../../../models/applicationState";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { IconButton, Customizer, ICustomizations } from "@fluentui/react";
import { strings } from "../../../common/strings";
import { getDarkGreyTheme } from "../../../common/themes";
import "./shareProjectButton.scss"


interface IShareProps {
    appSettings?: IAppSettings,
    currentProject?: IProject;
}
interface IShareState {
    appSettings: IAppSettings,
    currentProject: IProject;
}

function mapStateToProps(state: IApplicationState) {
    return {
        appSettings: state.appSettings,
        currentProject: state.currentProject,
    };
}

const dark: ICustomizations = {
    settings: {
      theme: getDarkGreyTheme(),
    },
    scopedSettings: {},
};

@connect(mapStateToProps)
export default class ShareProjectButton extends React.Component<IShareProps> {

    // creates string for sharing project
    private shareProject = (): void => {
        const currentProject: IProject = this.props.currentProject;
        const sasFolder: string = getSasFolderString(currentProject.sourceConnection.providerOptions["sas"]);
        const projectToken: ISecurityToken = this.props.appSettings.securityTokens
            .find((securityToken: { name: string; }) => securityToken.name === currentProject.securityToken);
        const shareProjectString: string = JSON.stringify({
            sasFolder,
            projectName: currentProject.name,
            token: { name: currentProject.securityToken, key: projectToken.key }
        });

        this.copyToClipboard(shareProjectString)
    }

    private async copyToClipboard(value: string) {
        const clipboard = (navigator as any).clipboard;
        if (clipboard && clipboard.writeText) {
            await clipboard.writeText(btoa(value));
            toast.success(strings.shareProject.copy.success);
        }
    }

    render() {
        return (
            <Customizer {...dark}>
                <IconButton
                    className="project-share-button"
                    ariaLabel={strings.shareProject.name}
                    iconProps={{ iconName: "Share" }}
                    disabled={this.props.currentProject && this.props.currentProject.sourceConnection.providerType === "azureBlobStorage"  ? false : true}
                    title={strings.shareProject.name}
                    onClick={this.shareProject}
                />
            </Customizer>
        )
    }
}
