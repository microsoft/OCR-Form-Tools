import * as localforage from "localforage";

/**
 * 
 */

window.addEventListener("load", () => {
    WebStorageManager.init();
})

export default class WebStorageManager{
    static driverIsReady: boolean;
    static init () {
        localforage.config({
            name: "FOTT-webStorage",
            driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE]
        })
    }

    static checkDriverIsReady = async () => {
        if (!WebStorageManager.driverIsReady) {
            try {
                await localforage.ready()
                WebStorageManager.driverIsReady = true;
            } catch(error) {
                console.error(`No usable storage driver is found.`);
            }
        }

    }
    static checkVolume = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const {quota, usage} = await navigator.storage.estimate();
            const percenttageUsed = (usage / quota) * 100;
            console.log(`You've used ${percenttageUsed}% of the available storage.`);
            const remaining = quota - usage;
            console.log(`You can write up to ${remaining} more bytes.`);
        }
    }
    static getItem = async (key: string) => {
        try {
            return await localforage.getItem(key);
        } catch (err) {
            console.error(`webstorage called getItem with key ${key} error`, err);
        }
    }
    static setItem = async (key: string, value: any) => {
        try {
            await localforage.getItem(key, value);
        } catch (err) {
            console.error(`webstorage called getItem with key: ${key}, value: ${value},  error`, err);
        }
    }
    static removeItem = async (key: string) => {
        try {
            await localforage.removeItem(key);
        } catch (err) {
            console.error(`webstorage called removeItem with key: ${key},  error`, err);
        }
    }
} 