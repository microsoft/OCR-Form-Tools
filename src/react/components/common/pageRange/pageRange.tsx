import {Checkbox, TooltipHost} from '@fluentui/react';
import React, {ChangeEvent} from 'react';
import {strings} from '../../../../common/strings';
import {getPrimaryGreyTheme} from '../../../../common/themes';
import "./pageRange.scss";

interface IPageRangeProps {
    disabled: boolean;
    withPageRange: boolean;
    pageRange: string;
    onPageRangeChange(withPageRange: boolean, pageRange: string, isValid: boolean);
}
interface IPageRangeState {
    alert: string;
}
export class PageRange extends React.Component<Partial<IPageRangeProps>, IPageRangeState>{
    state: IPageRangeState = {
        alert: ""
    };


    componentDidUpdate() {
        const alert = pageRangeIsValid(this.props.pageRange) ? "" : "page-range-alert";
        if (this.state.alert !== alert) {
            this.setState({alert});
        }
    }

    render() {
        const {disabled} = this.props;
        return <>
            <div className="page-range">
                <Checkbox label={strings.pageRange.title}
                    className="content-left"
                    disabled={disabled}
                    checked={this.props.withPageRange}
                    onChange={this.onWithPageRangeChange}
                    theme={getPrimaryGreyTheme()}
                />
                {this.props.withPageRange &&
                    <div className="page-range-text ml-2">
                        <TooltipHost
                            content={strings.pageRange.tooltip}>
                            <input
                                disabled={disabled}
                                name="pagerange"
                                className={this.state.alert}
                                value={this.props.pageRange}
                                placeholder="e.g: 1, 5, 7, 9-10"
                                onChange={this.onPageRangeValueChange}
                            />
                        </TooltipHost>
                    </div>
                }
            </div>
        </>
    }

    onWithPageRangeChange = (_e, withPageRange: boolean) => {
        this.props.onPageRangeChange(withPageRange, this.props.pageRange, pageRangeIsValid(this.props.pageRange));
    }

    onPageRangeValueChange = (e: ChangeEvent<HTMLInputElement>) => {
        const pageRange = e.target.value;
        this.props.onPageRangeChange(this.props.withPageRange, pageRange, pageRangeIsValid(pageRange));
    }
}

const pageRangeIsValid = (pageRange: string): boolean => {
    // It must be a valid page range format, e.g. 1,2,3-5,7
    // The user can only type digit, dot, and dash.
    // Must start and end with digit.
    return /^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(pageRange);
}
