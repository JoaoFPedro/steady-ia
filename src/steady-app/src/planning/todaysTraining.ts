import type { WeekPlanDay } from './trainingPlanDocument';

/**
 * O que o card "Plano da semana" da Dashboard mostra para o dia atual —
 * lookup puro contra `weekPlan` (STORY-006), sem cálculo de progressão
 * (specs/STORY-007/spec.bdd.md).
 */
export type TodaysTraining = {
  title: string;
  description: string;
};

/** `weekPlan` é seg→dom (índice 0–6); `Date.getDay()` é dom→sáb (0–6). */
const WEEKPLAN_INDEX_BY_JS_WEEKDAY = [6, 0, 1, 2, 3, 4, 5];

export function todaysTraining(jsWeekday: number, weekPlan: WeekPlanDay[]): TodaysTraining {
  const day = weekPlan[WEEKPLAN_INDEX_BY_JS_WEEKDAY[jsWeekday]];

  return {
    title: titleOf(day),
    description: descriptionOf(day),
  };
}

/** O `day.day` já é "Weekday — foco[ + corrida ...]"; usamos só a parte depois do dash. */
function titleOf(day: WeekPlanDay): string {
  return day.day.split(' — ')[1];
}

/** Dias combinados (musculação + corrida) descrevem a corrida em `runNote`; os demais, o dia em `intro`. */
function descriptionOf(day: WeekPlanDay): string {
  const isCombinedDay = day.hasRun && day.focus !== day.runLabel;
  return isCombinedDay ? (day.runNote ?? day.intro) : day.intro;
}
