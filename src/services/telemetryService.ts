import { ApplicationInsights, ITelemetryItem } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { constants } from "../common/constants";

let reactPlugin = null;
let appInsights = null;

const adjustPageViewName = (item) => {
    const pathArray: string[] = item.uri.split("/");
    const pathName = pathArray.length > 2 ? pathArray[1].slice(0, -1) + "_" + pathArray[3] : pathArray[1];
    switch (pathName) {
        case "project_edit":
            return "Editor";
        case "project_train":
            return "Train";
        case "project_modelcompose":
            return "Model_Compose"
        case "project_predict":
            return "Analyze";
        case "project_settings":
            return "Project_Setting";
        case "connections":
            return "Application_Connections";
        case "settings":
            return "Application_Settings";
        default:
            return "Home";
    }
}

/**
 * Create the App Insights Telemetry Service
 * @return {{reactPlugin: ReactPlugin, appInsights: Object, initialize: Function}} - Object
 */
const createTelemetryService = () => {

    /**
     * Initialize the Application Insights class
     * @param {string} instrumentationKey - Application Insights Instrumentation Key
     * @param {Object} browserHistory - client"s browser history, supplied by the withRouter HOC
     * @return {void}
     */
    const initialize = (instrumentationKey: string, browserHistory: any): void => {
        if (!browserHistory) {
            throw new Error("Could not initialize Telemetry Service");
        }
        if (!instrumentationKey) {
            throw new Error("Telemetry Service Instrumentation key not provided.")
        }

        reactPlugin = new ReactPlugin();

        appInsights = new ApplicationInsights({
            config: {
                instrumentationKey,
                maxBatchInterval: 0,
                disableAjaxTracking: true,
                enableUnhandledPromiseRejectionTracking: true,
                extensions: [reactPlugin],
                extensionConfig: {
                    [reactPlugin.identifier]: {
                        history: browserHistory
                    }
                }
            }
        });
        appInsights.loadAppInsights();

        appInsights.context.application.ver = constants.apiVersion;
        appInsights.addTelemetryInitializer((envelope) => {
            const telemetryItem: ITelemetryItem = envelope.baseData;
            telemetryItem.name = adjustPageViewName(telemetryItem);
        })
    };

    return { reactPlugin, appInsights, initialize };
};

export const ai = createTelemetryService();
export const getAppInsights = () => appInsights;
