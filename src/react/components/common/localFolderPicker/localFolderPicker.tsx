import React from "react";
import { LocalFileSystemProxy } from "../../../../providers/storage/localFileSystemProxy";
import { strings } from "../../../../common/strings";
import { TextField, PrimaryButton } from "@fluentui/react";
import { getPrimaryGreenTheme, getGreenWithWhiteBackgroundTheme } from "../../../../common/themes";

/**
 * Properties for Local Folder Picker
 * @member id - ID for HTML form control element
 * @member value - Initial value for picker
 * @member onChange - Function to call on change to selected value
 */
interface ILocalFolderPickerProps {
    id?: string;
    value: string;
    onChange: (value) => void;
}

/**
 * State for Local Folder Picker
 * @member value - Selected folder
 */
interface ILocalFolderPickerState {
    value: string;
}

/**
 * @name - Local Folder Picker
 * @description - Select folder from local file system
 */
export default class LocalFolderPicker extends React.Component<ILocalFolderPickerProps, ILocalFolderPickerState> {
    private localFileSystem: LocalFileSystemProxy;

    constructor(props, context) {
        super(props, context);

        this.state = {
            value: this.props.value || "",
        };

        this.localFileSystem = new LocalFileSystemProxy();
        this.selectLocalFolder = this.selectLocalFolder.bind(this);
    }

    public render() {
        const { value } = this.state;

        return (
            <div className="input-group">
                <TextField
                    className="mr-2 flex-textbox"
                    theme={getGreenWithWhiteBackgroundTheme()}
                    style={{cursor: "pointer"}}
                    onClick={this.selectLocalFolder}
                    readOnly={true}
                    value={value}
                />
                <PrimaryButton
                    className="keep-button-80px"
                    theme={getPrimaryGreenTheme()}
                    text={strings.connections.providers.local.browse}
                    autoFocus={true}
                    onClick={this.selectLocalFolder}
                />
            </div>
        );
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value,
            });
        }
    }

    private selectLocalFolder = async () => {
        const filePath = await this.localFileSystem.selectContainer();
        if (filePath) {
            this.setState({
                value: filePath,
            }, () => this.props.onChange(filePath));
        }
    }
}
