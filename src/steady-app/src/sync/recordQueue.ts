import type { PendingRecord, QueueStorage, RecordKind } from './types';

/** Modalidades cujo histórico desempata pelo momento do registro (STORY-024). */
const STAMPED_KINDS: readonly RecordKind[] = ['running', 'strength'];

/**
 * Grava no corpo o momento em que o corredor registrou — não o do envio. Um
 * registro feito sem sinal e enviado horas depois continua sendo o mais antigo.
 */
function stampRegistration(kind: RecordKind, payload: unknown, queuedAt: string): unknown {
  if (!STAMPED_KINDS.includes(kind) || typeof payload !== 'object' || payload === null) {
    return payload;
  }
  return { ...payload, registeredAt: queuedAt };
}

/**
 * Fila local de registros aguardando envio.
 *
 * O registro entra aqui antes de qualquer chamada de rede — é o que permite ao
 * corredor registrar o treino na rua, sem sinal, e receber confirmação mesmo assim.
 */
export class RecordQueue {
  constructor(
    private readonly storage: QueueStorage,
    /**
     * Gerador da chave de idempotência. Injetado para o teste poder fixá-la e
     * para deixar explícito que ela é chamada uma única vez por registro.
     */
    private readonly newIdempotencyKey: () => string,
  ) {}

  /**
   * Coloca um registro na fila. A chave de idempotência nasce aqui e acompanha
   * o item por todas as tentativas de envio (ADR-003) — gerá-la no envio
   * anularia a proteção contra duplicata.
   */
  async enqueue(kind: RecordKind, payload: unknown): Promise<PendingRecord> {
    const queuedAt = new Date().toISOString();
    const record: PendingRecord = {
      idempotencyKey: this.newIdempotencyKey(),
      kind,
      payload: stampRegistration(kind, payload, queuedAt),
      queuedAt,
    };

    const records = await this.storage.read();
    await this.storage.write([...records, record]);

    return record;
  }

  /** Registros aguardando envio, na ordem em que foram criados. */
  async pending(): Promise<PendingRecord[]> {
    return this.storage.read();
  }

  async remove(idempotencyKey: string): Promise<void> {
    const records = await this.storage.read();
    await this.storage.write(records.filter((r) => r.idempotencyKey !== idempotencyKey));
  }

  /**
   * Esvazia a fila de uma vez.
   *
   * Existe **exclusivamente** para o encerramento de sessão (ADR-005): o item da
   * fila não carrega dono e o token só é anexado no envio, então um pendente que
   * sobreviva à saída seria gravado na conta do próximo corredor a entrar no
   * aparelho. Descartar item a item deixaria a fila pela metade se falhasse no meio.
   */
  async clear(): Promise<void> {
    await this.storage.write([]);
  }

  /** Quantidade de pendentes — o número que a home mostra ao corredor. */
  async count(): Promise<number> {
    return (await this.storage.read()).length;
  }
}
