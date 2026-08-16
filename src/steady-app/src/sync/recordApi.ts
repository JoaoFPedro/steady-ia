import type { RecordKind } from './types';

/**
 * Resposta do envio, na granularidade que decide o destino do item na fila.
 *
 * A distinção entre `rejected` (permanente) e as falhas transitórias é o que
 * impede a fila de reenviar para sempre um corpo que o servidor nunca aceitará.
 */
export type ApiResponse =
  /** 201 (criado) ou 200 (reenvio reconhecido pela chave — ADR-003). */
  | { status: 'ok' }
  /** 400 — validação de domínio. O servidor nunca aceitará este corpo. */
  | { status: 'rejected'; message: string }
  /** 5xx — o servidor falhou, mas o corpo pode estar certo. */
  | { status: 'serverFailure' }
  /** Sem rede ou timeout — nem chegou ao servidor. */
  | { status: 'transportFailure' }
  /** 401 mesmo após tentar renovar o token. */
  | { status: 'unauthenticated' };

export interface RecordApi {
  send(kind: RecordKind, payload: unknown, idempotencyKey: string): Promise<ApiResponse>;
}
