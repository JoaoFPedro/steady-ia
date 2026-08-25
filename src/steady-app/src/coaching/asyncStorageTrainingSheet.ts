import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrainingSheet } from './types';
import type { TrainingSheetStorage } from './trainingSheetCache';

const KEY = '@steady/active-training-sheet';

export class AsyncStorageTrainingSheet implements TrainingSheetStorage {
  async read(): Promise<TrainingSheet | null> {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as TrainingSheet;
    } catch {
      await this.clear();
      return null;
    }
  }

  async write(sheet: TrainingSheet): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(sheet));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
