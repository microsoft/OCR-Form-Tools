// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { forEachAsync as arrayForEachAsync, mapAsync, containsDuplicates } from "./common/extensions/array";
import { forEachAsync as mapForEachAsync } from "./common/extensions/map";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        /**
         * Processes items in the array within the specified batch size (default: 5)
         * @param this The array to process
         * @param action The action to perform on each item in the array
         * @param batchSize The batch size for actions to perform in parallel (default: 5)
         */
        forEachAsync(action: (item: T) => Promise<void>, batchSize?: number): Promise<void>;

        /**
         * Maps items in the array in async batches with the specified action
         * @param this The array to process
         * @param action The transformer action to perform on each item in the array
         * @param batchSize The batch size for actions to perform in parallel (default: 5);
         */
        mapAsync<R>(action: (item: T) => Promise<R>, batchSize?: number): Promise<R[]>;

        /**
         * Checks for duplicates in an array using a key selector function for each item.
         * @param this The array of items to process
         * @param keySelectorFn The selector function that returns the appropriate key for each item in the array
         * @param keyNormalizerFn An optional normalization function to apply to each item's key before checking
         *                        for uniqueness. If none is provided, the default normalization function will be
         *                        used (trim + lower case).
         */
        containsDuplicates<T>(
            this: T[],
            keySelectorFn: (t: T) => string,
            keyNormalizerFn?: (s: string) => string): boolean;
    }

    // tslint:disable-next-line:interface-name
    interface Map<K, V> {
        /**
         * Processes items in the map within the specified batch size (default: 5)
         * @param this The map to process
         * @param action The action to perform on each item in the map
         * @param batchSize The batch size for actions to perform in parallel (default: 5)
         */
        forEachAsync(action: (value: V, key: K) => Promise<void>, batchSize?: number): Promise<void>;
    }
}

export default function registerMixins() {
    /*eslint-disable no-extend-native*/
    if (!Array.prototype.forEachAsync) {
        Array.prototype.forEachAsync = arrayForEachAsync;
    }

    if (!Array.prototype.mapAsync) {
        Array.prototype.mapAsync = mapAsync;
    }

    if (!Array.prototype.containsDuplicates) {
        Array.prototype.containsDuplicates = containsDuplicates;
    }

    if (!Map.prototype.forEachAsync) {
        Map.prototype.forEachAsync = mapForEachAsync;
    }
    /*eslint-enable no-extend-native*/
}
