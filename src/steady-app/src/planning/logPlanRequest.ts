import type { RecordQueue } from '../sync/recordQueue';
import type { SyncEngine } from '../sync/syncEngine';
import { outcomeOf, type LogOutcome } from '../features/logRecord';
import type { PlanRequestPayload } from './planRequest';

/**
 * Registra o pedido de plano do mesmo jeito que um treino: fila primeiro, rede
 * depois (ADR-003). Devolve a chave de idempotência junto do desfecho porque a
 * tela navega para o pedido recém-criado — e essa chave é a identidade dele
 * antes mesmo de chegar ao servidor (spec STORY-010, regra 3).
 */
export async function logPlanRequest(
  queue: RecordQueue,
  syncEngine: SyncEngine,
  payload: PlanRequestPayload,
): Promise<{ outcome: LogOutcome; idempotencyKey: string }> {
  const record = await queue.enqueue('plan', payload);

  return {
    idempotencyKey: record.idempotencyKey,
    outcome: outcomeOf(await syncEngine.sync(), 'plan'),
  };
}
