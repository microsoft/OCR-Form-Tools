// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { appInfo } from "./appInfo"

const appVersionArr = appInfo.version.split(".");
appVersionArr[1] = appVersionArr[1] + "-preview";
const appVersion = appVersionArr.join(".");

const apiVersion = "v2.1-preview.1";

/**
 * Constants used throughout application
 */
export const constants = {
    version: "pubpreview_1.0",
    appVersion,
    apiVersion,
    projectFormTempKey: "projectForm",
    projectFileExtensionOld: ".vott",
    projectFileExtension: ".fott",
    labelFileExtension: ".labels.json",
    ocrFileExtension: ".ocr.json",
    fieldsFileName: "fields.json",
    maxConcurrentServiceRequests: 3,
    statusCodeSucceeded: "succeeded",
    statusCodeReady: "ready",
    statusCodeFailed: "failed",
    apiKeyHeader: "Ocp-Apim-Subscription-Key",
    maxRetry: 8,
    initialRetryInterval: 500, // ms
    convertedImageFormat: "image/jpeg",
    convertedImageQuality: 0.7,
    convertedThumbnailQuality: 0.2,
    recentModelRecordsCount: 5,
    apiModelsPath: `/formrecognizer/${apiVersion}/custom/models`,

    pdfjsWorkerSrc(version: string) {
        return `https://fotts.azureedge.net/npm/pdfjs-dist/${version}/pdf.worker.js`;
    },

    pdfjsCMapUrl(version: string) {
        return `https://fotts.azureedge.net/npm/pdfjs-dist/${version}/cmaps/`;
    },
    insightsKey: "dd15609c-c451-4e00-b193-abdf3e1d36e8",
};
