export default class UseLocalStorage {
    public static setItem(name: string, key: string, value: string) {
        // Get the existing data
	const existingLsData = localStorage.getItem(name);

	// If no existing data, create an {}
	// Otherwise, convert the localStorage string to an {}
	const newLsData: {} = existingLsData ? JSON.parse(existingLsData) : {};

	// Add new data to localStorage {}
	newLsData[key] = value;

	// Save back to localStorage
	localStorage.setItem(name, JSON.stringify(newLsData));
    }
}
