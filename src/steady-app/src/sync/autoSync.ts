import type { Connectivity } from './connectivity';

/** Só o que o auto-sync usa do `SyncEngine` — mantém o teste sem fila nem API. */
type Syncable = { sync(): Promise<unknown> };

/**
 * Esvazia a fila assim que a conexão volta.
 *
 * O corredor registra o treino na rua, sem sinal, e guarda o celular. Se a fila
 * só fosse enviada no próximo registro, a avaliação de sobrecarga ficaria
 * desatualizada justamente na semana em que ele mais precisa dela.
 *
 * @returns função que encerra a observação.
 */
export function startAutoSync(connectivity: Connectivity, syncEngine: Syncable): () => void {
  // `unknown` e não `false`: no primeiro aviso de que está online queremos
  // sincronizar — pode haver pendente de uma sessão anterior encerrada offline.
  let online: boolean | 'unknown' = 'unknown';

  return connectivity.subscribe((nowOnline) => {
    const reconnected = nowOnline && online !== true;
    online = nowOnline;

    if (!reconnected) return;

    // Falhar aqui é esperado (rede instável volta e cai): os itens continuam na
    // fila e a próxima reconexão tenta de novo.
    syncEngine.sync().catch(() => {});
  });
}
