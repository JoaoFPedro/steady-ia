import type { RecordApi } from './recordApi';
import type { RecordQueue } from './recordQueue';
import type { RecordKind } from './types';

export type RejectedRecord = { kind: RecordKind; message: string };

export type SyncSummary = {
  /** Confirmados pelo servidor e removidos da fila. */
  synced: number;
  /** Continuam na fila para uma tentativa posterior. */
  deferred: number;
  /** Removidos da fila por rejeição definitiva — o corredor precisa saber. */
  rejected: RejectedRecord[];
  /** A sessão caiu: o ciclo parou e a fila ficou intacta. */
  unauthenticated: boolean;
};

/**
 * Envia os pendentes da fila, um a um, e decide o destino de cada um pelo
 * resultado. Reenviar é seguro por causa da chave de idempotência (ADR-003).
 */
export class SyncEngine {
  constructor(
    private readonly queue: RecordQueue,
    private readonly api: RecordApi,
  ) {}

  async sync(): Promise<SyncSummary> {
    const summary: SyncSummary = { synced: 0, deferred: 0, rejected: [], unauthenticated: false };

    for (const record of await this.queue.pending()) {
      const response = await this.api.send(record.kind, record.payload, record.idempotencyKey);

      // Sem sessão válida, insistir nos demais só repetiria a mesma falha.
      if (response.status === 'unauthenticated') {
        summary.unauthenticated = true;
        return summary;
      }

      if (response.status === 'ok') {
        await this.queue.remove(record.idempotencyKey);
        summary.synced += 1;
        continue;
      }

      if (response.status === 'rejected') {
        await this.queue.remove(record.idempotencyKey);
        summary.rejected.push({ kind: record.kind, message: response.message });
        continue;
      }

      // serverFailure | transportFailure — transitório: permanece na fila.
      summary.deferred += 1;
    }

    return summary;
  }
}
