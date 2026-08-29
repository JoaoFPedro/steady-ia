import { dailyPrescription } from '../dailyPrescription';
import type { RunPrescription, TrainingSheet } from '../types';

const run = (description: string): RunPrescription => ({
  description, distanceKm: null, durationMinutes: null, perceivedEffort: null,
});

const sheet: TrainingSheet = {
  id: 'sheet-1',
  corredorId: 'runner-1',
  createdAt: '2026-08-25T00:00:00Z',
  workouts: [
    { type: 'push', exercises: [{ id: 'p', name: 'Supino', sets: 3, repetitions: 10, suggestedLoadKg: null, durationSeconds: null, observation: null }], runDescriptions: null },
    { type: 'pull', exercises: [{ id: 'r', name: 'Remada', sets: 3, repetitions: 10, suggestedLoadKg: null, durationSeconds: null, observation: null }], runDescriptions: null },
    { type: 'lower', exercises: [{ id: 'l', name: 'Agachamento', sets: 4, repetitions: 6, suggestedLoadKg: null, durationSeconds: null, observation: null }], runDescriptions: null },
    {
      type: 'run',
      exercises: [],
      runDescriptions: {
        tuesday: run('Leve'),
        thursday: run('Intervalado'),
        saturday: {
          description: 'Longão',
          distanceKm: { min: 20, max: 22 },
          durationMinutes: null,
          perceivedEffort: null,
        },
      },
    },
  ],
};

describe('prescrição da ficha no detalhamento diário', () => {
  it.each([
    [0, 'lower', null],
    [1, 'push', 'Leve'],
    [2, 'push', null],
    [3, 'pull', 'Intervalado'],
    [4, 'lower', null],
    [5, null, 'Longão'],
    [6, null, null],
  ] as const)('mapeia o índice %i para força %s e corrida %s', (day, strength, runDescription) => {
    const result = dailyPrescription(sheet, day);

    expect(result.strength?.type ?? null).toBe(strength);
    expect(result.run?.description ?? null).toBe(runDescription);
  });

  it('preserva os campos numéricos opcionais da corrida prescrita', () => {
    const result = dailyPrescription(sheet, 5);

    expect(result.run?.distanceKm).toEqual({ min: 20, max: 22 });
    expect(result.run?.durationMinutes).toBeNull();
  });

  it('sem ficha não inventa treino a partir do documento estático', () => {
    expect(dailyPrescription(null, 0)).toEqual({ strength: null, run: null });
  });
});
