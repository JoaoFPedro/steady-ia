import type { QueryResult } from '../api/queryApi';
import type { WorkoutReview } from './types';

export interface WorkoutReviewStorage {
  read(): Promise<WorkoutReview | null>;
  write(review: WorkoutReview): Promise<void>;
  clear(): Promise<void>;
}

export interface LatestWorkoutReviewReader {
  latestWorkoutReview(): Promise<QueryResult<WorkoutReview>>;
}

export type CachedWorkoutReviewResult =
  | { status: 'ok'; data: WorkoutReview; stale: boolean }
  | { status: 'empty' | 'failure' | 'unauthenticated' };

export class WorkoutReviewCache {
  constructor(
    private readonly storage: WorkoutReviewStorage,
    private readonly reader: LatestWorkoutReviewReader,
  ) {}

  async load(): Promise<CachedWorkoutReviewResult> {
    const remote = await this.reader.latestWorkoutReview();
    if (remote.status === 'ok') {
      await this.storage.write(remote.data);
      return { status: 'ok', data: remote.data, stale: false };
    }
    if (remote.status === 'unauthenticated') return { status: 'unauthenticated' };
    const cached = await this.storage.read();
    return cached === null
      ? { status: remote.status === 'failure' ? 'failure' : 'empty' }
      : { status: 'ok', data: cached, stale: true };
  }

  clear(): Promise<void> { return this.storage.clear(); }
}
