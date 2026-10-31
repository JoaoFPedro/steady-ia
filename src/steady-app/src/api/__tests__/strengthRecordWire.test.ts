import { HttpRecordApi } from '../httpRecordApi';

/** STORY-003: registrar musculação com conexão disponível. */
describe('envio de musculação para a API', () => {
  it.each([
    ['PeitoTriceps', 0], ['Ombro', 1], ['PernaFrontal', 2],
    ['PernaPosterior', 3], ['BicepsCostas', 4],
  ])('envia o grupo %s no formato esperado pelo backend', async (muscleGroup, expected) => {
    const calls: string[] = [];
    const fetchFn = async (_url: string, init: { body: string }) => {
      calls.push(init.body);
      return { status: 201, json: async () => ({}) };
    };
    const api = new HttpRecordApi('https://api.steady.test', {
      currentToken: async () => 'token', refresh: async () => 'token',
    }, fetchFn);
    const payload = { date: '2026-10-31', muscleGroup, intensity: 'Moderado', durationMinutes: 45 };

    expect(await api.send('strength', payload, 'key')).toEqual({ status: 'ok' });
    expect(JSON.parse(calls[0])).toMatchObject({ muscleGroup: expected, intensity: 1 });
    expect(payload.muscleGroup).toBe(muscleGroup);
  });

  it.each([['Leve', 0], ['Moderado', 1], ['Pesado', 2]])(
    'envia a intensidade %s no formato da API', async (intensity, expected) => {
      let body = '';
      const fetchFn = async (_url: string, init: { body: string }) => {
        body = init.body;
        return { status: 201, json: async () => ({}) };
      };
      const api = new HttpRecordApi('https://api.steady.test', {
        currentToken: async () => 'token', refresh: async () => 'token',
      }, fetchFn);
      await api.send('strength', { muscleGroup: 'Ombro', intensity }, 'key');
      expect(JSON.parse(body).intensity).toBe(expected);
    },
  );

});
