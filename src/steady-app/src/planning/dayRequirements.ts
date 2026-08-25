import type { WeekPlanDay } from './trainingPlanDocument';

/**
 * O que um dia da grade prevê (specs/STORY-012, regra 4).
 *
 * Não há campo novo em `trainingPlanDocument`: `hasRun` já diz da corrida e a
 * lista de exercícios já diz da musculação. Sábado tem `exercises: []` (longão
 * sem musculação) e domingo não tem nem uma coisa nem outra.
 */
export type DayRequirements = { run: boolean; strength: boolean };

export function dayRequirements(day: WeekPlanDay): DayRequirements {
  return { run: day.hasRun, strength: day.exercises.length > 0 };
}

/** Domingo — nada previsto, nada a cumprir, nada a marcar (regra 15). */
export const requiresTraining = (previsto: DayRequirements) => previsto.run || previsto.strength;
