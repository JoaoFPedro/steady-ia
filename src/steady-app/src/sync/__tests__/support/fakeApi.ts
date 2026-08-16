import type { RecordApi, ApiResponse } from '../../recordApi';
import type { RecordKind } from '../../types';

export type SentRequest = {
  kind: RecordKind;
  payload: unknown;
  idempotencyKey: string;
};

/**
 * API falsa para os testes de sincronização. Registra tudo que recebeu — é
 * como o teste prova que um reenvio não virou dois registros no servidor.
 */
export class FakeRecordApi implements RecordApi {
  readonly sent: SentRequest[] = [];
  private responses: ApiResponse[] = [];

  /** Enfileira as respostas que a API dará, em ordem. */
  willRespond(...responses: ApiResponse[]): this {
    this.responses.push(...responses);
    return this;
  }

  async send(kind: RecordKind, payload: unknown, idempotencyKey: string): Promise<ApiResponse> {
    this.sent.push({ kind, payload, idempotencyKey });

    const next = this.responses.shift();
    if (!next) throw new Error('FakeRecordApi: resposta não configurada para esta chamada.');

    return next;
  }
}
