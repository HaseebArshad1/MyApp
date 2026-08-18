/**
 * Local persistence for the home screen tap counter.
 *
 * @format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = '@MyApp:tapCount';

export async function loadCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return 0;
    }
    const parsed = parseInt(stored, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

export async function saveCount(count: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, String(count));
}
