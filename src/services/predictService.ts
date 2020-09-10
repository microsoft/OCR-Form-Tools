import _ from "lodash";
import url from 'url';
import { constants } from "../common/constants";
import { interpolate, strings } from "../common/strings";
import { AppError, ErrorCode, IProject } from "../models/applicationState";
import ServiceHelper from "./serviceHelper";

export enum AutoLabelingStatus {
    none,
    running,
    done
}
export class PredictService {

    constructor(private project: IProject) {
    }
    public async getPrediction(fileUrl: string): Promise<any> {
        const modelID = this.project.predictModelId;
        if (!modelID) {
            throw new AppError(
                ErrorCode.PredictWithoutTrainForbidden,
                strings.errors.predictWithoutTrainForbidden.message,
                strings.errors.predictWithoutTrainForbidden.title);
        }
        const endpointURL = url.resolve(
            this.project.apiUriBase,
            `${constants.apiModelsPath}/${modelID}/analyze?includeTextDetails=true`,
        );

        const headers = { "Content-Type": "application/json", "cache-control": "no-cache" };
        const body = { source: fileUrl };

        try {
            const response = await ServiceHelper.postWithAutoRetry(endpointURL, body, { headers }, this.project.apiKey as string);
            const operationLocation = response.headers["operation-location"];

            return this.poll(() =>
            ServiceHelper.getWithAutoRetry(
                operationLocation, { headers }, this.project.apiKey as string), 120000, 500);


        } catch (err) {
            if (err.response.status === 404) {
                throw new AppError(
                    ErrorCode.ModelNotFound,
                    interpolate(strings.errors.modelNotFound.message, { modelID })
                );
            } else {
                ServiceHelper.handleServiceError(err);
            }
        }
    }
    private poll = (func, timeout, interval): Promise<any> => {
        const endTime = Number(new Date()) + (timeout || 10000);
        interval = interval || 100;

        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then((response) => {
                if (response.data.status.toLowerCase() === constants.statusCodeSucceeded) {
                    resolve(response.data);
                    // prediction response from API
                    console.log("raw data", JSON.parse(response.request.response));
                } else if (response.data.status.toLowerCase() === constants.statusCodeFailed) {
                    reject(_.get(
                        response,
                        "data.analyzeResult.errors[0].errorMessage",
                        "Generic error during prediction"));
                } else if (Number(new Date()) < endTime) {
                    // If the request isn't succeeded and the timeout hasn't elapsed, go again
                    setTimeout(checkSucceeded, interval, resolve, reject);
                } else {
                    // Didn't succeeded after too much time, reject
                    reject("Timed out, please try other file.");
                }
            });
        };

        return new Promise(checkSucceeded);
    }
}
