import { loadLatestWorkoutState } from '../latestWorkoutState';
import type { TrainingSessionSummary } from '../../api/queryApi';

const run: TrainingSessionSummary = {
  id: 'run', kind: 'running', date: '2026-10-10', registeredAt: '2026-10-10T09:00:00Z',
  durationMinutes: 30, distanceKm: 5, perceivedEffort: 4, muscleGroup: null, intensity: null, workoutType: null,
};
const strength: TrainingSessionSummary = {
  id: 'strength', kind: 'strength', date: '2026-10-11', registeredAt: '2026-10-11T09:00:00Z',
  durationMinutes: 40, distanceKm: null, perceivedEffort: null, muscleGroup: 'Ombro', intensity: 'Leve', workoutType: null,
};

describe('dashboard: últimos treinos — STORY-024', () => {
  it('carrega o último treino de cada modalidade do histórico autenticado', async () => {
    const view = await loadLatestWorkoutState({ trainingHistory: async () => ({ status: 'ok', data: [run, strength] }) });
    expect(view.status).toBe('loaded');
    if (view.status !== 'loaded') throw new Error('Estado inesperado');
    expect(view.workouts.running?.id).toBe('run');
    expect(view.workouts.strength?.id).toBe('strength');
  });
});

describe('registros pendentes na dashboard — STORY-024', () => {
  it('mostra a corrida pendente quando ela é mais recente que o histórico consultado', async () => {
    const queue = { pending: async () => [{
      idempotencyKey: 'key', kind: 'running' as const, queuedAt: '2026-10-12T10:00:00Z',
      payload: { date: '2026-10-12', distanceKm: 8, durationMinutes: 48, averagePaceMinPerKm: 6, perceivedEffort: 5 },
    }] };
    const view = await loadLatestWorkoutState(
      { trainingHistory: async () => ({ status: 'ok', data: [run] }) }, queue,
    );
    expect(view.status).toBe('loaded');
    if (view.status !== 'loaded') throw new Error('Estado inesperado');
    expect(view.workouts.running).toMatchObject({ date: '2026-10-12', pending: true });
  });
});

describe('registro combinado e falha de leitura — STORY-024', () => {
  it('representa uma corrida e uma musculação do mesmo registro pendente', async () => {
    const queue = { pending: async () => [{
      idempotencyKey: 'combined', kind: 'combinedWorkout' as const, queuedAt: '2026-10-12T10:00:00Z',
      payload: {
        running: { date: '2026-10-12', distanceKm: 5, durationMinutes: 30, averagePaceMinPerKm: 6 },
        strength: { date: '2026-10-12', workoutType: 'push' },
      },
    }] };
    const result = await loadLatestWorkoutState({ trainingHistory: async () => ({ status: 'ok', data: [] }) }, queue);
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') throw new Error('Estado inesperado');
    expect(result.workouts.running).toMatchObject({ kind: 'running', pending: true });
    expect(result.workouts.strength).toMatchObject({ kind: 'strength', pending: true });
  });

  it('não apresenta o pendente como último sem acesso ao histórico', async () => {
    const queue = { pending: async () => [{
      idempotencyKey: 'key', kind: 'running' as const, queuedAt: '2026-10-12T10:00:00Z',
      payload: { date: '2026-10-12' },
    }] };
    const result = await loadLatestWorkoutState({ trainingHistory: async () => ({ status: 'failure' }) }, queue);
    expect(result).toEqual({ status: 'unavailable' });
  });
});
