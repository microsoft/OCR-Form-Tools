// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import Guard from "./guard";

const ALGO = "AES-CBC";

/**
 * Generates a random base64 encoded key to be used for encryption
 * @param keySize The key size to use, defaults to 32bit
 */
export function generateKey(): string {
    const random = crypto.getRandomValues(new Uint8Array(32));
    return encodeBase64(random.buffer);
}

/**
 * Encrypts the specified message with the provided key
 * @param message The message to encrypt
 * @param secret The base64 encoded secret
 */
export async function encrypt(message: string, secret: string): Promise<string> {
    Guard.empty(message);
    Guard.empty(secret);

    try {
        const secretBytes = decodeBase64(secret);
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const key = await importKey(secretBytes);
        const data = encodeUtf8(message);
        const encrypted = await crypto.subtle.encrypt(
            {
                name: ALGO,
                iv,
            },
            key,
            data);
        const json = {
            ciphertext: encodeHex(encrypted),
            iv: encodeHex(iv.buffer),
        };
        const bytes = encodeUtf8(JSON.stringify(json));
        return encodeBase64(bytes);
    } catch (e) {
        throw new Error(`Error encrypting data - ${e.message}`);
    }
}

/**
 * Encryptes a javascript object with the specified key
 * @param message - The javascript object to encrypt
 * @param secret - The secret to encrypt the message
 */
export async function encryptObject(message: any, secret: string) {
    Guard.null(message);

    return await encrypt(JSON.stringify(message), secret);
}

/**
 * Decrypts the specified message with the provided key
 * @param encodedMessage The base64 encoded encrypted data
 * @param secret The base64 encoded secret
 */
export async function decrypt(encodedMessage: string, secret: string) {
    Guard.empty(encodedMessage);
    Guard.empty(secret);

    try {
        const secretBytes = decodeBase64(secret);
        const json = decodeUtf8(decodeBase64(encodedMessage));
        const params = JSON.parse(json);
        const iv = decodeHex(params.iv);
        const data = decodeHex(params.ciphertext);
        const key = await importKey(secretBytes);
        const decrypted = await crypto.subtle.decrypt(
            {
                name: ALGO,
                iv: iv.slice(0, 16),
            },
            key,
            data);

        return decodeUtf8(decrypted);
    } catch (e) {
        throw new Error(`Error decrypting data - ${e.message}`);
    }
}
/**
 * Decryptes a javascript object with the specified key
 * @param message - The encrypted base64 encded message
 * @param secret - The secret to decrypt the message
 */
export async function decryptObject<T = any>(encodedMessage: string, secret: string) {
    const json = await decrypt(encodedMessage, secret);
    return JSON.parse(json) as T;
}

export async function sha256Hash(message: string, nodejsMode?: boolean) {
    if (nodejsMode) {
        const nodejsCrypto = await require('crypto');
        return await nodejsCrypto.createHash('sha256').update(message).digest("hex");
    } else {
        const buffer = await crypto.subtle.digest("SHA-256", encodeUtf8(message));
        return encodeHex(buffer);
    }
}

async function importKey(secretBytes: ArrayBuffer) {
    return await crypto.subtle.importKey(
        "raw",
        secretBytes,
        ALGO,
        false,
        ["encrypt", "decrypt"]);
}

function encodeBase64(buffer: ArrayBuffer) {
    const base64 = [];
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        base64.push(String.fromCharCode(bytes[i]));
    }
    return window.btoa(base64.join(""));
}

function decodeBase64(base64: string) {
    const codes = window.atob(base64);
    const bytes = new Uint8Array(codes.length);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        bytes[i] = codes.charCodeAt(i);
    }
    return bytes.buffer;
}

function encodeHex(buffer: ArrayBuffer) {
    const hex  = [];
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        const code = bytes[i].toString(16);
        if (code.length === 1) {
            hex.push(`0${code}`);
        } else {
            hex.push(code);
        }
    }
    return hex.join("");
}

function decodeHex(hex: string) {
    const len = hex.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
}

function encodeUtf8(utf8: string) {
    if (typeof TextEncoder !== "undefined") {
        const encoder = new TextEncoder();
        return encoder.encode(utf8).buffer;
    }

    // Edge has no TextEncoder
    const len = utf8.length;
    let pos = -1;
    const bytes = new Uint8Array(len * 3);
    for (let point = 0, nextcode = 0, i = 0; i !== len; ) {
        point = utf8.charCodeAt(i++);
        if (point >= 0xd800 && point <= 0xdbff) {
            if (i === len) {
                bytes[++pos] = 0xef;
                bytes[++pos] = 0xbf;
                bytes[++pos] = 0xbd;
                break;
            }
            nextcode = utf8.charCodeAt(i);
            if (nextcode >= 0xdc00 && nextcode <= 0xdfff) {
                point = (point - 0xd800) * 0x400 + nextcode - 0xdc00 + 0x10000;
                i += 1;
                if (point > 0xffff) {
                    bytes[++pos] = (0x1e << 3) | (point >>> 18);
                    bytes[++pos] = (0x2 << 6) | ((point >>> 12) & 0x3f);
                    bytes[++pos] = (0x2 << 6) | ((point >>> 6) & 0x3f);
                    bytes[++pos] = (0x2 << 6) | (point & 0x3f);
                    continue;
                }
            } else {
                bytes[++pos] = 0xef;
                bytes[++pos] = 0xbf;
                bytes[++pos] = 0xbd;
                continue;
            }
        }
        if (point <= 0x007f) {
            bytes[++pos] = (0x0 << 7) | point;
        } else if (point <= 0x07ff) {
            bytes[++pos] = (0x6 << 5) | (point >>> 6);
            bytes[++pos] = (0x2 << 6)  | (point & 0x3f);
        } else {
            bytes[++pos] = (0xe << 4) | (point >>> 12);
            bytes[++pos] = (0x2 << 6) | ((point >>> 6) & 0x3f);
            bytes[++pos] = (0x2 << 6) | (point & 0x3f);
        }
    }
    return bytes.subarray(0, pos + 1);
}

function decodeUtf8(buffer: ArrayBuffer) {
    if (typeof TextDecoder !== "undefined") {
        const decoder = new TextDecoder();
        return decoder.decode(buffer);
    }

    // Edge has no TextDecoder
    const utf8 = [];
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len;) {
        const b = bytes[i++];

        if (b < 0x7f) {
            utf8.push(String.fromCharCode(b));
        } else if (b <= 0xdf) {
            utf8.push(String.fromCharCode(
                ((b & 0x1f) << 6) | (bytes[i++] & 0x3f)));
        } else if (b <= 0xef) {
            utf8.push(String.fromCharCode(
                ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f)));
        } else if (String.fromCodePoint) {
            utf8.push(String.fromCodePoint(
                ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f)));
        } else {
            utf8.push("?");
            i += 3;
        }
    }
    return utf8.join("");
}
