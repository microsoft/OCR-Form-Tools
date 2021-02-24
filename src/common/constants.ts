// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { appInfo } from "./appInfo"

const appVersionRaw = appInfo.version
const appVersionArr = appVersionRaw.split(".");
appVersionArr[1] = appVersionArr[1] + "-preview";
const appVersion = appVersionArr.join(".");

const enableAPIVersionSelection = appInfo.enableAPIVersionSelection;
const enablePredictionResultUpload = appInfo.enablePredictionResultUpload;
const apiVersion = "v2.1-preview.3";

/**
 * Constants used throughout application
 */
export const constants = {
    version: "pubpreview_1.0",
    appVersionRaw,
    appVersion,
    apiVersion,
    enableAPIVersionSelection,
    enablePredictionResultUpload,
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
    statusCodeInvalid: "invalid",
    apiKeyHeader: "Ocp-Apim-Subscription-Key",
    maxRetry: 8,
    initialRetryInterval: 500, // ms
    convertedImageFormat: "image/jpeg",
    convertedImageQuality: 0.7,
    convertedThumbnailQuality: 0.2,
    recentModelRecordsCount: 5,
    // eslint-disable-next-line
    apiModelsPath: "/formrecognizer/${apiVersion}/custom/models",
    autoLabelBatchSizeMax: 10,
    autoLabelBatchSizeMin: 3,
    showOriginLabelsByDefault: true,
    fieldsSchema: "https://schema.cognitiveservices.azure.com/formrecognizer/2021-03-01/fields.json",
    labelsSchema: "https://schema.cognitiveservices.azure.com/formrecognizer/2021-03-01/labels.json",
    enableMultiPageField: false,
    pdfjsWorkerSrc(version: string) {
        return `https://fotts.azureedge.net/npm/pdfjs-dist/${version}/pdf.worker.js`;
    },

    pdfjsCMapUrl(version: string) {
        return `https://fotts.azureedge.net/npm/pdfjs-dist/${version}/cmaps/`;
    },
    insightsKey: "",
    prebuiltServiceVersion: "v2.1-preview.3",
    pages: "pages"
};
