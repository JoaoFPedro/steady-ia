import { addDays } from '../features/date';
import { PLAN_TOTAL_WEEKS, parseIsoDate } from './trainingProgress';

/**
 * A janela do plano: os 168 dias que terminam na data da prova
 * (specs/STORY-012, regra 19).
 *
 * 24 semanas × 7 dias fecham exatamente 24 de cada dia da semana — é o que faz
 * o denominador de 144 (6 dias com treino × 24) ser exato, e não uma
 * aproximação. Registro fora desta janela não conta para nada.
 */
export const PLAN_WINDOW_DAYS = PLAN_TOTAL_WEEKS * 7;

export type PlanWindow = { start: Date; end: Date };

export function planWindow(raceDate: string): PlanWindow | null {
  const prova = parseIsoDate(raceDate);
  if (prova === null) return null;

  return { start: addDays(prova, -(PLAN_WINDOW_DAYS - 1)), end: prova };
}
