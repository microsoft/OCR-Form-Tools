import webStorageManager from "../common/webStorageManager";

export default class UseLocalStorage {
    public static setItem = async (name: string, key: string, value: string) => {
        // Get the existing data
        const existingData = await webStorageManager.getItem(name);

        // If no existing data, create an {}
        // Otherwise, convert the localStorage string to an {}
        const newLsData: {} = existingData ? JSON.parse(existingData) : {};

        // Add new data to localStorage {}
        newLsData[key] = value;

        // Save back to localStorage
        webStorageManager.setItem(name, JSON.stringify(newLsData));
    }
}
