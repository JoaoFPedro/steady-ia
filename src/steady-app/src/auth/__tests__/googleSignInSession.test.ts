import { GoogleSignInSession } from '../googleSignInSession';
import type { GoogleSignInClient } from '../googleSignInSession';

/**
 * Cenários da spec (specs/STORY-003/spec.bdd.md):
 *  - "Token do Google expira durante o uso"  → renovação silenciosa
 *  - "Renovação do token falha"              → sessão perdida, fila preservada
 *  - "Login com Google é cancelado ou falha"
 */

function client(overrides: Partial<GoogleSignInClient>): GoogleSignInClient {
  return {
    async signIn() {
      throw new Error('signIn não configurado neste teste');
    },
    async signInSilently() {
      throw new Error('signInSilently não configurado neste teste');
    },
    async getTokens() {
      throw new Error('getTokens não configurado neste teste');
    },
    async currentUser() {
      return null;
    },
    async signOut() {},
    ...overrides,
  };
}

describe('Sessão do Google', () => {
  it('devolve o token atual quando há sessão ativa', async () => {
    const session = new GoogleSignInSession(
      client({ async getTokens() { return { idToken: 'token-valido' }; } }),
    );

    expect(await session.currentToken()).toBe('token-valido');
  });

  it('devolve null quando não há sessão — sem estourar erro', async () => {
    const session = new GoogleSignInSession(
      client({ async getTokens() { throw new Error('SIGN_IN_REQUIRED'); } }),
    );

    expect(await session.currentToken()).toBeNull();
  });

  it('renova entrando silenciosamente e pegando o token novo', async () => {
    let entrouSilenciosamente = false;

    const session = new GoogleSignInSession(
      client({
        async signInSilently() {
          entrouSilenciosamente = true;
          return true;
        },
        async getTokens() {
          return { idToken: entrouSilenciosamente ? 'token-novo' : 'token-velho' };
        },
      }),
    );

    expect(await session.refresh()).toBe('token-novo');
    expect(entrouSilenciosamente).toBe(true);
  });

  it('devolve null quando não há credencial salva no aparelho', async () => {
    const session = new GoogleSignInSession(
      client({ async signInSilently() { return false; } }),
    );

    expect(await session.refresh()).toBeNull();
  });

  it('devolve null quando a renovação falha por erro inesperado', async () => {
    const session = new GoogleSignInSession(
      client({ async signInSilently() { throw new Error('NETWORK_ERROR'); } }),
    );

    expect(await session.refresh()).toBeNull();
  });

  it('devolve null quando a renovação passa mas o token não vem', async () => {
    const session = new GoogleSignInSession(
      client({
        async signInSilently() { return true; },
        async getTokens() { return { idToken: '' }; },
      }),
    );

    expect(await session.refresh()).toBeNull();
  });
});

describe('Entrar com o Google', () => {
  it('devolve o token quando o corredor conclui o login', async () => {
    const session = new GoogleSignInSession(
      client({
        async signIn() { return true; },
        async getTokens() { return { idToken: 'token-do-login' }; },
      }),
    );

    expect(await session.signIn()).toBe('token-do-login');
  });

  it('devolve null quando o corredor cancela o login', async () => {
    const session = new GoogleSignInSession(
      client({ async signIn() { return false; } }),
    );

    expect(await session.signIn()).toBeNull();
  });

  it('devolve null quando o login falha por erro do dispositivo', async () => {
    const session = new GoogleSignInSession(
      client({ async signIn() { throw new Error('PLAY_SERVICES_NOT_AVAILABLE'); } }),
    );

    expect(await session.signIn()).toBeNull();
  });
});

/**
 * Cenários da spec (specs/STORY-004/spec.bdd.md):
 *  - "Corredor vê em qual conta está"
 *  - "Falha ao encerrar a sessão no Google"
 */
describe('Sair da conta', () => {
  it('confirma a saída quando o Google encerra a sessão', async () => {
    let saiu = false;

    const session = new GoogleSignInSession(
      client({ async signOut() { saiu = true; } }),
    );

    expect(await session.signOut()).toBe(true);
    expect(saiu).toBe(true);
  });

  it('reporta a falha em vez de fingir que saiu', async () => {
    // Se o `signOut` nativo falha, a credencial continua no aparelho e o
    // `signInSilently` da próxima abertura reautentica o corredor. Anunciar
    // "você saiu" aqui seria mentira (regra de negócio 9).
    const session = new GoogleSignInSession(
      client({ async signOut() { throw new Error('SIGN_OUT_FAILED'); } }),
    );

    expect(await session.signOut()).toBe(false);
  });
});

describe('Conta autenticada', () => {
  it('devolve e-mail, nome e foto da conta autenticada', async () => {
    const session = new GoogleSignInSession(
      client({
        async currentUser() {
          return { email: 'corredor@gmail.com', name: 'João Pedro', photo: 'https://foto' };
        },
      }),
    );

    expect(await session.currentAccount()).toEqual({
      email: 'corredor@gmail.com',
      name: 'João Pedro',
      photoUrl: 'https://foto',
    });
  });

  it('repassa nome e foto ausentes como nulos, sem inventar valor', async () => {
    const session = new GoogleSignInSession(
      client({
        async currentUser() {
          return { email: 'corredor@gmail.com', name: null, photo: null };
        },
      }),
    );

    expect(await session.currentAccount()).toEqual({
      email: 'corredor@gmail.com',
      name: null,
      photoUrl: null,
    });
  });

  it('devolve null quando não há conta autenticada', async () => {
    const session = new GoogleSignInSession(client({ async currentUser() { return null; } }));

    expect(await session.currentAccount()).toBeNull();
  });

  it('devolve null quando a consulta ao aparelho falha — a tela Conta não quebra por isso', async () => {
    const session = new GoogleSignInSession(
      client({ async currentUser() { throw new Error('SIGN_IN_REQUIRED'); } }),
    );

    expect(await session.currentAccount()).toBeNull();
  });
});
