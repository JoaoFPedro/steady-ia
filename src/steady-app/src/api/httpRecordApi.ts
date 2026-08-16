import type { TokenSource } from '../auth/googleSession';
import type { ApiResponse, RecordApi } from '../sync/recordApi';
import { ENDPOINT_BY_KIND, type RecordKind } from '../sync/types';

const IDEMPOTENCY_HEADER = 'Idempotency-Key';

/** Só o suficiente de `fetch` para o que este cliente usa — mantém o teste simples. */
type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ status: number; json(): Promise<unknown> }>;

/**
 * Cliente HTTP dos endpoints de registro.
 *
 * Duas responsabilidades que o resto do app não precisa conhecer:
 * renovar o token expirado silenciosamente (ADR-002) e traduzir o status HTTP
 * para o vocabulário que a fila entende — permanente vs. transitório.
 */
export class HttpRecordApi implements RecordApi {
  constructor(
    private readonly baseUrl: string,
    private readonly session: TokenSource,
    private readonly fetchFn: FetchLike,
  ) {}

  async send(kind: RecordKind, payload: unknown, idempotencyKey: string): Promise<ApiResponse> {
    const token = await this.session.currentToken();
    if (!token) return { status: 'unauthenticated' };

    const first = await this.post(kind, payload, idempotencyKey, token);

    // 401 é o caso esperado do token de ~1h: renova uma vez e repete.
    // Uma segunda renovação na mesma requisição indicaria problema de sessão,
    // não expiração — insistir só faria o corredor esperar mais.
    if (first.status !== 401) return first.response;

    const refreshed = await this.session.refresh();
    if (!refreshed) return { status: 'unauthenticated' };

    const retry = await this.post(kind, payload, idempotencyKey, refreshed);
    return retry.status === 401 ? { status: 'unauthenticated' } : retry.response;
  }

  /** Faz a chamada e devolve o status cru junto da tradução, para o 401 poder ser tratado acima. */
  private async post(
    kind: RecordKind,
    payload: unknown,
    idempotencyKey: string,
    token: string,
  ): Promise<{ status: number; response: ApiResponse }> {
    try {
      const httpResponse = await this.fetchFn(`${this.baseUrl}${ENDPOINT_BY_KIND[kind]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          [IDEMPOTENCY_HEADER]: idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      return {
        status: httpResponse.status,
        response: await translate(httpResponse),
      };
    } catch {
      // Nem chegou ao servidor: o corpo pode estar perfeito, então é transitório.
      return { status: 0, response: { status: 'transportFailure' } };
    }
  }
}

async function translate(httpResponse: {
  status: number;
  json(): Promise<unknown>;
}): Promise<ApiResponse> {
  // 201 criado · 200 reenvio reconhecido pela chave (ADR-003)
  if (httpResponse.status === 200 || httpResponse.status === 201) {
    return { status: 'ok' };
  }

  if (httpResponse.status === 400) {
    return { status: 'rejected', message: await readErrorMessage(httpResponse) };
  }

  if (httpResponse.status === 401) {
    return { status: 'unauthenticated' };
  }

  return { status: 'serverFailure' };
}

async function readErrorMessage(httpResponse: { json(): Promise<unknown> }): Promise<string> {
  try {
    const body = (await httpResponse.json()) as { error?: unknown };
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // Corpo ilegível não muda o destino do item: segue rejeitado.
  }

  return 'O registro não pôde ser salvo.';
}
