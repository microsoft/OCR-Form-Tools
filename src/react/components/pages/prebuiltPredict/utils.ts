import _ from "lodash";
import {constants} from "../../../../common/constants";

/**
 * Poll function to repeatly check if request succeeded
 * @param func - function that will be called repeatly
 * @param timeout - timeout
 * @param interval - interval
 */
export function poll(func, timeout, interval): Promise<any> {
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
