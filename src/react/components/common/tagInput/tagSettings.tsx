import React from "react";
import { ITag } from "../../../../models/applicationState";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import TagTypeFormat from "./tagTypeFormat";

/**
 * Properties for Tag Setting component
 * @member tags - ITag[]
 * @member onClose - Function to call when the popup is closed
 */
export interface ITagSettingProps {
    tags: ITag[];
    onTagChanged?: (oldTag: ITag, newTag: ITag) => void;
    onClose?: () => void;
}

/**
 * State for Message Box
 * @member isOpen - Message box is open
 * @member isRender - Message box is rendered
 * @member isButtonSelected - Message box button is selected
 */
export interface ITagSettingState {
    tags: ITag[];
}

/**
 * Generic modal that displays a message
 */
export default class TagSetting extends React.Component<ITagSettingProps, ITagSettingState> {
    constructor(props, context) {
        super(props, context);
        this.state = {
            tags: props.tags,
        };

        this.onCloseClick = this.onCloseClick.bind(this);
    }

    public render() {
        return (
            <Modal isOpen={true} className="messagebox-modal">
                <ModalHeader>Tags</ModalHeader>
                <ModalBody>{this.renderTagItems()}</ModalBody>
                <ModalFooter>
                    <Button
                        autoFocus={true}
                        color="primary"
                        onClick={this.onCloseClick}
                        >Close</Button>
                </ModalFooter>
            </Modal>
        );
    }

    private onCloseClick() {
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    private renderTagItems() {
        return this.state.tags.map(tag =>
            <TagTypeFormat
                key={tag.name}
                tag={tag}
                onChange={this.props.onTagChanged}
                />,
        );
    }
}
