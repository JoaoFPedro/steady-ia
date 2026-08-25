import { addDays, isoDate } from '../features/date';
import { dayCompletion, type DayStatus, type LoggedSession } from './dayCompletion';
import { dayRequirements } from './dayRequirements';
import type { ProgressPlan } from './planProgress';
import { planWindow } from './planWindow';
import type { WeekPlanDay } from './trainingPlanDocument';
import { startOfDay } from './trainingProgress';
import { weekPlanIndexFor } from './weekPlanDay';

/**
 * O estado de cada um dos sete dias que a aba Semana mostra
 * (specs/STORY-012, regras 11 a 15 e 19).
 *
 * Devolve alinhado a `weekPlan`: índice 0 é segunda, 6 é domingo. Fora da
 * janela do plano nada é marcado — dia que o plano nem cobria não é dia falhado.
 */
const DIAS_NA_SEMANA = 7;

export function weekStatuses(
  today: Date,
  plan: ProgressPlan | null,
  sessions: readonly LoggedSession[] | null,
  weekPlan: readonly WeekPlanDay[],
): DayStatus[] {
  const semMarca: DayStatus[] = Array(DIAS_NA_SEMANA).fill('semMarca');
  if (plan === null || sessions === null) return semMarca;

  const janela = planWindow(plan.raceDate);
  if (janela === null) return semMarca;

  const hoje = startOfDay(today);
  const segunda = addDays(hoje, -weekPlanIndexFor(hoje.getDay()));
  const hojeIso = isoDate(hoje);

  return weekPlan.map((dia, indice) => {
    const data = addDays(segunda, indice);
    if (data < janela.start || data > janela.end) return 'semMarca';

    return dayCompletion(isoDate(data), hojeIso, dayRequirements(dia), sessions);
  });
}
