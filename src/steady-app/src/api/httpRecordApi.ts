import type { TokenSource } from '../auth/googleSession';
import type { ApiResponse, RecordApi } from '../sync/recordApi';
import { ENDPOINT_BY_KIND, type RecordKind } from '../sync/types';
import type { Intensity, MuscleGroup } from '../training/labels';

const IDEMPOTENCY_HEADER = 'Idempotency-Key';

// A API .NET aceita estes enums como números; a fila continua guardando os
// valores nomeados para o histórico e para o funcionamento offline.
const MUSCLE_GROUP_WIRE: Record<MuscleGroup, number> = {
  PeitoTriceps: 0, Ombro: 1, PernaFrontal: 2, PernaPosterior: 3, BicepsCostas: 4,
};
const INTENSITY_WIRE: Record<Intensity, number> = { Leve: 0, Moderado: 1, Pesado: 2 };

function wireEnum(value: unknown, values: Record<string, number>): unknown {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(values, value) ? values[value] : value;
}

function requestPayload(kind: RecordKind, payload: unknown): unknown {
  if (kind !== 'strength' || typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return payload;
  }
  const input = payload as Record<string, unknown>;
  return {
    ...input,
    muscleGroup: wireEnum(input.muscleGroup, MUSCLE_GROUP_WIRE),
    intensity: wireEnum(input.intensity, INTENSITY_WIRE),
  };
}

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
    // `null` aqui significa "o módulo nativo não devolveu o token agora", não
    // "não há sessão" — desistir sem tentar renovar mandava o corredor ao login
    // com sessão válida (regressão da STORY-010).
    const token = (await this.session.currentToken()) ?? (await this.session.refresh());
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
        body: JSON.stringify(requestPayload(kind, payload)),
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
