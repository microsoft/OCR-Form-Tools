// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Constants used throughout application
 */
export const constants = {
    version: "pubpreview_1.0",
    projectFormTempKey: "projectForm",
    projectFileExtensionOld: ".vott",
    projectFileExtension: ".proj",
    labelFileExtension: ".labels.json",
    ocrFileExtension: ".ocr.json",
    fieldsFileName: "fields.json",
    maxConcurrentServiceRequests: 3,
    statusCodeSucceeded: "succeeded",
    statusCodeFailed: "failed",
    apiKeyHeader: "Ocp-Apim-Subscription-Key",
    maxRetry: 8,
    initialRetryInterval: 500, // ms
    convertedImageFormat: "image/jpeg",
    convertedImageQuality: 0.7,
    convertedThumbnailQuality: 0.2,
    skipTop: "top",

    apiModelsPath: "/formrecognizer/v2.0-preview/custom/models",
};
