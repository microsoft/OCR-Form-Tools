// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export class AzureBlobStorageError extends Error {
    public statusCode: number;

    constructor(statusCode: number) {
        super();
        this.statusCode = statusCode;
    }
}
