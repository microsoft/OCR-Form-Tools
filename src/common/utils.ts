// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Guard from "./guard";
import { IProject, ISecurityToken, IProviderOptions, ISecureString, ITag, FieldType, FieldFormat } from "../models/applicationState";
import { encryptObject, decryptObject, encrypt, decrypt } from "./crypto";
import UTIF from "utif";
import { useState, useEffect } from 'react';
import {constants} from "./constants";
import _ from "lodash";
import JsZip from 'jszip';
import { match, compile, pathToRegexp } from "path-to-regexp";

// tslint:disable-next-line:no-var-requires
const tagColors = require("../react/components/common/tagColors.json");

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
    const allPromises: Promise<any>[] = [];
    const runningPromises: Promise<any>[] = [];
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
    return new Promise<void>((resolve) => {
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
            const rotatedImage = renderRotatedImageToCanvas(img, 0);
            resolve(rotatedImage);
        };
        img.crossOrigin = "anonymous";
        img.onerror = reject;
        img.src = imageUrl;
    });
}

export function resizeCanvas(canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number) {
    const widthRatio = (canvas.width > maxWidth) ? maxWidth / canvas.width : 1;
    const heightRatio = (canvas.height > maxHeight) ? maxHeight / canvas.height : 1;
    const ratio = Math.min(widthRatio, heightRatio);
    const canvasCopy = document.createElement("canvas");
    const copyContext = canvasCopy.getContext("2d");
    canvasCopy.width = canvas.width * ratio;
    canvasCopy.height = canvas.height * ratio;
    copyContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, canvasCopy.width, canvasCopy.height);
    return canvasCopy;
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

export function getNextColor(tags: ITag[]): string {
    if (tags.length <= tagColors.length - 1) {
        for (const color of tagColors) {
            let vacancy = true;
            for (const tag of tags) {
                if (color.toLowerCase() === tag.color.toLowerCase()) {
                    vacancy = false;
                    break;
                }
            }
            if (vacancy) {
                return color;
            }
        }
    }
    return tagColors[randomIntInRange(0, tagColors.length - 1)];
}

export function getSasFolderString(sas:string): string {
    return sas.substr(0, sas.indexOf("?"))
}


export function fixedEncodeURIComponent(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
      return '%' + c.charCodeAt(0).toString(16)
    })
}


/**
 * Filters tag's format according to chosen tag's type
 * @param FieldType The json object
 * @returns [] of corresponding tag's formats
 */
export function filterFormat(type: FieldType | string): any[] {
    switch (type) {
        case FieldType.String:
            return [
                FieldFormat.NotSpecified,
                FieldFormat.Alphanumeric,
                FieldFormat.NoWhiteSpaces,
            ];
        case FieldType.Number:
            return [
                FieldFormat.NotSpecified,
                FieldFormat.Currency,
            ];
        case FieldType.Date:
            return [
                FieldFormat.NotSpecified,
                FieldFormat.DMY,
                FieldFormat.MDY,
                FieldFormat.YMD,
            ];
        case FieldType.Object:
        case FieldType.Array:
            return [
                FieldFormat.NotSpecified,
            ];
        default:
            return [ FieldFormat.NotSpecified ];
    }
}

/**
 * UseDebounce - custom React hook for handling fast changing values, the hook re-call only if value or delay changes
 * @param value The value to be changed
 * @param delay - delay after which the change will be registered in milliseconds
 */
export function useDebounce(value: any, delay: number) {
        const [debouncedValue, setDebouncedValue] = useState(value);
        useEffect(
          () => {
            // Update debounced value after delay
            const delayHandler = setTimeout(() => {
              setDebouncedValue(value);
            }, delay);
            // cleanup
            return () => {
              clearTimeout(delayHandler);
            };
          },
          [value, delay]
        );
        return debouncedValue;
      }
export function getAPIVersion(projectAPIVersion: string): string {
    return (constants.enableAPIVersionSelection && projectAPIVersion) ? projectAPIVersion : constants.apiVersion;
}


/**
 * Poll function to repeatly check if request succeeded
 * @param func - function that will be called repeatly
 * @param timeout - timeout
 * @param interval - interval
 */
