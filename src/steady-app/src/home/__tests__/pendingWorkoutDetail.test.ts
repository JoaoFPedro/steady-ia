import { pendingWorkoutDetail } from '../pendingWorkoutDetail';
import type { PendingRecord } from '../../sync/types';
import type { TrainingSheet } from '../../coaching/types';

/**
 * Cenário "Abrir treino pendente" (specs/STORY-025): o registro ainda está na
 * fila, então o detalhe sai dos dados locais. A fila guarda só ids de exercício
 * e carga — nome, séries e repetições vêm da ficha em cache, quando ela é a
 * mesma em que o treino foi feito. Sem essa certeza, a lista não é inventada.
 */

const SHEET: TrainingSheet = {
  id: 'sheet-1', corredorId: 'c', createdAt: '2026-10-01T00:00:00Z',
  workouts: [{
    type: 'push', runDescriptions: null,
    exercises: [
      { id: 'ex-1', name: 'Supino reto', sets: 3, repetitions: 10, suggestedLoadKg: 20, durationSeconds: null, observation: null },
      { id: 'ex-2', name: 'Crucifixo', sets: 3, repetitions: 12, suggestedLoadKg: null, durationSeconds: null, observation: null },
    ],
  }],
};

const fichaRecord = (overrides: Record<string, unknown> = {}): PendingRecord => ({
  idempotencyKey: 'key-1', kind: 'strengthWorkout', queuedAt: '2026-10-30T10:00:00Z',
  payload: {
    trainingSheetId: 'sheet-1', workoutType: 'push', date: '2026-10-30',
    exercises: [
      { exerciseId: 'ex-1', loadKg: 25, note: 'Banco inclinado', skipped: false },
      { exerciseId: 'ex-2', loadKg: null, note: null, skipped: true },
    ],
    ...overrides,
  },
});

describe('detalhe de treino pendente', () => {
  it('resolve nome, séries e repetições pela ficha em cache e usa a carga registrada', () => {
    const detail = pendingWorkoutDetail([fichaRecord()], 'pending:key-1:strength', SHEET);

    expect(detail).toEqual(expect.objectContaining({
      id: 'pending:key-1:strength', kind: 'strength', pending: true, workoutType: 'push', date: '2026-10-30',
      exercises: [
        { name: 'Supino reto', sets: 3, repetitions: 10, loadKg: 25, note: 'Banco inclinado', skipped: false, durationSeconds: null },
        { name: 'Crucifixo', sets: 3, repetitions: 12, loadKg: null, note: null, skipped: true, durationSeconds: null },
      ],
    }));
  });

  it('não inventa a lista quando a ficha em cache não é a do treino', () => {
    const detail = pendingWorkoutDetail([fichaRecord({ trainingSheetId: 'sheet-antiga' })], 'pending:key-1:strength', SHEET);

    expect(detail?.exercises).toBeNull();
    expect(detail?.workoutType).toBe('push');
  });

  it('não inventa a lista quando algum exercício não está na ficha ou não há ficha', () => {
    const desconhecido = fichaRecord({ exercises: [{ exerciseId: 'ex-9', loadKg: 10, note: null, skipped: false }] });

    expect(pendingWorkoutDetail([desconhecido], 'pending:key-1:strength', SHEET)?.exercises).toBeNull();
    expect(pendingWorkoutDetail([fichaRecord()], 'pending:key-1:strength', null)?.exercises).toBeNull();
  });

  it('usa a parte de musculação de um registro combinado', () => {
    const combined: PendingRecord = {
      idempotencyKey: 'key-2', kind: 'combinedWorkout', queuedAt: '2026-10-30T10:00:00Z',
      payload: {
        strength: (fichaRecord().payload as object),
        running: { date: '2026-10-30', distanceKm: 5, durationMinutes: 30, averagePaceMinPerKm: 6, perceivedEffort: 4 },
      },
    };

    const detail = pendingWorkoutDetail([combined], 'pending:key-2:strength', SHEET);

    expect(detail?.kind).toBe('strength');
    expect(detail?.exercises).toHaveLength(2);
  });

  it('abre a musculação avulsa pendente sem exercícios', () => {
    const avulsa: PendingRecord = {
      idempotencyKey: 'key-3', kind: 'strength', queuedAt: '2026-10-30T10:00:00Z',
      payload: { date: '2026-10-30', muscleGroup: 'Ombro', intensity: 'Leve', durationMinutes: 20 },
    };

    const detail = pendingWorkoutDetail([avulsa], 'pending:key-3:strength', null);

    expect(detail).toEqual(expect.objectContaining({
      pending: true, muscleGroup: 'Ombro', durationMinutes: 20, exercises: null,
    }));
  });

  it('devolve null quando o registro já sincronizou e saiu da fila', () => {
    expect(pendingWorkoutDetail([], 'pending:key-1:strength', SHEET)).toBeNull();
    expect(pendingWorkoutDetail([fichaRecord()], 'pending:outra:strength', SHEET)).toBeNull();
  });
});
