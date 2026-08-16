/**
 * Fila offline de registros — coração da STORY-003.
 *
 * O corredor registra o treino logo depois de correr, muitas vezes na rua e sem
 * sinal. A fila existe para que o registro nunca dependa da conexão: a suposição
 * crítica #2 do DISC-001 é justamente que ele registre de forma consistente.
 */

export type RecordKind = 'running' | 'strength' | 'pain';

/** Rota da API para cada tipo de registro (STORY-002). */
export const ENDPOINT_BY_KIND: Record<RecordKind, string> = {
  running: '/api/running-sessions',
  strength: '/api/strength-sessions',
  pain: '/api/pain-logs',
};

export type PendingRecord = {
  /**
   * Chave de idempotência (ADR-003). Gerada UMA vez, quando o item entra na
   * fila — nunca no momento do envio. Gerar por tentativa anularia a proteção
   * inteira e o bug seria invisível com rede boa.
   */
  idempotencyKey: string;
  kind: RecordKind;
  /** Corpo já no formato que a API espera. */
  payload: unknown;
  /** ISO — usado só para ordenar a fila. */
  queuedAt: string;
};

/** Porta de persistência da fila. Em produção é AsyncStorage; em teste, memória. */
export interface QueueStorage {
  read(): Promise<PendingRecord[]>;
  write(records: PendingRecord[]): Promise<void>;
}
