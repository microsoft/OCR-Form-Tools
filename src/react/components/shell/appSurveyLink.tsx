import React from 'react';
import { strings } from "../../../common/strings";
import "./appSurveyLink.scss"

export default class AppSurveyLink extends React.PureComponent {
    render() {
        return (
            <a className="app-survey-link-anchor"
                target="_blank"
                rel="noopener noreferrer"
                href="https://go.microsoft.com/fwlink/?linkid=2163219">
                    {strings.appSurveyText}
            </a>
        )
    }
}
