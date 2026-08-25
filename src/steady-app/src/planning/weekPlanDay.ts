import type { WeekPlanDay } from './trainingPlanDocument';

/**
 * Ponte entre as duas convenções de dia da semana que o app precisa cruzar.
 *
 * `weekPlan` é seg→dom (índice 0–6); `Date.getDay()` é dom→sáb (0–6). O
 * deslocamento vive aqui, e só aqui: duplicá-lo é convidar um erro de um dia
 * que passa silencioso — o treino certo no dia errado.
 */
const DAYS_IN_WEEK = 7;

export const weekPlanIndexFor = (jsWeekday: number) => (jsWeekday + 6) % DAYS_IN_WEEK;

export function weekPlanDayFor(jsWeekday: number, weekPlan: readonly WeekPlanDay[]): WeekPlanDay {
  return weekPlan[weekPlanIndexFor(jsWeekday)];
}
