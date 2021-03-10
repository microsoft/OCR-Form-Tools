import { webStorage } from "../common/webStorage";

export default class UseLocalStorage {
    public static setItem = async (name: string, key: string, value: string) => {
        // Get the existing data
        const existingData = await webStorage.getItem(name) as string;

        // If no existing data, create an {}
        // Otherwise, convert the localStorage string to an {}
        const newLsData: {} = existingData ? JSON.parse(existingData) : {};

        // Add new data to localStorage {}
        newLsData[key] = value;

        // Save back to localStorage
        webStorage.setItem(name, JSON.stringify(newLsData));
    }
}
