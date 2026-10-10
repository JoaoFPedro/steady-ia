import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorkoutReview } from './types';
import type { WorkoutReviewStorage } from './workoutReviewCache';

const KEY = 'steady.latest-workout-review.v1';

export class AsyncStorageWorkoutReview implements WorkoutReviewStorage {
  async read(): Promise<WorkoutReview | null> {
    const value = await AsyncStorage.getItem(KEY);
    if (value === null) return null;
    try { return JSON.parse(value) as WorkoutReview; } catch { return null; }
  }

  write(review: WorkoutReview): Promise<void> {
    return AsyncStorage.setItem(KEY, JSON.stringify(review));
  }

  clear(): Promise<void> { return AsyncStorage.removeItem(KEY); }
}
