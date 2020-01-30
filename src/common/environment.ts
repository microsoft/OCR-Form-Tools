// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export class Env {
    public static get() {
        return process.env.NODE_ENV;
    }
}
