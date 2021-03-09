import * as localforage from "localforage";
import { toast } from "react-toastify";

class WebStorage {
    private isStorageReady: boolean = false;

    constructor() {
        localforage.config({
            name: "FOTT-webStorage",
            driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
        });
    }

    private async waitForStorageReady() {
        if (!this.isStorageReady) {
            try {
                await localforage.ready();
                this.isStorageReady = true;
            } catch (error) {
                toast.error(`No usable storage driver is found.`);
            }
        }
    }

    public async getItem(key: string) {
        try {
            await this.waitForStorageReady();
            return await localforage.getItem(key);
        } catch (err) {
            toast.error(`WebStorage getItem("${key}") error: ${err}`);
        }
    }

    public async setItem(key: string, value: any) {
        try {
            await this.waitForStorageReady();
            await localforage.setItem(key, value);
        } catch (err) {
            toast.error(`WebStorage setItem("${key}") error: ${err}`);
        }
    }

    public async removeItem(key: string) {
        try {
            await this.waitForStorageReady();
            await localforage.removeItem(key);
        } catch (err) {
            toast.error(`WebStorage removeItem("${key}") error: ${err}`);
        }
    }
}

export const webStorage = new WebStorage();
