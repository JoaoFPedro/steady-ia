import type { QueryResult } from '../api/queryApi';
import type { PlanRequestPayload, PlanRequestSummary } from './planRequest';

/**
 * O que a aba Planejamento precisa saber, numa leitura só — mesmo formato do
 * `loadHomeState`.
 *
 * `unavailable` existe para não repetir o erro que o ADR-004 nomeou na avaliação
 * de sobrecarga: lista vazia por falha de leitura não pode ser apresentada como
 * "você ainda não criou nenhum planejamento". "Não sei" e "não há" são estados
 * diferentes, e só um deles convida o corredor a criar.
 */
export type PlanListState = {
  status: 'ok' | 'unavailable' | 'sessionLost';
  plans: PlanRequestSummary[];
};

/** Só o que esta tela precisa da fila — não o `RecordQueue` inteiro. */
export interface PendingPlanSource {
  pending(): Promise<readonly { idempotencyKey: string; kind: string; payload: unknown; queuedAt: string }[]>;
}

/** Interface estreita de propósito: a lista lê planejamentos, não a API toda. */
export interface PlanRequestReader {
  planRequests(): Promise<QueryResult<PlanRequestSummary[]>>;
}

export async function loadPlanList(
  queue: PendingPlanSource,
  api: PlanRequestReader,
): Promise<PlanListState> {
  const [enfileirados, resultado] = await Promise.all([queue.pending(), api.planRequests()]);

  const pendentes = enfileirados
    .filter((item) => item.kind === 'plan')
    .map(
      (item): PlanRequestSummary => ({
        ...(item.payload as PlanRequestPayload),
        idempotencyKey: item.idempotencyKey,
        createdAt: item.queuedAt,
        pending: true,
      }),
    );

  if (resultado.status === 'unauthenticated') return { status: 'sessionLost', plans: [] };

  if (resultado.status !== 'ok') return { status: 'unavailable', plans: ordenar(pendentes) };

  // O item pode estar nos dois lados por alguns instantes: já gravado no servidor
  // e ainda na fila, até o sync confirmar a remoção. A versão do servidor vence —
  // é a que carrega o que só ele sabe.
  const doServidor = resultado.data;
  const chavesEnviadas = new Set(doServidor.map((plano) => plano.idempotencyKey));
  const aindaNaFila = pendentes.filter((plano) => !chavesEnviadas.has(plano.idempotencyKey));

  return { status: 'ok', plans: ordenar([...doServidor, ...aindaNaFila]) };
}

const ordenar = (plans: PlanRequestSummary[]) =>
  [...plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
