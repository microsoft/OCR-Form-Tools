// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { FontIcon } from "@fluentui/react";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import "./condensedList.scss";

/**
 * Properties for Condensed List Component
 * @member title - Title of condensed list
 * @member items - Array of items to be rendered
 * @member newLinkTo - Link for list items
 * @member newLinkToTitle - Title of newLink
 * @member onClick - Function to call on clicking items
 * @member onDelete - Function to call on deleting items
 * @member Component - Component to be rendered for list items
 */
interface ICondensedListProps {
    title: string;
    Component: any;
    items: any[];
    newLinkTo?: string;
    newLinkToTitle?: string;
    onClick?: (item) => void;
    onDelete?: (item) => void;
}

interface ICondensedListState {
    currentId: string;
}

/**
 * @name - Condensed List
 * @description - Clickable, deletable and linkable list of items
 */
export default class CondensedList extends React.Component<ICondensedListProps, ICondensedListState> {
    constructor(props, context) {
        super(props, context);
        this.state = { currentId: null };

        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDelete = this.onItemDelete.bind(this);
    }

    public render() {
        const { title, items, newLinkTo, newLinkToTitle, Component } = this.props;

        return (
            <div className="condensed-list">
                <div className="condensed-list-header bg-darker-2">
                    <span>{title}</span>
                    {newLinkTo &&
                        <Link to={newLinkTo} className="float-right add-button" role="button" title={newLinkToTitle}
                            id="addConnection">
                            <FontIcon iconName="AddTo" />
                        </Link>
                    }
                </div>
                <div className="condensed-list-body">
                    {(!items) &&
                        <div className="p-3 text-center">
                            <Spinner size={SpinnerSize.small} />
                        </div>
                    }
                    {(items && items.length === 0) &&
                        <div className="p-3 text-center">No items found</div>
                    }
                    {(items && items.length > 0) &&
                        <ul className="condensed-list-items">
                            {items.map((item) => <Component key={item.id}
                                item={item}
                                currentId={this.state.currentId}
                                onClick={(e) => this.onItemClick(e, item)}
                                onDelete={(e) => this.onItemDelete(e, item)} />)}
                        </ul>
                    }
                </div>
            </div>
        );
    }

    private onItemClick = (e, item) => {
        if (this.props.onClick) {
            this.props.onClick(item);
        }
        this.setState({ currentId: item.id });
    }

    private onItemDelete = (e: SyntheticEvent, item) => {
        e.stopPropagation();
        e.preventDefault();

        if (this.props.onDelete) {
            this.props.onDelete(item);
        }
    }
}

/**
 * Generic list item with an onClick function and a name
 * @param param0 - {item: {name: ""}, onClick: (item) => void;}
 */
export function ListItem({ item, onClick, currentId }) {
    return (
        <li>
            {/* eslint-disable-next-line */}
            <a className={["condensed-list-item", currentId === item.id? "current":""].join(" ")} onClick={onClick}>
                <span className="px-2">{item.name}</span>
            </a>
        </li>
    );
}
