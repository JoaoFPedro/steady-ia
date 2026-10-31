import { loadWorkoutDetail } from '../loadWorkoutDetail';
import type { DetailResult, TrainingSessionDetail } from '../../api/queryApi';
import type { PendingRecord } from '../../sync/types';

/** Cenários "Estados e falhas" da spec (specs/STORY-025). */

const detail: TrainingSessionDetail = {
  id: 'abc', kind: 'strength', date: '2026-10-30', registeredAt: null, durationMinutes: 20,
  distanceKm: null, perceivedEffort: null, muscleGroup: 'Ombro', intensity: 'Leve', workoutType: null, exercises: null,
};

const api = (result: DetailResult<TrainingSessionDetail>) => ({
  trainingSession: jest.fn(async () => result),
});

const avulsaPendente: PendingRecord = {
  idempotencyKey: 'k1', kind: 'strength', queuedAt: '2026-10-30T10:00:00Z',
  payload: { date: '2026-10-30', muscleGroup: 'Ombro', intensity: 'Leve', durationMinutes: 20 },
};

const queue = (records: PendingRecord[] | Error) => ({
  pending: async () => { if (records instanceof Error) throw records; return records; },
});
const noSheet = { cached: async () => null };

describe('carga do detalhe do treino', () => {
  it('lê o treino do servidor pelo id', async () => {
    const reader = api({ status: 'ok', data: detail });

    expect(await loadWorkoutDetail('abc', reader, queue([]), noSheet))
      .toEqual({ status: 'loaded', session: detail });
    expect(reader.trainingSession).toHaveBeenCalledWith('abc');
  });

  it('distingue inexistente, falha de leitura e sessão perdida', async () => {
    expect((await loadWorkoutDetail('abc', api({ status: 'notFound' }), queue([]), noSheet)).status).toBe('notFound');
    expect((await loadWorkoutDetail('abc', api({ status: 'failure' }), queue([]), noSheet)).status).toBe('unavailable');
    expect((await loadWorkoutDetail('abc', api({ status: 'unauthenticated' }), queue([]), noSheet)).status).toBe('sessionLost');
  });

  it('abre o treino pendente da fila sem consultar o servidor', async () => {
    const reader = api({ status: 'failure' });

    const result = await loadWorkoutDetail('pending:k1:strength', reader, queue([avulsaPendente]), noSheet);

    expect(result).toEqual({
      status: 'loaded', session: expect.objectContaining({ pending: true, muscleGroup: 'Ombro' }),
    });
    expect(reader.trainingSession).not.toHaveBeenCalled();
  });

  it('avisa que o pendente já sincronizou, em vez de dizer que falhou', async () => {
    const result = await loadWorkoutDetail('pending:k1:strength', api({ status: 'failure' }), queue([]), noSheet);

    expect(result.status).toBe('synced');
  });

  it('falha ao ler a fila vira indisponível', async () => {
    const result = await loadWorkoutDetail(
      'pending:k1:strength', api({ status: 'failure' }), queue(new Error('disco')), noSheet);

    expect(result.status).toBe('unavailable');
  });
});
