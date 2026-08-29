import { TrainingSheetCache, type TrainingSheetStorage } from '../trainingSheetCache';
import type { CoachingApi, RunPrescription, TrainingSheet } from '../types';

const run = (description: string): RunPrescription => ({
  description, distanceKm: null, durationMinutes: null, perceivedEffort: null,
});

const sheet = (id: string): TrainingSheet => ({
  id,
  corredorId: 'runner-1',
  createdAt: '2026-08-24T12:00:00Z',
  workouts: [
    { type: 'push', runDescriptions: null, exercises: [] },
    { type: 'pull', runDescriptions: null, exercises: [] },
    { type: 'lower', runDescriptions: null, exercises: [] },
    {
      type: 'run',
      runDescriptions: { tuesday: run('Leve'), thursday: run('Forte'), saturday: run('Longão') },
      exercises: [],
    },
  ],
});

function storage(initial: TrainingSheet | null): TrainingSheetStorage & { value: TrainingSheet | null } {
  return {
    value: initial,
    async read() { return this.value; },
    async write(value) { this.value = value; },
    async clear() { this.value = null; },
  };
}

describe('cache da ficha ativa', () => {
  it('usa a ficha em cache quando está offline', async () => {
    const local = storage(sheet('old-sheet'));
    const api = { activeTrainingSheet: jest.fn(async () => ({ status: 'failure' as const })) } as unknown as CoachingApi;

    const result = await new TrainingSheetCache(local, api).load();

    expect(result).toEqual({ status: 'ok', data: sheet('old-sheet'), stale: true });
  });

  it('substitui o cache quando uma ficha nova chega do servidor', async () => {
    const local = storage(sheet('old-sheet'));
    const api = {
      activeTrainingSheet: jest.fn(async () => ({ status: 'ok' as const, data: sheet('new-sheet') })),
    } as unknown as CoachingApi;

    const result = await new TrainingSheetCache(local, api).load();

    expect(result).toEqual({ status: 'ok', data: sheet('new-sheet'), stale: false });
    expect(local.value?.id).toBe('new-sheet');
  });

  it('não inventa ficha quando não há servidor nem cache', async () => {
    const local = storage(null);
    const api = { activeTrainingSheet: jest.fn(async () => ({ status: 'failure' as const })) } as unknown as CoachingApi;

    await expect(new TrainingSheetCache(local, api).load()).resolves.toEqual({ status: 'failure' });
  });

  it('não exibe o cache quando a sessão foi perdida', async () => {
    const local = storage(sheet('old-sheet'));
    const api = {
      activeTrainingSheet: jest.fn(async () => ({ status: 'unauthenticated' as const })),
    } as unknown as CoachingApi;

    await expect(new TrainingSheetCache(local, api).load())
      .resolves.toEqual({ status: 'unauthenticated' });
  });
});
