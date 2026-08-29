import type { QueryResult, TrainingSessionSummary } from '../api/queryApi';
import type { LoggedSession } from './dayCompletion';

/**
 * Tudo que conta como treino registrado (specs/STORY-012, regras 16 e 25).
 *
 * O que está na fila conta igual ao que já subiu: o corredor registrou o treino
 * e recebeu a confirmação na hora (ADR-003). Fazer o dia esperar o sync seria
 * desmentir essa confirmação justamente quando ela mais vale — na rua, sem sinal.
 *
 * Os três desfechos são distintos de propósito, no mesmo formato que o
 * `PlanListState` já usa: lista vazia diria "você não treinou nada" (o erro que
 * o ADR-004 nomeou), e sessão perdida disfarçada de falha de rede deixaria o
 * corredor olhando um aviso de conexão quando o que ele precisa é do login.
 */
export type LoggedSessionsResult =
  | { status: 'ok'; sessions: readonly LoggedSession[] }
  /** Sem rede, timeout ou erro do servidor. Nunca vira 0% de avanço. */
  | { status: 'unavailable' }
  /** 401 mesmo depois de renovar o token — a tela precisa levar ao login. */
  | { status: 'sessionLost' };

/** Interface estreita: a conta lê a fila, não precisa do `RecordQueue` inteiro. */
export interface PendingSessionSource {
  pending(): Promise<readonly { kind: string; payload: unknown }[]>;
}

export interface TrainingHistoryReader {
  trainingHistory(): Promise<QueryResult<TrainingSessionSummary[]>>;
}

export async function loadLoggedSessions(
  queue: PendingSessionSource,
  api: TrainingHistoryReader,
): Promise<LoggedSessionsResult> {
  const [enfileirados, resultado] = await Promise.all([queue.pending(), api.trainingHistory()]);

  if (resultado.status === 'unauthenticated') return { status: 'sessionLost' };
  if (resultado.status !== 'ok') return { status: 'unavailable' };

  const doServidor = resultado.data.map(
    (sessao): LoggedSession => ({ date: sessao.date, kind: sessao.kind }),
  );

  // Plano e dor também moram na fila, e nenhum dos dois cumpre dia de treino.
  const naFila = enfileirados.flatMap(toLoggedSessions);

  // Sem deduplicar: um registro pode estar nos dois lados até o sync confirmar a
  // remoção, e o estado do dia é binário por modalidade — contar duas vezes dá
  // no mesmo (regra 18).
  return { status: 'ok', sessions: [...doServidor, ...naFila] };
}

/**
 * Um item da fila pode valer zero, uma ou duas sessões. `strengthWorkout` é a
 * musculação registrada pela ficha do personal e vale o mesmo que a avulsa;
 * `combinedWorkout` carrega musculação e corrida do mesmo dia numa unidade só
 * (ADR-011), então cumpre as duas modalidades. Ignorá-los deixava o dia aberto
 * justamente para quem registra pelo caminho principal do app.
 */
function toLoggedSessions(item: { kind: string; payload: unknown }): LoggedSession[] {
  if (item.kind === 'running' || item.kind === 'strength') {
    return [{ date: (item.payload as { date: string }).date, kind: item.kind }];
  }

  if (item.kind === 'strengthWorkout') {
    return [{ date: (item.payload as { date: string }).date, kind: 'strength' }];
  }

  if (item.kind === 'combinedWorkout') {
    const { strength, running } = item.payload as {
      strength: { date: string };
      running: { date: string };
    };
    return [
      { date: strength.date, kind: 'strength' },
      { date: running.date, kind: 'running' },
    ];
  }

  return [];
}
