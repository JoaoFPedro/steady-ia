import type { QueryApi, TrainingSessionDetail } from '../api/queryApi';
import type { TrainingSheet } from '../coaching/types';
import { pendingWorkoutDetail } from '../home/pendingWorkoutDetail';
import type { PendingRecord } from '../sync/types';

export type WorkoutDetailState =
  | { status: 'loaded'; session: TrainingSessionDetail }
  /** Sem rede, timeout ou erro: distinto de `notFound`, que é definitivo. */
  | { status: 'unavailable' }
  | { status: 'notFound' }
  /** O pendente sincronizou entre o toque e a abertura: a dashboard já o mostra atualizado. */
  | { status: 'synced' }
  | { status: 'sessionLost' };

type DetailReader = Pick<QueryApi, 'trainingSession'>;
type PendingSource = { pending(): Promise<readonly PendingRecord[]> };
type SheetSource = { cached(): Promise<TrainingSheet | null> };

/** Carrega o treino aberto na tela de detalhes — da fila local (`pending:`) ou do servidor. */
export async function loadWorkoutDetail(
  id: string,
  api: DetailReader,
  queue: PendingSource,
  sheets: SheetSource,
): Promise<WorkoutDetailState> {
  if (id.startsWith('pending:')) return loadPending(id, queue, sheets);

  const result = await api.trainingSession(id);
  if (result.status === 'ok') return { status: 'loaded', session: result.data };
  if (result.status === 'unauthenticated') return { status: 'sessionLost' };
  return result.status === 'notFound' ? { status: 'notFound' } : { status: 'unavailable' };
}

async function loadPending(
  id: string,
  queue: PendingSource,
  sheets: SheetSource,
): Promise<WorkoutDetailState> {
  try {
    const records = await queue.pending();
    const session = pendingWorkoutDetail(records, id, await sheets.cached());
    return session ? { status: 'loaded', session } : { status: 'synced' };
  } catch {
    return { status: 'unavailable' };
  }
}
