import type { WeekPlanDay } from './trainingPlanDocument';
import type { MuscleGroup } from '../training/labels';

/**
 * O grupo muscular que a grade do dia indica (specs/STORY-012, regra 8).
 *
 * Só três dos cinco dias de musculação mapeiam sem ambiguidade. Segunda e sexta
 * dizem "Perna (pesada)"/"Perna (leve)" e os exercícios cobrem **as duas**
 * pernas — agachamento é frontal, RDL é posterior —, enquanto o registro pede
 * uma só. Pré-selecionar ali seria a tela escolhendo por quem treinou; devolver
 * `null` deixa a escolha com o corredor.
 */
const GROUP_BY_FOCUS: Record<string, MuscleGroup> = {
  'Peito e tríceps': 'PeitoTriceps',
  Ombro: 'Ombro',
  'Costas e bíceps': 'BicepsCostas',
};

export function plannedMuscleGroup(day: WeekPlanDay): MuscleGroup | null {
  return GROUP_BY_FOCUS[day.focus] ?? null;
}
