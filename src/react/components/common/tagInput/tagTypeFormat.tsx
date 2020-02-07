import React from "react";
import { ITag, FieldType, FieldFormat  } from "../../../../models/applicationState";
import "./tagTypeFormat.scss";
import "./tagInputItem.scss";
import { PaginationLink, Tag } from "reactstrap";
import ConnectionForm from "../../pages/connections/connectionForm";

/**
 * Properties for Tag Type Format component
 * @member tag - ITag
 */
export interface ITagTypeFormatProps {
    tag: ITag;
    onChange?: (oldTag: ITag, newTag: ITag) => void;
}

/**
 * State for Tag Type Format
 * @member tag - ITag
 */
export interface ITagFormatState {
    tag: ITag;
    showFormat?: boolean;
    showType?: boolean;
}

/**
 * Generic modal that displays a message
 */
export default class TagTypeFormat extends React.Component<ITagTypeFormatProps, ITagFormatState> {

    private static filterFormat(type: FieldType): FieldFormat[] {
        switch (type) {
            case FieldType.String:
                return [
                    FieldFormat.NotSpecified,
                    FieldFormat.Alphanumberic,
                    FieldFormat.NoWhiteSpaces,
                ];
            case FieldType.Number:
                return [
                    FieldFormat.NotSpecified,
                    FieldFormat.Currency,
                ];
            case FieldType.Integer:
                return [
                    FieldFormat.NotSpecified,
                ];
            case FieldType.Date:
                return [
                    FieldFormat.NotSpecified,
                    FieldFormat.DMY,
                    FieldFormat.MDY,
                    FieldFormat.YMD,
                ];
            case FieldType.Time:
                return [
                    FieldFormat.NotSpecified,
                ];
            default:
                return [ FieldFormat.NotSpecified ];
        }
    }
    public state: ITagFormatState = {
        tag: this.props.tag,
        showFormat: false,
        showType: false,
    };
    constructor(props) {
        super(props);
    }

    public render() {
        const tag = this.state.tag;
        const types = Object.keys(FieldType);
        const formats = TagTypeFormat.filterFormat(tag.type);

        return (
            <div className = "field-background field-background-color">
                <div className = "tag-field justify-content-start">
                    <div className = "row-4 tag-field-item">
                        <div onClick = {this.handleTypeShow} className = "field-background-container">
                            <span className = "type-selected">{tag.type}</span>
                            <button
                                type="button"
                                className="ms-Icon ms-Icon--ChevronDown field-background-color dropdown-border icon-color"></button>
                        </div>
                        <div className = {this.showHideType()}>
                            <ol className = "format-items-list">
                                {
                                    types.map((type) => {
                                        return(
                                            this.getTypeListItem(this, type)
                                        );
                                    })
                                }
                            </ol>
                        </div>
                    </div>
                    <div className = "horizontal-line"></div>
                    <div className = "row-4 tag-field-item">
                        <div onClick={this.handleFormatShow} className = "field-background-container">
                            <span>{tag.format}</span>
                            <button
                                type="button"
                                className="ms-Icon ms-Icon--ChevronDown field-background-color dropdown-border icon-color"></button>
                         </div>
                        <div className = {this.showHideFormat()}>
                            <ol className = "format-items-list">
                                {
                                    formats.map((format) => {
                                        return (
                                            this.getFormatListItem(this, format)
                                        );
                                    })
                                }
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    private handleTypeChange = (event) => {
        const oldTag = this.state.tag;
        const newTag: ITag = {
            ...oldTag,
            type: event.target.value as FieldType,
            format: FieldFormat.NotSpecified,
        };
        this.setState({ tag: newTag, showType: false }, () => {
            if (this.props.onChange) {
                this.props.onChange(oldTag, newTag);
            }
        });
    }

    private handleTypeShow = (e) => {
        if (e.type === "click") {
            this.setState({showType: !this.state.showType, showFormat: false});
        }
    }

    private showHideType = () => {
        let formatHideClass = ["format-items-hide"];
        if (this.state.showType) {
            formatHideClass = [];
        }
        return formatHideClass.join(" ");
    }

    private handleFormatShow = (e) => {
        if (e.type === "click") {
            this.setState({showFormat: !this.state.showFormat, showType: false}); }
        }

    private showHideFormat = () => {
        let formatHideClass = ["format-items-hide", "format-list"];
        if (this.state.showFormat) {
            formatHideClass = ["format-list"];
        }
        return formatHideClass.join(" ");
    }

    private handleFormatChange = (event) => {
        const oldTag = this.state.tag;
        const newTag: ITag = {
            ...oldTag,
            format: event.target.value,
        };

        this.setState({ tag: newTag, showFormat: false }, () => {
            if (this.props.onChange) {
                this.props.onChange(oldTag, newTag);
            }
        });
    }

    private getTypeListItem(props, t) {
        return (
            <button type = "button"
                key = {t}
                onClick = {props.handleTypeChange}
                value = {FieldType[t]}
                className="list-items list-items-color"
            >
                {FieldType[t]}
            </button>
        );
    }

    private getFormatListItem(props, f) {
        return(
            <button type = "button"
                key = {f}
                onClick = {props.handleFormatChange}
                value = {f}
                className="list-items list-items-color"
            >
                {f}
            </button>
        );
    }
}
