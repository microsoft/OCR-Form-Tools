// tslint:disable: linebreak-style
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export interface IDisplayNameProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
}

export interface IDisplayNameState {
    value: string;
}

export default class DisplayName extends React.Component<IDisplayNameProps, IDisplayNameState> {

    constructor(props) {
        super(props);

        this.state = {
            value: this.props.value || "",
        };

        this.onChange = this.onChange.bind(this);
    }

    public componentDidMount() {
        console.log(this.props.value + "mountttt");
        this.props.onChange(this.props.value);
    }

    public componentDidUpdate(prevProps: IDisplayNameProps) {
        console.log(this.props.value + "updateee");
        if (prevProps.value !== this.props.value) {
            this.setState({value: this.props.value});
        }
    }

    public render() {
        const {id} = this.props;
        const {value} = this.state;
        console.log(this.props.value);
        console.log(this.state.value);
        return(
                <input
                    id={id}
                    type="text"
                    className="form-control"
                    required
                    value={value}
                    onChange={this.onChange}
                    ></input>
        );
    }

    private onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({value: e.target.value}, () => this.props.onChange(this.state.value));
    }
}
