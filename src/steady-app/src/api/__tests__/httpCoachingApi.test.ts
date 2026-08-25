import { HttpCoachingApi } from '../httpCoachingApi';
import type { TokenSource } from '../../auth/googleSession';

describe('HttpCoachingApi', () => {
  it('trata aceite 200 sem corpo como sucesso', async () => {
    const session: TokenSource = {
      currentToken: jest.fn(async () => 'token'),
      refresh: jest.fn(async () => null),
    };
    const fetchFn = jest.fn(async () => ({
      status: 200,
      json: async () => { throw new SyntaxError('corpo vazio'); },
    }));
    const api = new HttpCoachingApi('https://api.example', session, fetchFn);

    await expect(api.acceptLink('link-1')).resolves.toEqual({
      status: 'ok',
      data: undefined,
    });
  });
});
