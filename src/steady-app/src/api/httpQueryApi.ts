import type { TokenSource } from '../auth/googleSession';
import type { OverloadView, QueryApi, QueryResult, TrainingSessionSummary } from './queryApi';
import type { PlanRequestSummary } from '../planning/planRequest';
import type { PlanRequestReader } from '../planning/planListState';

/** Só o suficiente de `fetch` para uma leitura autenticada. */
type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string> },
) => Promise<{ status: number; json(): Promise<unknown> }>;

/** Corpo de `GET /api/overload-assessment` (Steady.Api/Contracts). */
type AssessmentBody = {
  hasRisk?: unknown;
  suggestion?: unknown;
  hasSufficientHistory?: unknown;
};

/** Corpo de cada item de `GET /api/training-sessions`. */
type SessionBody = {
  id?: unknown;
  type?: unknown;
  date?: unknown;
  durationMinutes?: unknown;
  distanceKm?: unknown;
  perceivedEffort?: unknown;
  muscleGroup?: unknown;
  intensity?: unknown;
};

/**
 * Cliente de leitura dos endpoints da STORY-002.
 *
 * Repete a única gentileza que o `HttpRecordApi` também faz: renovar o token
 * expirado uma vez e repetir a chamada, para o corredor não cair no login no
 * meio de uma consulta (ADR-002).
 */
export class HttpQueryApi implements QueryApi, PlanRequestReader {
  constructor(
    private readonly baseUrl: string,
    private readonly session: TokenSource,
    private readonly fetchFn: FetchLike,
  ) {}

  async overloadAssessment(): Promise<QueryResult<OverloadView>> {
    const result = await this.get('/api/overload-assessment');
    return result.status === 'ok' ? { status: 'ok', data: toOverloadView(result.data) } : result;
  }

  async trainingHistory(): Promise<QueryResult<TrainingSessionSummary[]>> {
    const result = await this.get('/api/training-sessions');
    return result.status === 'ok' ? { status: 'ok', data: toSessions(result.data) } : result;
  }

  async planRequests(): Promise<QueryResult<PlanRequestSummary[]>> {
    const result = await this.get('/api/plan-requests');
    return result.status === 'ok' ? { status: 'ok', data: toPlanRequests(result.data) } : result;
  }

  private async get(path: string): Promise<QueryResult<unknown>> {
    // `null` aqui significa "o módulo nativo não devolveu o token agora", não
    // "não há sessão" — desistir sem tentar renovar mandava o corredor ao login
    // com sessão válida (regressão da STORY-010).
    const token = (await this.session.currentToken()) ?? (await this.session.refresh());
    if (!token) return { status: 'unauthenticated' };

    const first = await this.send(path, token);

    // Igual ao envio: uma renovação basta. Um segundo 401 é problema de sessão,
    // não expiração — insistir só faria o corredor esperar mais.
    if (first.status !== 401) return first.result;

    const refreshed = await this.session.refresh();
    if (!refreshed) return { status: 'unauthenticated' };

    const retry = await this.send(path, refreshed);
    return retry.status === 401 ? { status: 'unauthenticated' } : retry.result;
  }

  /** Devolve o status cru junto da tradução, para o 401 poder ser tratado acima. */
  private async send(
    path: string,
    token: string,
  ): Promise<{ status: number; result: QueryResult<unknown> }> {
    try {
      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        return { status: 200, result: { status: 'ok', data: await response.json() } };
      }

      return {
        status: response.status,
        result: response.status === 401 ? { status: 'unauthenticated' } : { status: 'failure' },
      };
    } catch {
      // Nem chegou ao servidor. Para uma leitura isso é só falha: não há nada
      // para guardar nem para reenviar depois.
      return { status: 0, result: { status: 'failure' } };
    }
  }
}

function toOverloadView(body: unknown): OverloadView {
  const { hasRisk, suggestion, hasSufficientHistory } = (body ?? {}) as AssessmentBody;

  // O estado "reunindo dados" tem precedência: sem histórico suficiente a regra
  // do ADR-001 nem chegou a ser avaliada, então "sem risco" seria uma garantia
  // que o domínio não deu (ADR-004).
  if (hasSufficientHistory !== true) return { status: 'gatheringData' };

  if (hasRisk === true && typeof suggestion === 'string' && suggestion.length > 0) {
    return { status: 'risk', suggestion };
  }

  return { status: 'noRisk' };
}

function toSessions(body: unknown): TrainingSessionSummary[] {
  if (!Array.isArray(body)) return [];

  return body.map((item: SessionBody) => ({
    id: String(item.id),
    kind: item.type === 'Corrida' ? 'running' : 'strength',
    date: String(item.date),
    durationMinutes: Number(item.durationMinutes),
    distanceKm: numberOrNull(item.distanceKm),
    perceivedEffort: numberOrNull(item.perceivedEffort),
    muscleGroup: stringOrNull(item.muscleGroup),
    intensity: stringOrNull(item.intensity),
  }));
}

const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

/**
 * Tradução defensiva do corpo da API. Tudo que vem da rede é `unknown` até
 * provar o contrário — mesmo padrão de `toSessions`.
 */
function toPlanRequests(body: unknown): PlanRequestSummary[] {
  if (!Array.isArray(body)) return [];

  return body.map((item: Record<string, unknown>) => ({
    idempotencyKey: String(item.idempotencyKey),
    createdAt: String(item.createdAt),
    pending: false,
    raceDistance: String(item.raceDistance) as PlanRequestSummary['raceDistance'],
    raceDate: String(item.raceDate),
    raceIsFirstTime: item.raceIsFirstTime === true,
    longestRecentRunKm: Number(item.longestRecentRunKm),
    trainingDaysPerWeek: Number(item.trainingDaysPerWeek),
    currentWeeklyRunningDays: numberOrNull(item.currentWeeklyRunningDays),
    referenceDistanceKm: numberOrNull(item.referenceDistanceKm),
    referenceDuration: stringOrNull(item.referenceDuration),
    strengthSessionMinutes: numberOrNull(item.strengthSessionMinutes),
    equipmentAccess: stringOrNull(item.equipmentAccess) as PlanRequestSummary['equipmentAccess'],
    recurringPainAreas: Array.isArray(item.recurringPainAreas)
      ? (item.recurringPainAreas.map(String) as PlanRequestSummary['recurringPainAreas'])
      : [],
    priorInjuries: stringOrNull(item.priorInjuries),
  }));
}
