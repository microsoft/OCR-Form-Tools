export default class UseLocalStorage {
    public static setItem(name: string, key: string, value: string) {
        // Get the existing data
        const existingData = window.localStorage.getItem(name);

        // If no existing data, create an {}
        // Otherwise, convert the localStorage string to an {}
        const newLsData: {} = existingData ? JSON.parse(existingData) : {};

        // Add new data to localStorage {}
        newLsData[key] = value;

        // Save back to localStorage
        window.localStorage.setItem(name, JSON.stringify(newLsData));
    }
}
