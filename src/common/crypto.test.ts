// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { generateKey, encrypt, decrypt, encryptObject, decryptObject } from "./crypto";

describe("Crypto", () => {
    it("generates a key", () => {
        const key = generateKey();
        expect(key).not.toBeNull();
    });

    it("generates a random key without collisions", () => {
        const iterationMap: any = {};

        for (let i = 0; i < 10000; i++) {
            const key = generateKey();
            if (iterationMap[key]) {
                fail("Not unique value generated");
            }
            iterationMap[key] = true;
        }
    });

    it("encrypts & decrypts a value with correct key matches", async () => {
        const expected = "Hello, I am a string";
        const secret = generateKey();

        const encrypted = await encrypt(expected, secret);
        const decrypted = await decrypt(encrypted, secret);

        expect(expected).toEqual(decrypted);
    });

    it("encrypts & decrypts a value with incorrect key does not match", async () => {
        const expected = "Hello, I am a string";
        const encryptKey = generateKey();
        const decryptKey = "some random key";

        try {
            const encrypted = await encrypt(expected, encryptKey);
            const decrypted = await decrypt(encrypted, decryptKey);
            expect(expected).not.toEqual(decrypted);
        } catch (e) {
            expect(e.message).toEqual("Error decrypting data - Malformed UTF-8 data");
        }
    });

    it("encrypts the same value multiple times generates different encrypted data which can both be decrypted",
    async () => {
        const expected = "Hello, I am a string";
        const secret = generateKey();

        // Encryption using a random IV which generates different
        // encrypted values that are still compatibile with the secret
        const encrypted1 = await encrypt(expected, secret);
        const encrypted2 = await encrypt(expected, secret);

        expect(encrypted1).not.toEqual(encrypted2);

        // Both encrypted values can still be decrypted with the same secret
        const decrypted1 = await decrypt(encrypted1, secret);
        const decrypted2 = await decrypt(encrypted2, secret);

        expect(decrypted1).toEqual(decrypted2);
    });

    it("encryption fails with malformed message", () => {
        const secret = generateKey();

        expect(async () => await decrypt("ABC123XYZSDAFASDFS23453", secret)).toThrowError();
    });

    it("encrypts and decrypts a javascript object", async () => {
        const secret = generateKey();
        const original = {
            firstName: "John",
            lastName: "Doe",
            active: true,
            age: 30,
        };

        const encrypted = await encryptObject(original, secret);
        const decrypted = await decryptObject(encrypted, secret);

        expect(original).toEqual(decrypted);
    });

    it("decrypt object fails with invalid key", async () => {
        const key1 = generateKey();
        const key2 = generateKey();
        const original = {
            firstName: "John",
            lastName: "Doe",
            active: true,
            age: 30,
        };

        const encrypted = await encryptObject(original, key1);
        expect(async () => await decryptObject(encrypted, key2)).toThrowError();
    });
});
