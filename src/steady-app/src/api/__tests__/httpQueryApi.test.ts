import { HttpQueryApi } from '../httpQueryApi';
import type { TokenSource } from '../../auth/googleSession';

/**
 * Cliente de leitura da API (avaliação de sobrecarga + histórico).
 *
 * O que este teste protege: o app traduz o que o servidor diz, nunca decide
 * sozinho. Em especial o estado "reunindo dados" vem de `hasSufficientHistory`
 * (ADR-004) — se o app derivasse isso do histórico, estaria reimplementando o
 * limiar de 14 dias do ADR-001 no cliente, o que FF-004 proíbe.
 */

type FakeResponse = { status: number; body?: unknown };

function fakeFetch(...responses: FakeResponse[]) {
  const calls: { url: string; headers: Record<string, string> }[] = [];

  const fn = async (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });

    const next = responses.shift();
    if (!next) throw new Error('fakeFetch: resposta não configurada.');

    return { status: next.status, json: async () => next.body ?? {} };
  };

  return Object.assign(fn, { calls });
}

function sessionWith(...tokens: (string | null)[]): TokenSource & { refreshCount: number } {
  let current = tokens.shift() ?? null;

  return {
    refreshCount: 0,
    async currentToken() {
      return current;
    },
    async refresh() {
      this.refreshCount += 1;
      current = tokens.shift() ?? null;
      return current;
    },
  };
}

const BASE = 'https://api.steady.test';

describe('avaliação de sobrecarga', () => {
  it('traduz risco com sugestão vindo da API', async () => {
    const fetchFn = fakeFetch({
      status: 200,
      body: { hasRisk: true, suggestion: 'Alivie o próximo treino de perna.', hasSufficientHistory: true },
    });
    const api = new HttpQueryApi(BASE, sessionWith('token'), fetchFn);

    const result = await api.overloadAssessment();

    expect(result).toEqual({
      status: 'ok',
      data: { status: 'risk', suggestion: 'Alivie o próximo treino de perna.' },
    });
    expect(fetchFn.calls[0].url).toBe(`${BASE}/api/overload-assessment`);
    expect(fetchFn.calls[0].headers.Authorization).toBe('Bearer token');
  });

  it('traduz ausência de risco quando o histórico já é suficiente', async () => {
    const api = new HttpQueryApi(
      BASE,
      sessionWith('token'),
      fakeFetch({ status: 200, body: { hasRisk: false, suggestion: null, hasSufficientHistory: true } }),
    );

    const result = await api.overloadAssessment();

    expect(result).toEqual({ status: 'ok', data: { status: 'noRisk' } });
  });

  it('traduz histórico insuficiente como "reunindo dados", não como "sem risco"', async () => {
    const api = new HttpQueryApi(
      BASE,
      sessionWith('token'),
      fakeFetch({ status: 200, body: { hasRisk: false, suggestion: null, hasSufficientHistory: false } }),
    );

    const result = await api.overloadAssessment();

    expect(result).toEqual({ status: 'ok', data: { status: 'gatheringData' } });
  });
});

describe('histórico de treinos', () => {
  it('traduz sessões de corrida e de musculação', async () => {
    const api = new HttpQueryApi(
      BASE,
      sessionWith('token'),
      fakeFetch({
        status: 200,
        body: [
          {
            id: 'a1',
            type: 'Corrida',
            date: '2026-08-15',
            durationMinutes: 45,
            distanceKm: 8.2,
            averagePaceMinPerKm: 5.5,
            perceivedEffort: 7,
            muscleGroup: null,
            intensity: null,
          },
          {
            id: 'b2',
            type: 'Musculacao',
            date: '2026-08-14',
            durationMinutes: 50,
            distanceKm: null,
            averagePaceMinPerKm: null,
            perceivedEffort: null,
            muscleGroup: 'PernaPosterior',
            intensity: 'Pesado',
          },
        ],
      }),
    );

    const result = await api.trainingHistory();

    expect(result).toEqual({
      status: 'ok',
      data: [
        {
          id: 'a1',
          kind: 'running',
          date: '2026-08-15',
          durationMinutes: 45,
          distanceKm: 8.2,
          perceivedEffort: 7,
          muscleGroup: null,
          intensity: null,
        },
        {
          id: 'b2',
          kind: 'strength',
          date: '2026-08-14',
          durationMinutes: 50,
          distanceKm: null,
          perceivedEffort: null,
          muscleGroup: 'PernaPosterior',
          intensity: 'Pesado',
        },
      ],
    });
  });

  it('devolve lista vazia quando o corredor ainda não registrou nada', async () => {
    const api = new HttpQueryApi(
      BASE,
      sessionWith('token'),
      fakeFetch({ status: 200, body: [] }),
    );

    expect(await api.trainingHistory()).toEqual({ status: 'ok', data: [] });
  });
});

describe('sessão do Google', () => {
  it('renova o token silenciosamente e repete a consulta', async () => {
    const session = sessionWith('expirado', 'novo');
    const fetchFn = fakeFetch(
      { status: 401 },
      { status: 200, body: { hasRisk: false, suggestion: null, hasSufficientHistory: true } },
    );
    const api = new HttpQueryApi(BASE, session, fetchFn);

    const result = await api.overloadAssessment();

    expect(result).toEqual({ status: 'ok', data: { status: 'noRisk' } });
    expect(session.refreshCount).toBe(1);
    expect(fetchFn.calls[1].headers.Authorization).toBe('Bearer novo');
  });

  it('reporta sessão perdida quando a renovação falha', async () => {
    const api = new HttpQueryApi(BASE, sessionWith('expirado', null), fakeFetch({ status: 401 }));

    expect(await api.overloadAssessment()).toEqual({ status: 'unauthenticated' });
  });

  it('reporta sessão perdida quando não há token guardado', async () => {
    const fetchFn = fakeFetch();
    const api = new HttpQueryApi(BASE, sessionWith(null), fetchFn);

    expect(await api.trainingHistory()).toEqual({ status: 'unauthenticated' });
    expect(fetchFn.calls).toHaveLength(0);
  });
});

describe('falhas', () => {
  it('reporta falha quando o servidor erra', async () => {
    const api = new HttpQueryApi(BASE, sessionWith('token'), fakeFetch({ status: 500 }));

    expect(await api.overloadAssessment()).toEqual({ status: 'failure' });
  });

  it('reporta falha quando a requisição nem chega ao servidor', async () => {
    const semRede = async () => {
      throw new Error('Network request failed');
    };
    const api = new HttpQueryApi(BASE, sessionWith('token'), semRede as never);

    expect(await api.trainingHistory()).toEqual({ status: 'failure' });
  });
});