export function poll(func, timeout, interval): Promise<any> {
    const endTime = Number(new Date()) + (timeout || 10000);
    interval = interval || 100;

    const checkSucceeded = (resolve, reject) => {
        const ajax = func();
        ajax.then((response) => {
            if (response.data.status.toLowerCase() === constants.statusCodeSucceeded) {
                resolve(response.data);
            } else if (response.data.status.toLowerCase() === constants.statusCodeFailed) {
                reject(_.get(
                    response,
                    "data.analyzeResult.errors[0].errorMessage",
                    "Generic error during prediction"));
            } else if (Number(new Date()) < endTime) {
                // If the request isn't succeeded and the timeout hasn't elapsed, go again
                setTimeout(checkSucceeded, interval, resolve, reject);
            } else {
                // Didn't succeeded after too much time, reject
                reject("Timed out, please try other file.");
            }
        });
    };

    return new Promise(checkSucceeded);
}

/**
 * download data as json file
 * @param data
 * @param fileName
 * @param prefix
 */
export function downloadFile(data: any, fileName: string, prefix?: string): void {
    const fileURL = window.URL.createObjectURL(new Blob([data]));
    const fileLink = document.createElement("a");
    const downloadFileName = prefix + "Result-" + fileName ;

    fileLink.href = fileURL;
    fileLink.setAttribute("download", downloadFileName);
    document.body.appendChild(fileLink);
    fileLink.click();
}

export function  getTagCategory (tagType: string) {
    switch (tagType) {
        case FieldType.SelectionMark:
        case "checkbox":
            return "checkbox";
            case FieldType.Object:
                return FieldType.Object;
            case FieldType.Array:
                return FieldType.Array;
        default:
            return "text";
    }
}

export type zipData = {
    fileName: string;
    data: any;
}

export function downloadZipFile(data: zipData[], fileName: string): void {
    const zip = new JsZip();
    data.forEach(item => {
        zip.file(item.fileName, item.data);
    })
    zip.generateAsync({type: "blob"}).then(content => {
        const fileLink = document.createElement("a");
        fileLink.href = window.URL.createObjectURL(content);
        fileLink.setAttribute("download", fileName+".zip");
        document.body.appendChild(fileLink);
        fileLink.click();
    });
}

export class URIUtils {

    public static normalizePath(path: string): string {
        return "/" + path.replace(/(\r\n|\n|\r)/gm, "").replace(/^\/+/, "");
    }

    public static matchPath(pathTemplate: string, path: string): object {
        const matcher = match(pathTemplate, { decode: decodeURIComponent });
        const result = matcher(path)
        return (result && result.params) || {};
    }

    public static compilePath(pathTemplate: string, params: object, defaultPathParams: object): string {
        /* Add required default key, value pairs for the "toPath" function into a cloned params object. */
        const withDefaultParams = (pathTemplate: string, params: object, defaultPathParams: object): object => {
            const requiredKeys = [];
            const retParams = {...params};
            pathToRegexp(pathTemplate, requiredKeys);
            for (const { name } of requiredKeys) {
                if (!retParams.hasOwnProperty(name)) {
                    retParams[name] = defaultPathParams.hasOwnProperty(name) ? defaultPathParams[name] : "";
                }
            }
            return retParams;
        }
        const toPath = compile(pathTemplate, { encode: encodeURIComponent });
        return toPath(withDefaultParams(pathTemplate, params, defaultPathParams));
    }

    public static composeQueryString(params: object, blacklist = new Set<string>()) {
        const kvList = [];
        const connector = "&";
        for (const [key, value] of Object.entries(params)) {
            if (key && (value === 0 || value) && !blacklist.has(key)) {
                kvList.push(`${key}=${value}`);
            }
        }
        return kvList.join(connector);
    }

    public static matchQueryString(queryString: string) {
        const params = {};
        queryString.split("&").forEach(s => {
            const [key, value] = s.split("=");
            params[key] = value;
        });
        return params;
    }
}

export function fillTagsColor(project: IProject): IProject {
    /** Add a color to tags which tag.color == null */
    const supportedColors = new Set(tagColors);
    return {
        ...project,
        tags: project.tags.map((tag: ITag) => ({
            ...tag,
            color: supportedColors.has(tag.color) ? tag.color : getNextColor(project.tags)
        }))
    }
}
