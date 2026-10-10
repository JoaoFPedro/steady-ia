import { WorkoutReviewCache, type WorkoutReviewStorage } from '../workoutReviewCache';
import type { WorkoutReview } from '../types';

const review = { id: 'review-1' } as WorkoutReview;

class MemoryStorage implements WorkoutReviewStorage {
  constructor(public value: WorkoutReview | null = null) {}
  read = async () => this.value;
  write = async (value: WorkoutReview) => { this.value = value; };
  clear = async () => { this.value = null; };
}

describe('cache da revisão mais recente', () => {
  it('persiste a revisão recebida do servidor', async () => {
    const storage = new MemoryStorage();
    const cache = new WorkoutReviewCache(storage, {
      latestWorkoutReview: async () => ({ status: 'ok', data: review }),
    });
    expect(await cache.load()).toEqual({ status: 'ok', data: review, stale: false });
    expect(storage.value).toBe(review);
  });

  it('usa a última revisão apenas como stale quando a rede falha', async () => {
    const cache = new WorkoutReviewCache(new MemoryStorage(review), {
      latestWorkoutReview: async () => ({ status: 'failure' }),
    });
    expect(await cache.load()).toEqual({ status: 'ok', data: review, stale: true });
  });

  it('não usa cache depois da perda de sessão', async () => {
    const cache = new WorkoutReviewCache(new MemoryStorage(review), {
      latestWorkoutReview: async () => ({ status: 'unauthenticated' }),
    });
    expect(await cache.load()).toEqual({ status: 'unauthenticated' });
  });

  it('apaga dados de saúde armazenados ao sair da conta', async () => {
    const storage = new MemoryStorage(review);
    const cache = new WorkoutReviewCache(storage, {
      latestWorkoutReview: async () => ({ status: 'failure' }),
    });
    await cache.clear();
    expect(storage.value).toBeNull();
  });
});
