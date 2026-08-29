import type { CoachingHistory, StrengthHistoryItem } from './types';

type RunItem = CoachingHistory['runningSessions'][number];

export type TimelineItem =
  | { kind: 'strength'; date: string; execution: StrengthHistoryItem }
  | { kind: 'run'; date: string; run: RunItem };

/**
 * O histórico do personal como uma linha do tempo (STORY-020).
 *
 * Antes a tela listava todas as musculações e só então todas as corridas: o
 * treino de hoje ficava no rodapé, abaixo do de ontem, e o personal concluía
 * que o registro não tinha chegado. Agrupar por modalidade só faz sentido para
 * quem já sabe o que procurar — quem abre a tela quer ver o último treino.
 */
export function coachingTimeline(history: CoachingHistory | null): TimelineItem[] {
  if (history === null) return [];

  const items: TimelineItem[] = [
    ...history.strengthExecutions.map((execution): TimelineItem => ({
      kind: 'strength', date: execution.date, execution,
    })),
    ...history.runningSessions.map((run): TimelineItem => ({
      kind: 'run', date: run.date, run,
    })),
  ];

  // Datas em ISO comparam-se lexicograficamente — sem `Date`, sem fuso.
  return items.sort((a, b) => b.date.localeCompare(a.date));
}
