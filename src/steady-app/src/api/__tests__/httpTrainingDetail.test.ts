import { HttpQueryApi } from '../httpQueryApi';
import type { TokenSource } from '../../auth/googleSession';

/**
 * Cenários "Estados e falhas" da spec (specs/STORY-025): o detalhe por id
 * distingue treino inexistente de falha de leitura — dizer "não encontrado" a
 * quem só estava sem rede faria o corredor duvidar do próprio registro.
 */

type FakeResponse = { status: number; body?: unknown };

function fakeFetch(...responses: FakeResponse[]) {
  const calls: string[] = [];
  const fn = async (url: string) => {
    calls.push(url);
    const next = responses.shift();
    if (!next) throw new Error('fakeFetch: resposta não configurada.');
    return { status: next.status, json: async () => next.body ?? {} };
  };
  return Object.assign(fn, { calls });
}

const session = (...tokens: (string | null)[]): TokenSource => {
  let current = tokens.shift() ?? null;
  return {
    async currentToken() { return current; },
    async refresh() { current = tokens.shift() ?? null; return current; },
  };
};

const BASE = 'https://api.steady.test';
const ID = '6f1b0c1e-0000-4000-8000-000000000001';

const fichaBody = {
  id: ID, type: 'Musculacao', date: '2026-10-30', workoutType: 'push',
  exercises: [
    { exerciseId: 'a', name: 'Supino reto', sets: 3, repetitions: 10, loadKg: 20, note: 'Banco inclinado',
      skipped: false, exerciseKey: 'k1', durationSeconds: null },
    { exerciseId: 'b', name: 'Prancha', sets: 2, repetitions: 1, loadKg: null, note: null,
      skipped: true, exerciseKey: 'k2', durationSeconds: 45 },
  ],
};

describe('detalhe do treino por id', () => {
  it('lê o endpoint do id e traduz a execução da ficha com seus exercícios', async () => {
    const fetchFn = fakeFetch({ status: 200, body: fichaBody });
    const api = new HttpQueryApi(BASE, session('token'), fetchFn);

    const result = await api.trainingSession(ID);

    expect(fetchFn.calls).toEqual([`${BASE}/api/training-sessions/${ID}`]);
    expect(result).toEqual({
      status: 'ok',
      data: expect.objectContaining({
        id: ID,
        kind: 'strength',
        date: '2026-10-30',
        workoutType: 'push',
        exercises: [
          { name: 'Supino reto', sets: 3, repetitions: 10, loadKg: 20, note: 'Banco inclinado',
            skipped: false, durationSeconds: null },
          { name: 'Prancha', sets: 2, repetitions: 1, loadKg: null, note: null,
            skipped: true, durationSeconds: 45 },
        ],
      }),
    });
  });

  it('devolve exercises nulo na avulsa: sem série, nada é inventado', async () => {
    const api = new HttpQueryApi(BASE, session('token'), fakeFetch({
      status: 200,
      body: { id: ID, type: 'Musculacao', date: '2026-10-30', durationMinutes: 50,
        muscleGroup: 'Ombro', intensity: 'Leve', exercises: null },
    }));

    const result = await api.trainingSession(ID);

    expect(result).toEqual({
      status: 'ok',
      data: expect.objectContaining({ muscleGroup: 'Ombro', durationMinutes: 50, exercises: null }),
    });
  });

  it('trata o campo exercises ausente como nulo', async () => {
    const api = new HttpQueryApi(BASE, session('token'), fakeFetch({
      status: 200, body: { id: ID, type: 'Corrida', date: '2026-10-30', distanceKm: 5 },
    }));

    expect(await api.trainingSession(ID)).toEqual({
      status: 'ok', data: expect.objectContaining({ kind: 'running', exercises: null }),
    });
  });

  it('distingue treino inexistente (404) de falha de leitura', async () => {
    const notFound = new HttpQueryApi(BASE, session('token'), fakeFetch({ status: 404 }));
    const broken = new HttpQueryApi(BASE, session('token'), fakeFetch({ status: 500 }));

    expect(await notFound.trainingSession(ID)).toEqual({ status: 'notFound' });
    expect(await broken.trainingSession(ID)).toEqual({ status: 'failure' });
  });

  it('reporta falha quando a requisição nem chega ao servidor', async () => {
    const offline = async () => { throw new Error('rede'); };

    expect(await new HttpQueryApi(BASE, session('token'), offline).trainingSession(ID))
      .toEqual({ status: 'failure' });
  });

  it('renova o token uma vez e repete; sessão perdida vira unauthenticated', async () => {
    const renewed = new HttpQueryApi(BASE, session('velho', 'novo'),
      fakeFetch({ status: 401 }, { status: 200, body: fichaBody }));
    const lost = new HttpQueryApi(BASE, session('velho', null), fakeFetch({ status: 401 }));

    expect((await renewed.trainingSession(ID)).status).toBe('ok');
    expect(await lost.trainingSession(ID)).toEqual({ status: 'unauthenticated' });
  });

  it('o 404 de outras leituras continua sendo falha', async () => {
    const api = new HttpQueryApi(BASE, session('token'), fakeFetch({ status: 404 }));

    expect(await api.trainingHistory()).toEqual({ status: 'failure' });
  });
});
