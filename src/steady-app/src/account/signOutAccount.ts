import type { GoogleSession } from '../auth/googleSession';
import type { RecordQueue } from '../sync/recordQueue';
import type { SyncEngine } from '../sync/syncEngine';

/**
 * O que aconteceu com a tentativa de sair, do ponto de vista do corredor.
 *
 * `pendingRecords` é o único desfecho que **não** encerra a sessão: ele existe
 * para o corredor decidir, com o número na mão, se aceita perder o que ainda não
 * foi enviado.
 */
export type SignOutOutcome =
  /** Sessão encerrada. O corredor vai para o login. */
  | { status: 'signedOut' }
  /** Sobrou registro na fila: precisa de confirmação antes de descartar. */
  | { status: 'pendingRecords'; count: number }
  /** O Google recusou encerrar a sessão. O corredor continua autenticado. */
  | { status: 'failed' };

/**
 * Tenta sair da conta preservando o que ainda dá para preservar.
 *
 * Sincroniza primeiro porque na saída com conexão — o caso comum — a fila esvazia
 * e o corredor não vê fricção nenhuma. Só quando sobra pendente é que a pergunta
 * se justifica.
 */
export async function attemptSignOut(
  queue: RecordQueue,
  syncEngine: SyncEngine,
  session: GoogleSession,
): Promise<SignOutOutcome> {
  // Oportunista: falhar aqui é o caso normal de quem está sem sinal, e o número
  // de pendentes logo abaixo já conta a história inteira.
  await syncEngine.sync().catch(() => {});

  const pending = await queue.count();
  if (pending > 0) return { status: 'pendingRecords', count: pending };

  return endSession(session);
}

/**
 * Sai descartando os pendentes — o caminho que o corredor confirmou.
 *
 * A ordem importa e é a razão de este passo ser explícito (ADR-005): descartar
 * depois de encerrar a sessão deixaria, numa falha, uma fila órfã exposta ao
 * próximo corredor. Falhar com a fila já limpa e a sessão ainda ativa é ruim,
 * mas seguro.
 */
export async function discardAndSignOut(
  queue: RecordQueue,
  session: GoogleSession,
): Promise<SignOutOutcome> {
  await queue.clear();

  return endSession(session);
}

async function endSession(session: GoogleSession): Promise<SignOutOutcome> {
  return (await session.signOut()) ? { status: 'signedOut' } : { status: 'failed' };
}
