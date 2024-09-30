'use client';

const isClient = typeof window !== 'undefined';

export const saveToLocalStorage = (key: string, value: unknown) => {
	if (isClient) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error('Error saving to localStorage:', error);
		}
	}
};

export const loadFromLocalStorage = (key: string, defaultValue: unknown) => {
	if (isClient) {
		try {
			const value = localStorage.getItem(key);
			if (value === null) {
				return defaultValue;
			}
			return JSON.parse(value);
		} catch (error) {
			console.error('Error loading from localStorage:', error);
			return defaultValue;
		}
	}
	return defaultValue;
};