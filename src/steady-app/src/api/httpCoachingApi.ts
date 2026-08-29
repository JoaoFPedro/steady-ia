import type { TokenSource } from '../auth/googleSession';
import type { QueryResult } from './queryApi';
import type {
  Account,
  CoachingApi,
  CoachingHistory,
  CoachingLink,
  CommandResult,
  LinkedRunner,
  RunnerSearch,
  TrainingSheet,
  TrainingSheetDraft,
} from '../coaching/types';
import type { TrainingPlanDocument } from '../planning/trainingPlanDocument';
import type { SteadyTrainingPlanReader } from '../planning/steadyTrainingPlanReader';

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ status: number; json(): Promise<unknown> }>;

export class HttpCoachingApi implements CoachingApi, SteadyTrainingPlanReader {
  constructor(
    private readonly baseUrl: string,
    private readonly session: TokenSource,
    private readonly fetchFn: FetchLike,
  ) {}

  account() { return this.get<Account>('/api/account'); }
  activeTrainingSheet() { return this.get<TrainingSheet>('/api/coaching/training-sheet/active'); }
  pendingLinks() { return this.get<CoachingLink[]>('/api/coaching/links/pending'); }
  activeLink() { return this.get<CoachingLink>('/api/coaching/link/active'); }
  linkedRunners() { return this.get<LinkedRunner[]>('/api/coaching/runners'); }
  history(corredorId: string) {
    return this.get<CoachingHistory>(`/api/coaching/runners/${corredorId}/history`);
  }

  /** O plano do Steady (ADR-013) — mesmo tratamento que `activeTrainingSheet`: sem parsing defensivo, é a própria API do Steady do outro lado. */
  steadyTrainingPlan() { return this.get<TrainingPlanDocument>('/api/planning/steady-plan'); }

  searchRunner(email: string) {
    return this.command<RunnerSearch>(
      'GET', `/api/coaching/runners/search?email=${encodeURIComponent(email.trim())}`,
    );
  }

  requestLink(corredorId: string) {
    return this.command<CoachingLink>('POST', '/api/coaching/links', { corredorId });
  }

  acceptLink(linkId: string) {
    return this.command('POST', `/api/coaching/links/${linkId}/accept`);
  }

  endLink(linkId: string) {
    return this.command('DELETE', `/api/coaching/links/${linkId}`);
  }

  publishTrainingSheet(corredorId: string, draft: TrainingSheetDraft) {
    return this.command<TrainingSheet>(
      'POST', `/api/coaching/runners/${corredorId}/training-sheets`, draft,
    );
  }

  private async get<T>(path: string): Promise<QueryResult<T>> {
    const response = await this.authorized(path, 'GET');
    if (response.status === 200) {
      return { status: 'ok', data: await response.json() as T };
    }
    if (response.status === 401) return { status: 'unauthenticated' };
    return { status: 'failure' };
  }

  private async command<T = undefined>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<CommandResult<T>> {
    const response = await this.authorized(path, method, body);
    if (response.status === 200 || response.status === 201 || response.status === 204) {
      return {
        status: 'ok',
        // Alguns comandos (como aceitar vínculo) confirmam com 200 e corpo
        // vazio. Sucesso HTTP não pode virar falha só porque não há DTO de volta.
        data: response.status === 204 ? undefined as T : await readOptionalData<T>(response),
      };
    }
    if (response.status === 401) return { status: 'unauthenticated' };
    const message = await readMessage(response);
    if (response.status === 404) return { status: 'notFound', message };
    if (response.status === 409) return { status: 'conflict', message };
    if (response.status === 400 || response.status === 403) {
      return { status: 'rejected', message };
    }
    return { status: 'failure' };
  }

  private async authorized(path: string, method: string, body?: unknown) {
    try {
      const token = (await this.session.currentToken()) ?? (await this.session.refresh());
      if (!token) return responseWithoutBody(401);

      const first = await this.send(path, method, token, body);
      if (first.status !== 401) return first;

      const refreshed = await this.session.refresh();
      if (!refreshed) return responseWithoutBody(401);
      return this.send(path, method, refreshed, body);
    } catch {
      return responseWithoutBody(0);
    }
  }

  private send(path: string, method: string, token: string, body?: unknown) {
    return this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
}

async function readMessage(response: { json(): Promise<unknown> }): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    // Uma resposta sem JSON ainda é traduzida pelo status.
  }
  return 'Não foi possível concluir a operação.';
}

async function readOptionalData<T>(response: { json(): Promise<unknown> }): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return undefined as T;
  }
}

function responseWithoutBody(status: number) {
  return { status, async json() { return {}; } };
}
