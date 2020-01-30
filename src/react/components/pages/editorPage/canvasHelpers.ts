// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Static functions to assist in operations within Canvas component
 */
export default class CanvasHelpers {

    /**
     * Adds tag (and remove others) to array if it does not contain the tag,
     * @param tags Array of tags
     * @param tag Tag to add
     */
    public static setSingleTag(tags: string[], tag: string): string[] {
        return [tag];
    }

    /**
     * Adds tag to array if it does not contain the tag,
     * removes tag if already contained. Performs operations in place
     * @param tags Array of tags
     * @param tag Tag to toggle
     */
    public static toggleTag(tags: string[], tag: string): string[] {
        const tagIndex = tags.findIndex((existingTag) => existingTag === tag);
        if (tagIndex === -1) {
            // Tag isn't found within region tags, add it
            return [...tags, tag];
        } else {
            // Tag is within region tags, remove it
            return tags.filter((t) => t !== tag);
        }
    }
}
