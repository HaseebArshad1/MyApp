/**
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = '@MyApp:tapCount';

/**
 * Reads the persisted tap count. Falls back to 0 when there is no stored
 * value, the stored value is not a number, or the underlying storage read
 * throws.
 */
export async function loadCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return 0;
    }
    const parsed = parseInt(stored, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    return 0;
  }
}

/**
 * Persists the tap count.
 */
export async function saveCount(count: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, String(count));
}
