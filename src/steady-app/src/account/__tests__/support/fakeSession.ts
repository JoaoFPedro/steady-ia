import type { AccountIdentity, GoogleSession } from '../../../auth/googleSession';

/**
 * Sessão falsa para os testes de saída da conta.
 *
 * Registra as chamadas em `events` — é assim que o teste prova a ordem exigida
 * pelo ADR-005: a fila é descartada **antes** de a sessão ser encerrada.
 */
export class FakeSession implements GoogleSession {
  constructor(
    private readonly options: {
      /** `false` simula o `signOut` nativo falhando (regra de negócio 9). */
      signOutSucceeds?: boolean;
      email?: string | null;
      events?: string[];
    } = {},
  ) {}

  signedOut = false;

  async currentToken(): Promise<string | null> {
    return this.signedOut ? null : 'token-valido';
  }

  async refresh(): Promise<string | null> {
    return this.signedOut ? null : 'token-renovado';
  }

  async signIn(): Promise<string | null> {
    return 'token-do-login';
  }

  async currentAccount(): Promise<AccountIdentity | null> {
    const { email } = this.options;
    return email ? { email, name: null, photoUrl: null } : null;
  }

  async signOut(): Promise<boolean> {
    this.options.events?.push('signOut');

    if (this.options.signOutSucceeds === false) return false;

    this.signedOut = true;
    return true;
  }
}
