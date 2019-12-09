/**
 * Constants used throughout application
 */
export const constants = {
    projectFileExtension: ".vott",
    assetMetadataFileExtension: "-asset.json",
    exportFileExtension: "-export.json",
    labelFileExtension: ".labels.json",
    ocrFileExtension: ".ocr.json",
    maxConcurrentServiceRequests: 3,
    statusCodeSucceeded: "succeeded",
    statusCodeFailed: "failed",
    apiKeyHeader: "Ocp-Apim-Subscription-Key",
    maxRetry: 8,
    initialRetryInterval: 500, // ms
    convertedImageFormat: "image/jpeg",
    convertedImageQuality: 0.7,
    convertedThumbnailQuality: 0.2,
};
