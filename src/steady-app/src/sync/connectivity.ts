/**
 * Estado da conexão, visto pelo app.
 *
 * Estreito de propósito: quem sincroniza só precisa saber se dá para tentar.
 * Quem implementa decide se isso vem do NetInfo, de um ping ou de um dublê.
 */
export interface Connectivity {
  /** Observa mudanças de conectividade. Devolve a função que cancela a observação. */
  subscribe(listener: (online: boolean) => void): () => void;
}
