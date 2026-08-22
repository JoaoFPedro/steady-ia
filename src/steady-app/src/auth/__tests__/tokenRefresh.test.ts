import { HttpRecordApi } from '../../api/httpRecordApi';
import type { TokenSource } from '../googleSession';

/**
 * Cenários da spec (specs/STORY-003/spec.bdd.md):
 *  - "Token do Google expira durante o uso"
 *  - "Renovação do token falha"
 *
 * O ID token do Google expira em ~1h e a API o valida a cada requisição
 * (ADR-002). Sem renovação silenciosa, o corredor seria jogado para o login no
 * meio do registro do treino — exatamente quando a suposição crítica #2 do
 * DISC-001 (registro consistente) está em jogo.
 */

type FakeResponse = { status: number; body?: unknown };

function fakeFetch(...responses: FakeResponse[]) {
  const calls: { url: string; headers: Record<string, string> }[] = [];

  const fn = async (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });

    const next = responses.shift();
    if (!next) throw new Error('fakeFetch: resposta não configurada.');

    return {
      status: next.status,
      json: async () => next.body ?? {},
    };
  };

  return Object.assign(fn, { calls });
}

function sessionWith(tokens: (string | null)[]): TokenSource & { refreshCount: number } {
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

describe('Renovação do token do Google', () => {
  it('renova silenciosamente e repete a requisição quando o token expirou', async () => {
    const session = sessionWith(['token-expirado', 'token-novo']);
    const fetchFn = fakeFetch({ status: 401 }, { status: 201 });
    const api = new HttpRecordApi('https://api.steady.test', session, fetchFn as never);

    const response = await api.send('running', { distanceKm: 8 }, 'chave-1');

    expect(response).toEqual({ status: 'ok' });
    expect(session.refreshCount).toBe(1);
    expect(fetchFn.calls).toHaveLength(2);
    expect(fetchFn.calls[0].headers.Authorization).toBe('Bearer token-expirado');
    expect(fetchFn.calls[1].headers.Authorization).toBe('Bearer token-novo');
  });

  it('mantém a mesma chave de idempotência na requisição repetida', async () => {
    const session = sessionWith(['token-expirado', 'token-novo']);
    const fetchFn = fakeFetch({ status: 401 }, { status: 200 });
    const api = new HttpRecordApi('https://api.steady.test', session, fetchFn as never);

    await api.send('running', { distanceKm: 8 }, 'chave-estavel');

    expect(fetchFn.calls[0].headers['Idempotency-Key']).toBe('chave-estavel');
    expect(fetchFn.calls[1].headers['Idempotency-Key']).toBe('chave-estavel');
  });

  it('reporta sessão perdida quando a renovação falha', async () => {
    const session = sessionWith(['token-expirado', null]);
    const fetchFn = fakeFetch({ status: 401 });
    const api = new HttpRecordApi('https://api.steady.test', session, fetchFn as never);

    const response = await api.send('running', { distanceKm: 8 }, 'chave-1');

    expect(response).toEqual({ status: 'unauthenticated' });
    expect(session.refreshCount).toBe(1);
  });

  it('não renova mais de uma vez na mesma requisição', async () => {
    const session = sessionWith(['token-expirado', 'token-tambem-invalido']);
    const fetchFn = fakeFetch({ status: 401 }, { status: 401 });
    const api = new HttpRecordApi('https://api.steady.test', session, fetchFn as never);

    const response = await api.send('running', { distanceKm: 8 }, 'chave-1');

    expect(response).toEqual({ status: 'unauthenticated' });
    expect(session.refreshCount).toBe(1);
  });

  it('reporta sessão perdida quando nem existe token guardado', async () => {
    const session = sessionWith([null, null]);
    const fetchFn = fakeFetch();
    const api = new HttpRecordApi('https://api.steady.test', session, fetchFn as never);

    const response = await api.send('running', { distanceKm: 8 }, 'chave-1');

    expect(response).toEqual({ status: 'unauthenticated' });
    expect(fetchFn.calls).toHaveLength(0);
  });
});

describe('Tradução da resposta HTTP', () => {
  const comToken = () => sessionWith(['token-valido']);

  it('trata 201 como criado', async () => {
    const api = new HttpRecordApi('https://api.steady.test', comToken(), fakeFetch({ status: 201 }) as never);
    expect(await api.send('running', {}, 'k')).toEqual({ status: 'ok' });
  });

  it('trata 200 como reenvio já reconhecido pela chave', async () => {
    const api = new HttpRecordApi('https://api.steady.test', comToken(), fakeFetch({ status: 200 }) as never);
    expect(await api.send('running', {}, 'k')).toEqual({ status: 'ok' });
  });

  it('trata 400 como rejeição definitiva, preservando a mensagem do domínio', async () => {
    const fetchFn = fakeFetch({ status: 400, body: { error: 'A distância deve ser maior que zero.' } });
    const api = new HttpRecordApi('https://api.steady.test', comToken(), fetchFn as never);

    expect(await api.send('running', {}, 'k')).toEqual({
      status: 'rejected',
      message: 'A distância deve ser maior que zero.',
    });
  });

  it('trata 5xx como falha transitória do servidor', async () => {
    const api = new HttpRecordApi('https://api.steady.test', comToken(), fakeFetch({ status: 503 }) as never);
    expect(await api.send('running', {}, 'k')).toEqual({ status: 'serverFailure' });
  });

  it('trata queda de rede como falha de transporte', async () => {
    const fetchFn = async () => {
      throw new TypeError('Network request failed');
    };
    const api = new HttpRecordApi('https://api.steady.test', comToken(), fetchFn as never);

    expect(await api.send('running', {}, 'k')).toEqual({ status: 'transportFailure' });
  });

  it('envia o registro para a rota correspondente ao tipo', async () => {
    const fetchFn = fakeFetch({ status: 201 });
    const api = new HttpRecordApi('https://api.steady.test', comToken(), fetchFn as never);

    await api.send('strength', {}, 'k');

    expect(fetchFn.calls[0].url).toBe('https://api.steady.test/api/strength-sessions');
  });
});

describe('Token ausente não é prova de sessão perdida (regressão da STORY-010)', () => {
  it('tenta renovar antes de desistir quando não há token guardado', async () => {
    // `currentToken()` devolver null significa "o módulo nativo não me deu o
    // token agora" — não "o corredor não está autenticado". Desistir aqui
    // mandava para o login com sessão válida.
    const session = sessionWith([null, 'token-renovado']);
    const fetchFn = fakeFetch({ status: 201 });
    const api = new HttpRecordApi('https://api.steady.test', session, fetchFn as never);

    const response = await api.send('running', { distanceKm: 8 }, 'chave-1');

    expect(response).not.toEqual({ status: 'unauthenticated' });
    expect(fetchFn.calls).toHaveLength(1);
    expect(fetchFn.calls[0].headers.Authorization).toBe('Bearer token-renovado');
  });
});

