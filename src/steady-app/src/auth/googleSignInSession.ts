import type { AccountIdentity, GoogleSession } from './googleSession';

/**
 * Só o que usamos de `@react-native-google-signin/google-signin`.
 *
 * Declarar a porta aqui mantém a lógica testável sem módulo nativo — a
 * biblioteca real só existe num development build, nunca no Jest.
 *
 * Os booleanos traduzem o `{ type: 'success' | 'cancelled' | 'noSavedCredentialFound' }`
 * da biblioteca: para esta camada, "cancelou" e "não tinha credencial salva" são a
 * mesma coisa — não há sessão.
 */
export interface GoogleSignInClient {
  /** `false` quando o corredor cancela. */
  signIn(): Promise<boolean>;
  /** `false` quando não há credencial salva no aparelho. */
  signInSilently(): Promise<boolean>;
  /** Lança se não houver sessão. */
  getTokens(): Promise<{ idToken: string }>;
  /** `null` quando não há conta autenticada no aparelho. */
  currentUser(): Promise<{ email: string; name: string | null; photo: string | null } | null>;
  /** Lança se o encerramento falhar — quem chama decide o que fazer com isso. */
  signOut(): Promise<void>;
}

/**
 * Sessão do Google sobre a biblioteca nativa.
 *
 * Toda ausência de sessão vira `null`, nunca exceção: para o resto do app isso
 * não é condição excepcional, e a fila offline não perde nada por causa disso.
 */
export class GoogleSignInSession implements GoogleSession {
  /**
   * Renovação em andamento, compartilhada por quem chegar durante ela.
   *
   * Sem isto, dois leitores concorrentes (a Dashboard carrega home e
   * planejamentos ao mesmo tempo, STORY-010) chamam `signInSilently()` em
   * paralelo. O módulo nativo recusa a segunda: ela vira `null`, o chamador lê
   * isso como sessão perdida e manda o corredor ao login — com a sessão válida.
   */
  private renovacaoEmAndamento: Promise<string | null> | null = null;

  /**
   * Leitura de token em andamento, compartilhada pelo mesmo motivo da renovação:
   * `getTokens()` também é chamada ao módulo nativo, e a segunda simultânea pode
   * falhar. O `null` resultante era lido como sessão perdida.
   */
  private leituraEmAndamento: Promise<string | null> | null = null;

  constructor(private readonly client: GoogleSignInClient) {}

  /** Token atual. A biblioteca renova sozinha se o cache estiver vencido. */
  currentToken(): Promise<string | null> {
    this.leituraEmAndamento ??= this.tokenOrNull().finally(() => {
      this.leituraEmAndamento = null;
    });

    return this.leituraEmAndamento;
  }

  /**
   * Entra sem interação, reaproveitando a conta já autorizada no aparelho.
   *
   * Chamadas concorrentes compartilham a mesma renovação; a próxima, depois que
   * esta terminar, renova de novo — o resultado não fica em cache.
   */
  refresh(): Promise<string | null> {
    this.renovacaoEmAndamento ??= this.renovar().finally(() => {
      this.renovacaoEmAndamento = null;
    });

    return this.renovacaoEmAndamento;
  }

  private async renovar(): Promise<string | null> {
    if (!(await this.attempt(() => this.client.signInSilently()))) return null;

    return this.tokenOrNull();
  }

  /** Login com interação — só a partir da tela de login. */
  async signIn(): Promise<string | null> {
    if (!(await this.attempt(() => this.client.signIn()))) return null;

    return this.tokenOrNull();
  }

  /**
   * Encerra a sessão no aparelho, dizendo se conseguiu.
   *
   * Engolir a falha aqui seria enganoso: não existe "sessão do lado do app" — o
   * único estado de identidade é o cache deste cliente. Falhou, a credencial
   * continua no aparelho e o `signInSilently` da próxima abertura reautentica o
   * corredor (ADR-005, regra 9 da spec).
   */
  async signOut(): Promise<boolean> {
    try {
      await this.client.signOut();
      return true;
    } catch {
      return false;
    }
  }

  /** Quem está autenticado. Ausência e falha de leitura são a mesma coisa: `null`. */
  async currentAccount(): Promise<AccountIdentity | null> {
    try {
      const user = await this.client.currentUser();
      if (!user?.email) return null;

      return { email: user.email, name: user.name, photoUrl: user.photo };
    } catch {
      return null;
    }
  }

  /** Trata tanto o "não deu" declarado quanto a falha inesperada como ausência de sessão. */
  private async attempt(action: () => Promise<boolean>): Promise<boolean> {
    try {
      return await action();
    } catch {
      return false;
    }
  }

  private async tokenOrNull(): Promise<string | null> {
    try {
      const { idToken } = await this.client.getTokens();
      return idToken || null;
    } catch {
      return null;
    }
  }
}
