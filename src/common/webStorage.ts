import * as localforage from "localforage";

class WebStorage {
    private driverIsReady: boolean = false;

    constructor() {
        localforage.config({
            name: "FOTT-webStorage",
            driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
        });
    }

    private async checkDriverIsReady() {
        if (!this.driverIsReady) {
            try {
                await localforage.ready();
                this.driverIsReady = true;
            } catch (error) {
                console.error(`No usable storage driver is found.`);
            }
        }
    }

    private async checkVolume() {
        if (navigator.storage && navigator.storage.estimate) {
            const { quota, usage } = await navigator.storage.estimate();
            const percenttageUsed = (usage / quota) * 100;
            console.log(
                `You've used ${percenttageUsed}% of the available storage.`
            );
            const remaining = quota - usage;
            console.log(`You can write up to ${remaining} more bytes.`);
        }
    }

    public async getItem(key: string) {
        try {
            return await localforage.getItem(key);
        } catch (err) {
            console.error(
                `webstorage called getItem with key ${key} error`,
                err
            );
        }
    }

    public async setItem(key: string, value: any) {
        try {
            await localforage.setItem(key, value);
        } catch (err) {
            console.error(
                `webstorage called setItem with key: ${key}, value: ${value},  error`,
                err
            );
        }
    }

    public async removeItem(key: string) {
        try {
            await localforage.removeItem(key);
        } catch (err) {
            console.error(
                `webstorage called removeItem with key: ${key},  error`,
                err
            );
        }
    }
}

export const webStorage = new WebStorage();