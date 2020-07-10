// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { toast } from "react-toastify";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, InputGroup, Input } from "reactstrap";
import { strings, interpolate } from "../../../../common/strings";
import { IConnection, StorageType, ErrorCode, AppError } from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import CondensedList, { ListItem } from "../condensedList/condensedList";
import "./cloudFilePicker.scss"
import { Separator } from "@fluentui/react";

/**
 * Properties for Cloud File Picker
 * @member connections - Array of connections to choose from
 * @member onSubmit - Function to call with contents of selected file
 * @member onCancel - Optional function to call on modal closed
 * @member fileExtension - Filter on files with extension
 */
export interface ICloudFilePickerProps {
    connections: IConnection[];
    onSubmit: (content: string, token?: {}) => void;

    onCancel?: () => void;
    fileExtension?: string;
}

/**
 * State for Cloud File Picker
 * @member isOpen - Cloud File Picker is open
 * @member modalHeader - Header for Picker modal
 * @member condensedList - List of rendered objects for picking
 * @member selectedConnection - Connection selected in picker
 * @member selectedFile - File selected in picker
 * @member okDisabled - Ok button is disabled
 * @member backDisabled - Back button is disabled
 */
export interface ICloudFilePickerState {
    isOpen: boolean;
    modalHeader: string;
    condensedList: any;
    selectedConnection: IConnection;
    selectedFile: string;
    okDisabled: boolean;
    backDisabled: boolean;
    pastedUri: string,
    pasting: boolean,
}

/**
 * @name - Cloud File Picker
 * @description - Modal to choose and read file from cloud connections
 */
export class CloudFilePicker extends React.Component<ICloudFilePickerProps, ICloudFilePickerState> {

    constructor(props: Readonly<ICloudFilePickerProps>) {
        super(props);

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);

        this.getInitialState = this.getInitialState.bind(this);
        this.ok = this.ok.bind(this);
        this.back = this.back.bind(this);
        this.connectionList = this.connectionList.bind(this);
        this.onClickConnection = this.onClickConnection.bind(this);
        this.fileList = this.fileList.bind(this);
        this.onClickFile = this.onClickFile.bind(this);
        this.handleChangeUri= this.handleChangeUri.bind(this);
        this.handlePasteUri= this.handlePasteUri.bind(this);

