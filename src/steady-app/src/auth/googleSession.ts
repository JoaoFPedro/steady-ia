/** Quem está autenticado, do ponto de vista da tela Conta. */
export type AccountIdentity = {
  /** E-mail da conta Google — o que permite ao corredor perceber que está na conta errada. */
  email: string;
};

/**
 * O que um cliente HTTP precisa da sessão: um token, e um jeito de renová-lo.
 *
 * Separado de `GoogleSession` de propósito — `HttpQueryApi` e `HttpRecordApi`
 * autenticam requisições, não gerenciam a sessão. Depender do contrato inteiro
 * lhes daria o poder de encerrar a sessão do corredor, que nenhum dos dois tem
 * razão para ter.
 */
export interface TokenSource {
  /** ID token guardado, ou `null` se não há sessão. */
  currentToken(): Promise<string | null>;

  /**
   * Tenta obter um ID token novo sem interação do corredor.
   * Retorna `null` quando a renovação falha — aí o login é inevitável.
   */
  refresh(): Promise<string | null>;
}

/**
 * Sessão do Google vista pelas telas.
 *
 * Deliberadamente estreita: só o que elas realmente precisam. Quem implementa
 * decide se isso vem do `expo-auth-session`, de um cache local ou de um dublê de teste.
 */
export interface GoogleSession extends TokenSource {
  /** Login com interação. Retorna `null` quando o corredor cancela ou o login falha. */
  signIn(): Promise<string | null>;

  /**
   * Encerra a sessão no aparelho. Retorna `false` quando o encerramento falha.
   *
   * O booleano não é decorativo: o único estado de identidade do app é o cache do
   * módulo nativo. Se o encerramento falha, a credencial continua ali e a próxima
   * abertura reautentica o corredor — anunciar "você saiu" seria mentira (ADR-005).
   */
  signOut(): Promise<boolean>;

  /** Conta autenticada, ou `null` se não houver sessão ou o aparelho não souber informar. */
  currentAccount(): Promise<AccountIdentity | null>;
}
