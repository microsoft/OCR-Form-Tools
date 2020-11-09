// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable jsx-a11y/anchor-is-valid */
import {Customizer, FontIcon, ICustomizations, Modal} from '@fluentui/react';
import React, {SyntheticEvent} from 'react';
import {ModalHeader} from 'reactstrap';
import {isElectron} from "../../../../common/hostProcess";
import {strings} from '../../../../common/strings';
import {getDarkGreyTheme, getPrimaryRedTheme} from '../../../../common/themes';
import {IConnection, IProject} from '../../../../models/applicationState';
import CondensedList from '../../common/condensedList/condensedList';
import Confirm from '../../common/confirm/confirm';
import FilePicker from '../../common/filePicker/filePicker';
import RecentProjectItem from './recentProjectItem';

interface IHomeProjectViewProps {
    recentProjects: IProject[];
    connections: IConnection[];

    createNewProject(e: SyntheticEvent): void;
    onProjectFileUpload(e, project): void;
    onProjectFileUploadError(e, error: any): void;
    onOpenCloudProjectClick(): void;
    loadSelectedProject(project: IProject, sharedToken?: {}): void;
    freshLoadSelectedProject(project: IProject): void;
    deleteProject(project: IProject): void;
}

interface IHomeProjectViewState {
    isOpen: boolean;
}

export class HomeProjectView extends React.Component<Partial<IHomeProjectViewProps>, IHomeProjectViewState>{
    state = {isOpen: false};

    open = () => {
        this.setState({isOpen: true});
    }
    close = () => {
        this.setState({isOpen: false});
    }

    private filePicker: React.RefObject<FilePicker> = React.createRef();
    private newProjectRef = React.createRef<HTMLAnchorElement>();
    private deleteConfirmRef: React.RefObject<Confirm> = React.createRef();


    componentDidMount() {
        this.newProjectRef.current?.focus();
    }

    componentDidUpdate() {
        this.newProjectRef.current?.focus();
    }

    render() {
        const dark: ICustomizations = {
            settings: {
                theme: getDarkGreyTheme(),
            },
            scopedSettings: {},
        };
        const closeBtn = <button className="close" onClick={this.close}>&times;</button>;
        return (
            <>
                <Customizer {...dark}>
                    <Modal
                        className="homepage-modal"
                        isModeless={false}
                        isOpen={this.state.isOpen}
                        isBlocking={false}
                        containerClassName="modal-container"
                        scrollableContentClassName="modal-content"
                    >
                        <ModalHeader toggle={this.close} close={closeBtn}>
                            {strings.homePage.homeProjectView.title}
                        </ModalHeader>
                        <div className="body">
                            <div className="modal-left">
                                <ul>
                                    <li>
                                        <a ref={this.newProjectRef}
                                            id="home_newProject"
                                            href="#" onClick={this.props.createNewProject} className="p-5 new-project skipToMainContent" role="button">
                                            <FontIcon iconName="AddTo" className="icon-9x" />
                                            <div className="title">{strings.homePage.newProject}</div>
                                        </a>
                                    </li>
                                    {isElectron() &&
                                        <li>
                                            <a href="#" className="p-5 file-upload"
                                                onClick={() => this.filePicker.current.upload()} >
                                                <FontIcon iconName="System" className="icon-9x" />
                                                <div className="title">{strings.homePage.openLocalProject.title}</div>
                                            </a>
                                            <FilePicker ref={this.filePicker}
                                                onChange={this.props.onProjectFileUpload}
                                                onError={this.props.onProjectFileUploadError}
                                                accept={[".fott"]}
                                            />
                                        </li>
                                    }
                                    <li>
                                        {/*Open Cloud Project*/}
                                        {/* eslint-disable-next-line */}
                                        <a href="#" onClick={this.props.onOpenCloudProjectClick}
                                            className="p-5 cloud-open-project" role="button">
                                            <FontIcon iconName="Cloud" className="icon-9x" />
                                            <div className="title">{strings.homePage.openCloudProject.title}</div>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            {(this.props.recentProjects && this.props.recentProjects.length > 0) &&
                                <div className="modal-right bg-lighter-1">
                                    <CondensedList
                                        title={strings.homePage.recentProjects}
                                        Component={RecentProjectItem}
                                        items={this.props.recentProjects}
                                        onClick={this.props.freshLoadSelectedProject}
                                        onDelete={(project) => this.deleteConfirmRef.current.open(project)} />
                                </div>

                            }
                        </div>
                        <Confirm title="Delete Project"
                            ref={this.deleteConfirmRef as any}
                            message={(project: IProject) => `${strings.homePage.deleteProject.confirmation} ${project.name}?`}
                            confirmButtonTheme={getPrimaryRedTheme()}
                            onConfirm={this.props.deleteProject} />
                    </Modal>
                </Customizer>
            </>
        )
    }
}
