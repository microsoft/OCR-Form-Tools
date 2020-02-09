// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export default class Utils {
    // convert degree to radians
    public static degreeToRadians(degree: number) {
        return degree * Math.PI * 2 / 360;
    }
}
