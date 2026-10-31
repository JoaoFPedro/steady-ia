import { HttpQueryApi } from '../httpQueryApi';

describe('ritmo da última corrida — STORY-024', () => {
  it('preserva o ritmo médio retornado pelo histórico', async () => {
    const session = { currentToken: async () => 'token', refresh: async () => 'token' };
    const fetchFn = async () => ({
      status: 200,
      json: async () => [{ id: 'run', type: 'Corrida', date: '2026-10-10', averagePaceMinPerKm: 6.5 }],
    });
    const result = await new HttpQueryApi('https://api.example', session, fetchFn).trainingHistory();
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('Resposta inesperada');
    expect(result.data[0]).toMatchObject({ averagePaceMinPerKm: 6.5 });
  });
});
