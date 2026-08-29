import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrainingPlanDocument } from './trainingPlanDocument';
import type { SteadyTrainingPlanStorage } from './steadyTrainingPlanCache';

const KEY = '@steady/steady-training-plan';

export class AsyncStorageSteadyTrainingPlan implements SteadyTrainingPlanStorage {
  async read(): Promise<TrainingPlanDocument | null> {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as TrainingPlanDocument;
    } catch {
      await this.clear();
      return null;
    }
  }

  async write(plan: TrainingPlanDocument): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(plan));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
