import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CombinedDraftStorage } from './combinedWorkoutDraft';
import type { StrengthExecutionPayload } from './workoutExecution';

const STORAGE_KEY = '@steady/rascunho-treino-combinado';

export class AsyncStorageCombinedDraft implements CombinedDraftStorage {
  async read(): Promise<StrengthExecutionPayload | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as StrengthExecutionPayload;
    } catch {
      return null;
    }
  }

  write(value: StrengthExecutionPayload): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
