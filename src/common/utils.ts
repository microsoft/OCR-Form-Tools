// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Guard from "./guard";
import { IProject, ISecurityToken, IProviderOptions, ISecureString } from "../models/applicationState";
import { encryptObject, decryptObject, encrypt, decrypt } from "./crypto";
import UTIF from "utif";
import HtmlFileReader from "./htmlFileReader";

/**
 * Generates a random integer in provided range
 * @param min Lower bound of random number generation - INCLUSIVE
 * @param max Upper bound of random number generation - EXCLUSIVE
 */
export function randomIntInRange(min: number, max: number) {
    if (min > max) {
        throw new Error(`min (${min}) can't be bigger than max (${max})`);
    }

    if (min === max) {
        return min;
    }

    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

/**
 * Common key codes used throughout application
 */
export const KeyCodes = {
    comma: 188,
    enter: 13,
    backspace: 8,
    ctrl: 17,
    shift: 16,
    tab: 9,
};

/**
 * Generates a query string from the key/values of a JSON object
 * @param object The json object
 * @returns A value representing a URL compatible query string
 */
export function createQueryString(object: any): string {
    Guard.null(object);

    const parts: any[] = [];

    for (const key of Object.getOwnPropertyNames(object)) {
        parts.push(`${key}=${encodeURIComponent(object[key])}`);
    }

    return parts.join("&");
}

export function encodeFileURI(path: string, additionalEncodings?: boolean): string {
    // encodeURI() will not encode: ~!@#$&*()=:/,;?+'
    // extend it to support all of these except # and ?
    // all other non encoded characters are implicitly supported with no reason to encoding them
    const matchString = /(#|\?)/g;
    const encodings = {
        // eslint-disable-next-line
        "\#": "%23",
        // eslint-disable-next-line
        "\?": "%3F",
    };
    const encodedURI = `file:${encodeURI(normalizeSlashes(path))}`;
    if (additionalEncodings) {
        return encodedURI.replace(matchString, (match) => encodings[match]);
    }
    return encodedURI;
}

export function normalizeSlashes(path: string): string {
    return path.replace(/\\/g, "/");
}

/**
 * Encrypts sensitive settings for the specified project and returns the result
 * @param project The project to encrypt
 * @param securityToken The security token used to encrypt the project
 */
export async function encryptProject(project: IProject, securityToken: ISecurityToken) {
    const encrypted: IProject = {
        ...project,
        sourceConnection: { ...project.sourceConnection },
    };

    encrypted.sourceConnection.providerOptions =
        await encryptProviderOptions(project.sourceConnection.providerOptions, securityToken.key);

    encrypted.apiKey = await encryptString(project.apiKey, securityToken.key);

    return encrypted;
}

/**
 * Decrypts sensitive settings for the specified project and return the result
 * @param project The project to decrypt
 * @param securityToken The security token used to decrypt the project
 */
export async function decryptProject(project: IProject, securityToken: ISecurityToken) {
    const decrypted: IProject = {
        ...project,
        sourceConnection: { ...project.sourceConnection },
    };

    decrypted.sourceConnection.providerOptions =
        await decryptProviderOptions(decrypted.sourceConnection.providerOptions, securityToken.key);

    decrypted.apiKey = await decryptString(project.apiKey, securityToken.key);

    return decrypted;
}

async function encryptProviderOptions(providerOptions: IProviderOptions | ISecureString, secret: string) {
    if (!providerOptions) {
        return null;
    }

    if (providerOptions.encrypted) {
        return providerOptions as ISecureString;
    }

    return {
        encrypted: await encryptObject(providerOptions, secret),
    } as ISecureString;
}

async function decryptProviderOptions<T = IProviderOptions>(
    providerOptions: IProviderOptions | ISecureString,
    secret: string) {
    const secureString = providerOptions as ISecureString;
    if (!(secureString && secureString.encrypted)) {
        return providerOptions as T;
    }

    return await decryptObject(providerOptions.encrypted, secret) as T;
}

async function encryptString(str: string | ISecureString, secret: string) {
    if (!str) {
        return undefined;
    }

    const secureString = str as ISecureString;
    if (secureString && secureString.encrypted) {
        return secureString;
    }

    return {
        encrypted: await encrypt(str as string, secret),
    } as ISecureString;
}

async function decryptString(str: string | ISecureString, secret) {
    const secureString = str as ISecureString;
    if (!(secureString && secureString.encrypted)) {
        return str as string;
    }

    return await decrypt(secureString.encrypted, secret) as string;
}

export async function throttle<T>(max: number, arr: T[], worker: (payload: T) => Promise<any>) {
    const allPromises: Array<Promise<any>> = [];
    const runningPromises: Array<Promise<any>> = [];
    let i = 0;
    while (i < arr.length) {
        const payload = arr[i];
        i++;
        const promise = worker(payload);
        promise.then((result) => {
            runningPromises.splice(runningPromises.indexOf(promise), 1);
            return result;
        }).catch((err) => {
            runningPromises.splice(runningPromises.indexOf(promise), 1);
            throw err;
        });
        runningPromises.push(promise);
        allPromises.push(promise);

        if (runningPromises.length >= max) {
            // Wait until any one task is finished (resolved or rejected).
            await Promise.race(runningPromises).catch();
        }
    }

    return Promise.all(allPromises);
}

export function delay(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

export function parseTiffData(tiffData: ArrayBuffer): any[] {
    const tiffImages = UTIF.decode(tiffData);
    for (const tiffImage of tiffImages) {
        UTIF.decodeImage(tiffData, tiffImage);
    }

    return tiffImages;
}

export function renderTiffToCanvas(tiffImage): HTMLCanvasElement {
    const rgbData = new Uint8ClampedArray(UTIF.toRGBA8(tiffImage).buffer);
    const imageData = new ImageData(rgbData, tiffImage.width, tiffImage.height);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = tiffImage.height;
    canvas.width = tiffImage.width;
    context.putImageData(imageData, 0, 0);

    return canvas;
}

export async function loadImageToCanvas(imageUrl: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img: HTMLImageElement = document.createElement("img");
        img.onload = async () => {
            const orientation = await HtmlFileReader.readImageOrientation(img);
            const rotatedImage = renderRotatedImageToCanvas(img, orientation);
            resolve(rotatedImage);
        };
        img.crossOrigin = "anonymous";
        img.onerror = reject;
        img.src = imageUrl;
    });
}

export function renderRotatedImageToCanvas(image: HTMLImageElement, orientation: number): HTMLCanvasElement {
    const width = image.width;
    const height = image.height;

    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    if (orientation > 4) {
        canvas.width = height;
        canvas.height = width;
    }

    const ctx = canvas.getContext("2d");
    switch (orientation) {
        case 2:
            // horizontal flip
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            break;

        case 3:
            // 180° rotate left
            ctx.translate(width, height);
            ctx.rotate(Math.PI);
            break;

        case 4:
            // vertical flip
            ctx.translate(0, height);
            ctx.scale(1, -1);
            break;

        case 5:
            // vertical flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break;

        case 6:
            // 90° rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -height);
            break;

        case 7:
            // horizontal flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(width, -height);
            ctx.scale(-1, 1);
            break;

        case 8:
            // 90° rotate left
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-width, 0);
            break;
    }
    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
}

export function joinPath(seperator: string, ...paths: string[]) {
    const leadingSeperator = (paths && paths[0] && paths[0][0] === seperator) ? seperator : "";
    const joined = paths.join(seperator);
    const parts = joined.split(seperator);
    const normalized = parts.filter((p) => p && p.trim() !== "").join(seperator);
    return leadingSeperator + normalized;
}

export function patch<T, K extends keyof T>(data: T[], diff: T[], key: K, properties: K[]): T[] {
    return data.map((item) => {
        const change = diff.find((i) => i[key] === item[key]);
        if (change) {
            const update = {...item};
            properties.forEach((p) => update[p] = change[p]);
            return update;
        }
        return item;
    });
}
