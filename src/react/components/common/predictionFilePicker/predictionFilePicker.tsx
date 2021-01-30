import { Dropdown, IDropdownOption, PrimaryButton, TextField } from '@fluentui/react';
import React from 'react';
import HtmlFileReader from '../../../../common/htmlFileReader';
import { strings } from '../../../../common/strings';
import { getGreenWithWhiteBackgroundTheme, getPrimaryGreenTheme } from '../../../../common/themes';
import "./predictionFilePicker.scss";

interface IPredictionFile {
    file: File;
    fileLabel: string;
    fetchedFileURL: string;
}

interface IPredictionFilePickerProps {
    disabled: boolean;
    onFileChange?: (file: IPredictionFile) => void;
    onError?: (err: { alertTitle: string, alertMessage: string }) => void;
    onSelectSourceChange?: () => void;
}

interface IPredictionFilePickerState {
    sourceOption: string;
    inputedLocalFileName: string;
    inputedFileURL: string;
    isFetching: boolean;
}

export class PredictionFilePicker extends React.Component<IPredictionFilePickerProps, IPredictionFilePickerState>{
    state = {
        sourceOption: "localFile",
        inputedLocalFileName: strings.predict.defaultLocalFileInput,
        inputedFileURL: "",
        isFetching: false,
    };

    private filePicker: React.RefObject<HTMLInputElement> = React.createRef();

    render() {
        const sourceOptions: IDropdownOption[] = [
            { key: "localFile", text: strings.documentFilePicker.localFile },
            { key: "url", text: strings.documentFilePicker.url },
        ];

        let { disabled } = this.props;
        disabled = !!disabled;
        const urlInputDisabled = disabled || this.state.isFetching;
        const fetchDisabled: boolean =
            disabled ||
            this.state.isFetching ||
            this.state.inputedFileURL.length === 0 ||
            this.state.inputedFileURL === strings.prebuiltPredict.defaultURLInput;

        return <>
            <div className="prediction-file-picker">
                <div className="title mr-2">Prediction:</div>
                <div className="container-space-between">
                    <Dropdown
                        className="source-dropdown"
                        selectedKey={this.state.sourceOption}
                        options={sourceOptions}
                        disabled={disabled}
                        onChange={this.onSelectSourceChange}
                    />
                    {this.state.sourceOption === "localFile" &&
                        <>
                            <input ref={this.filePicker}
                                aria-hidden="true"
                                type="file"
                                accept="application/json"
                                disabled={disabled}
                                onChange={this.handleInputFileChange}
                            />
                            <TextField
                                className="ml-2 local-file"
                                theme={getGreenWithWhiteBackgroundTheme()}
                                style={{ cursor: (disabled ? "default" : "pointer") }}
                                onClick={this.handleInputFileClick}
                                readOnly={true}
                                aria-label={strings.prebuiltPredict.defaultLocalFileInput}
                                value={this.state.inputedLocalFileName}
                                placeholder={strings.predict.defaultLocalFileInput}
                                disabled={disabled}
                            />
                        </>
                    }
                    {this.state.sourceOption === "url" &&
                        <>
                            <TextField
                                className="mr-2 ml-2"
                                theme={getGreenWithWhiteBackgroundTheme()}
                                onFocus={this.removeDefaultInputedFileURL}
                                onChange={this.setInputedFileURL}
                                aria-label={strings.prebuiltPredict.defaultLocalFileInput}
                                value={this.state.inputedFileURL}
                                disabled={urlInputDisabled}
                                placeholder={strings.predict.defaultURLInput}
                            />
                            <PrimaryButton
                                theme={getPrimaryGreenTheme()}
                                className="keep-button-80px"
                                text="Fetch"
                                allowDisabledFocus
                                disabled={fetchDisabled}
                                autoFocus={true}
                                onClick={this.getFileFromURL}
                            />
                        </>
                    }
                </div>
            </div>
        </>
    }

    private onSelectSourceChange = (event, option) => {
        if (option.key !== this.state.sourceOption) {
            this.setState({
                sourceOption: option.key,
                inputedFileURL: ""
            }, () => {
                if (this.props.onSelectSourceChange) {
                    this.props.onSelectSourceChange();
                }
            });
        }
    }

    private handleInputFileChange = async () => {
        const { current } = this.filePicker;
        if (!current.value) {
            return;
        }

        const fileName = current.value.split("\\").pop();
        if (!fileName) {
            return;
        }

        try {
            const fileInfo = await HtmlFileReader.readAsText(current.files[0]);
            if (!this.isValidSchema(JSON.parse(fileInfo.content as string))) {
                // Throw error when invalid schema.
                throw new Error("The file is not a proper prediction result, please try other file.");
            }

            this.setState({
                inputedLocalFileName: fileName
            }, () => {
                if (this.props.onFileChange) {
                    this.props.onFileChange({
                        file: current.files[0],
                        fileLabel: fileName,
                        fetchedFileURL: "",
                    });
                }
            });
        } catch (err) {
            // Report error.
            if (this.props.onError) {
                this.props.onError({
                    alertTitle: "Load prediction file error",
                    alertMessage: err?.message ? err.message : err,
                });
            }

            // Reset file input.
            this.setState({ inputedLocalFileName: "" });
        }
    }

    private handleInputFileClick = () => {
        this.filePicker.current?.click();
    }

    private removeDefaultInputedFileURL = () => {
        if (this.state.inputedFileURL === strings.prebuiltPredict.defaultURLInput) {
            this.setState({ inputedFileURL: "" });
        }
    }

    private setInputedFileURL = (event) => {
        this.setState({ inputedFileURL: event.target.value });
    }

    private getFileFromURL = async () => {
        this.setState({ isFetching: true });

        try {
            const response = await fetch(this.state.inputedFileURL, { headers: { Accept: "application/json" } });

            if (!response.ok) {
                throw new Error(response.status.toString() + " " + response.statusText);
            }

            const contentType = response.headers.get("Content-Type");
            if (!["application/json", "application/octet-stream"].includes(contentType)) {
                throw new Error("Content-Type " + contentType + " not supported.");
            }

            const blob = await response.blob();
            if (!this.isValidSchema(JSON.parse(await blob.text()))) {
                throw new Error("The file is not a proper prediction result, please try other file.");
            }

            const fileAsURL = new URL(this.state.inputedFileURL);
            const fileName = fileAsURL.pathname.split("/").pop();
            const file = new File([blob], fileName, { type: contentType });
            this.setState({
                isFetching: false,
            }, () => {
                if (this.props.onFileChange) {
                    this.props.onFileChange({
                        file,
                        fileLabel: fileName,
                        fetchedFileURL: ""
                    });
                }
            });
        } catch (err) {
            this.setState({ isFetching: false });
            if (this.props.onError) {
                this.props.onError({
                    alertTitle: "Fetch failed",
                    alertMessage: err?.message ? err.message : err,
                });
            }
        }
    }

    private isValidSchema = (jsonData) => {
        if (jsonData && jsonData.analyzeResult) {
            // We should ensure version and documentResults exists.
            const { version, documentResults } = jsonData.analyzeResult;
            return !!version && !!documentResults;
        }

        return false;
    }
}
