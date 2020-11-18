// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import axios, {AxiosPromise, AxiosRequestConfig} from "axios";
import {toast} from "react-toastify";
import {constants} from "../common/constants";
import {interpolate, strings} from "../common/strings";
import {delay} from "../common/utils";
import {AppError, ErrorCode} from "../models/applicationState";

export default class ServiceHelper {
    public static handleServiceError = (err: any) => {
        if (err && err.response) {
            if (err.response.status === 401) {
                const message = (err.response.data && err.response.data.error && err.response.data.error.message) || "Please make sure the API key is correct.";
                throw new AppError(ErrorCode.HttpStatusUnauthorized, message, "Permission Denied");
            } else if (err.response?.status === 404) {
                throw new AppError(
                    ErrorCode.HttpStatusNotFound,
                    "Please make sure the service endpoint is correct.",
                    "Endpoint not found");
            } else if (err.response.status === 429) {
                const response = err.response;
                let errorCode = ErrorCode.Unknown;
                let errorMessage = "";
                let errorTitle = "";
                if (response.data && response.data.error && response.data.error.code === "1014") {
                    errorCode = ErrorCode.ModelCountLimitExceeded;
                    errorMessage = strings.errors.modelCountLimitExceeded.message;
                    errorTitle = strings.errors.modelCountLimitExceeded.title;
                } else {
                    errorCode = ErrorCode.HttpStatusTooManyRequests;
                    errorMessage = strings.errors.tooManyRequests.message;
                    errorTitle = strings.errors.tooManyRequests.title;
                }
                throw new AppError(errorCode, errorMessage, errorTitle);
            } else if (err.response.data && err.response.data.error && err.response.data.error.code === "1001") {
                throw new AppError(
                    ErrorCode.ModelNotFound,
                    err.response.data.error.message);
            } else if (err.response.data && err.response.data.error && err.response.data.error.message) {
                throw new AppError(
                    ErrorCode.Unknown,
                    err.response.data.error.message);
            } else {
                throw new AppError(
                    ErrorCode.Unknown,
                    "An error occurred in the service. Please try again later.",
                    "Error");
            }
        } else if (err.endpoint) {
            toast.warn(interpolate(strings.errors.endpointConnectionError.message,  {endpoint: "form recognizer backend URL"}), {autoClose: 10000})
            throw new AppError(
                ErrorCode.HttpStatusNotFound,
                interpolate(strings.errors.endpointConnectionError.message,  {endpoint: "form recognizer backend URL"}),
                strings.errors.endpointConnectionError.title);
        } else {
            // Network Error
            toast.warn("Over rate limitation, please try again later",{autoClose: 10000})
            throw new AppError(
                ErrorCode.HttpStatusNotFound,
                "Cannot resolve the host name. Please make sure the service endpoint is correct.",
                "Endpoint not found");
        }
    }

    public static postWithAutoRetry = <T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
        apiKey?: string,
    ): AxiosPromise<T> =>
        ServiceHelper.sendRequestWithAutoRetry(() => axios.post(url, data, ServiceHelper.applyApiKey(config, apiKey)))

    public static getWithAutoRetry = <T = any>(
        url: string,
        config?: AxiosRequestConfig,
        apiKey?: string,
    ): AxiosPromise<T> =>
        ServiceHelper.sendRequestWithAutoRetry(() => axios.get(url, ServiceHelper.applyApiKey(config, apiKey)))

    private static applyApiKey = (config?: AxiosRequestConfig, apiKey?: string) => ({
        ...config,
        headers: {
            ...config.headers,
            ...(apiKey ? {[constants.apiKeyHeader]: apiKey} : {}),
        },
    })

    private static sendRequestWithAutoRetry = async <T>(request: () => AxiosPromise<T>) => {
        let currentRetry = 0;
        while (true) {
            try {
                return await request();
            } catch (err) {
                currentRetry++;
                if (currentRetry > constants.maxRetry || !ServiceHelper.isTransient(err)) {
                    throw err;
                }

                await delay(constants.initialRetryInterval * Math.pow(2, currentRetry - 1));
            }
        }
    }

    private static isTransient = (err) => {
        if (err && err.response) {
            const response = err.response;
            if (response.status === 429
                && response.data
                && response.data.error
                && response.data.error.code === "1014") {
                return false;
            }
            return [408, 429, 444, 500, 503, 504].includes(err.response.status);
        }
        return false;
    }
}
