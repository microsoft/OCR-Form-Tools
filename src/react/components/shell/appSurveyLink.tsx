import React from 'react';
import { strings } from "../../../common/strings";
import "./appSurveyLink.scss"

export default class AppSurveyLink extends React.PureComponent {
    render() {
        return (
            <a className="app-survey-link-anchor"
                target="_blank"
                rel="noopener noreferrer"
                href="https://microsoft.qualtrics.com/jfe/form/SV_40zWLBFYILTkRWl?Kind=FormRecognizer&From=fott">
                    {strings.appSurveyText}
            </a>
        )
    }
}
