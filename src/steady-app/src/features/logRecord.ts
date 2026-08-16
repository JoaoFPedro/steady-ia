import type { RecordQueue } from '../sync/recordQueue';
import type { SyncEngine } from '../sync/syncEngine';
import type { RecordKind } from '../sync/types';

/**
 * O que aconteceu com o registro, do ponto de vista do corredor.
 *
 * `saved` e `pending` são os dois desfechos bem-sucedidos: em ambos o registro
 * está guardado. A diferença entre eles é do app, não dele.
 */
export type LogOutcome =
  /** Guardado e já no servidor. */
  | { status: 'saved' }
  /** Guardado na fila; a rede falhou e será reenviado depois. */
  | { status: 'pending' }
  /** A API recusou o conteúdo (400): não adianta reenviar, o corredor precisa saber. */
  | { status: 'rejected'; message: string }
  /** A sessão caiu. A fila fica intacta — nenhum registro se perde no login. */
  | { status: 'sessionLost' };

/**
 * Registra um treino do jeito que a STORY-003 exige: fila primeiro, rede depois.
 *
 * O corredor tem o registro garantido assim que ele entra na fila — a conexão
 * não faz parte do contrato com ele. O envio em seguida é oportunista: falhar
 * ali não desfaz nada.
 */
export async function logRecord(
  queue: RecordQueue,
  syncEngine: SyncEngine,
  kind: RecordKind,
  payload: unknown,
): Promise<LogOutcome> {
  await queue.enqueue(kind, payload);

  const summary = await syncEngine.sync();

  const rejected = summary.rejected.find((r) => r.kind === kind);
  if (rejected) return { status: 'rejected', message: rejected.message };

  if (summary.unauthenticated) return { status: 'sessionLost' };

  return summary.deferred > 0 ? { status: 'pending' } : { status: 'saved' };
}
