import type { PlanProgress } from '../planning/planProgress';
import { PLAN_TOTAL_WEEKS } from '../planning/trainingProgress';

/**
 * O avanço do plano já resolvido em texto (specs/STORY-012, regras 23 a 25).
 *
 * `note` existe por uma razão só: um corredor que entrou na semana 15 e cumpriu
 * tudo termina em 42%, e 42% sem explicação se lê como fracasso. O número é
 * honesto; o texto ao lado é o que impede que ele minta por omissão.
 */
export type PlanProgressView =
  /** Sem plano, antes do início, ou prova passada — a Dashboard não mostra nada. */
  | { status: 'hidden' }
  | { status: 'unavailable'; headline: null; detail: string; note: null }
  | { status: 'ok'; headline: string; percent: number; detail: string; note: string | null };

export function planProgressView(progress: PlanProgress): PlanProgressView {
  if (progress.status === 'none') return { status: 'hidden' };

  // Nunca "0%": não conseguir ler não é o corredor não ter treinado (ADR-004).
  if (progress.status === 'unavailable') {
    return {
      status: 'unavailable',
      headline: null,
      detail: 'Não foi possível ler seus registros agora.',
      note: null,
    };
  }

  return {
    status: 'ok',
    headline: `${progress.percent}%`,
    percent: progress.percent,
    detail: `${progress.completed} de ${progress.total} treinos do plano`,
    note:
      progress.enteredAtWeek === null
        ? null
        : `Você entrou na semana ${progress.enteredAtWeek} — o plano completo tem ${PLAN_TOTAL_WEEKS}`,
  };
}