        this.state = this.getInitialState();
    }

    public render() {
        const closeBtn = <button className="close" onClick={this.close}>&times;</button>;

        return (
            <Modal isOpen={this.state.isOpen} centered={true}>
                <ModalHeader toggle={this.close} close={closeBtn}>
                    {this.state.modalHeader}
                </ModalHeader>
                <div className={`shared-string-input-container ${this.state.selectedConnection ? "hide" : ""}`}>
                    <div className="condensed-list-header bg-darker-2 shared-uri-header">
                        Shared Project URI
                </div>
                    {!this.props.connections.length &&
                        <div className="p-3 text-center">{strings.shareProject.errors.noConnections}</div>
                    }
                    <InputGroup className="input-uri">
                        <Input placeholder={strings.homePage.openCloudProject.pasteSharedUri}
                            id="sharedURI"
                            type="text"
                            value={this.state.pastedUri}
                            onChange={this.handleChangeUri}
                            onPaste={this.handlePasteUri}
                            disabled={!this.props.connections.length}
                        />
                    </InputGroup>
                </div>
                {
                    (!this.state.selectedConnection && !this.state.pastedUri) && <Separator className="separator">or</Separator>
                }
                <ModalBody className={`${this.state.pastedUri ? "hide" : ""}`}>
                    {this.state.condensedList}
                </ModalBody>

                <ModalFooter>
                    {this.state.selectedFile || ""}
                    <Button
                        className="btn btn-success mr-1"
                        onClick={this.ok}
                        disabled={this.state.okDisabled}>
                        Ok
                    </Button>
                    {this.state.backDisabled && !this.state.pastedUri ?
                        <Button onClick={this.close}>Close</Button> :
                        <Button onClick={this.back}>Go Back</Button>
                    }
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Open Cloud File Picker
     */
    public open(): void {
        this.setState({isOpen: true});
    }

    /**
     * Close Cloud File Picker
     */
    public close(): void {
        this.setState(this.getInitialState(),
            () => {
                if (this.props.onCancel) {
                    this.props.onCancel();
                }
            },
        );
    }

    private getInitialState(): ICloudFilePickerState {
        return {
            isOpen: false,
            modalHeader: strings.homePage.openCloudProject.selectConnection,
            condensedList: this.connectionList(),
            selectedConnection: null,
            selectedFile: null,
            okDisabled: true,
            backDisabled: true,
            pastedUri: "",
            pasting: false,
        };
    }

    private async ok() {
        if (this.state.selectedConnection && this.state.selectedFile) {
            const storageProvider = StorageProviderFactory.createFromConnection(this.state.selectedConnection);
            const content = await storageProvider.readText(this.state.selectedFile);
            this.props.onSubmit(content);
        } else if (this.state.pastedUri && this.getSharedProjectConnectionInfo()) {
            const { connection, projectName, token } = this.getSharedProjectConnectionInfo()
            await this.readFile(connection, projectName);
            const storageProvider = StorageProviderFactory.createFromConnection(connection);
            const content = await storageProvider.readText(this.state.selectedFile);
            this.props.onSubmit(content, token);
        }
    }

    private getSharedProjectConnectionInfo() {
        const uri: string = this.state.pastedUri;
        if (this.getSharedUriParams(uri)) {
            const { token, sasFolder, projectName } = this.getSharedUriParams(uri);
            const connection = this.getSharedConnection(this.props.connections, sasFolder)
            if (connection) {
                return { token, projectName, connection };
            }
        }
        return null
    }

    private getSharedConnection(connections: IConnection[], sasFolder: string) {
        const connection: IConnection[] = connections.filter(({ providerOptions }) => providerOptions["sas"].includes(sasFolder));
        if (connection.length) {
            return connection[0];
        }
        toast.error(strings.shareProject.errors.connectionNotFound);
        return null
    }

    private getSharedUriParams(sharedSting: string) {
        const location: string = window.location.origin;
        let uri: string;
        let url: URL;

        try {
            uri = location + atob(sharedSting);
            url = new URL(uri);
        } catch (error) {
            toast.error(strings.shareProject.errors.cannotDecodeString);
            return;
        }

        if (url) {
            return {
                sasFolder: decodeURIComponent(url.searchParams.get("SAS")),
                projectName: decodeURIComponent(url.searchParams.get("name")),
                token: {
                    name: decodeURIComponent(url.searchParams.get("tokenName")),
                    key: decodeURIComponent(url.searchParams.get("key"))
                }
            }
        }
    }

    private handlePasteUri(ev) {
        this.setState({pasting:true, pastedUri: ev.target.value})
    }

    private handleChangeUri(ev) {
        if (this.state.pasting) {
            this.setState({pastedUri: ev.target.value, okDisabled: false});
        }
    }

    private async readFile(connection: IConnection, projectName: string) {
        const storageProvider = StorageProviderFactory.createFromConnection(connection);
        const files = await storageProvider.listFiles(undefined, ".fott")
        this.setState({selectedFile: files.filter((file) => file.includes(projectName))[0]})
    }

    private back() {
        this.setState({
            ...this.getInitialState(),
            isOpen: true,
        });
    }

    private getCondensedList(title: string, items: any[], onClick) {
        return <CondensedList
            title={title}
            items={items}
            Component={ListItem}
            onClick={onClick}
        />;
    }

    private isCloudConnection(connection: IConnection): boolean {
        try {
            const storageProvider = StorageProviderFactory.createFromConnection(connection);
            return storageProvider.storageType === StorageType.Cloud;
        } catch (e) {
            // Catches connections that are not registered as StorageProviders (e.g. Bing Image search)
            return false;
        }
    }

    private getCloudConnections(connections: IConnection[]): IConnection[] {
        return connections.filter(this.isCloudConnection);
    }

    private connectionList() {
        const connections = this.getCloudConnections(this.props.connections);
        return this.getCondensedList("Cloud Connections", connections, (args) => this.onClickConnection(args));
    }

    private async onClickConnection(args) {
        const connection: IConnection = {
            ...args,
        };
        try {
            const fileList = await this.fileList(connection);
            this.setState({
                selectedConnection: connection,
                modalHeader: `Select a file from "${connection.name}"`,
                condensedList: fileList,
                backDisabled: false,
            });
        } catch (err) {
            if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                const reason = interpolate(strings.errors.blobContainerIONotFound.message, {});
                toast.error(reason, { autoClose: false });
                return;
            }
            throw err;
        }
    }

    private async fileList(connection: IConnection) {
        const storageProvider = StorageProviderFactory.createFromConnection(connection);
        const files = await storageProvider.listFiles(
            "", // root folder
            this.props.fileExtension);
        const fileItems = [];
        for (let i = 0; i < files.length; i++) {
            fileItems.push({
                id: `file-${i + 1}`,
                name: files[i],
            });
        }
        return this.getCondensedList(
            `${this.props.fileExtension || "All"} Files in "${connection.name}"`,
            fileItems,
            this.onClickFile,
        );
    }

    private onClickFile(args) {
        const fileName = args.name;
        this.setState({
            selectedFile: fileName,
            okDisabled: false,
        });
    }
}
