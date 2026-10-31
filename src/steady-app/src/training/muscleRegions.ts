/**
 * Quais regiões do corpo o detalhe da musculação destaca (ADR-021, STORY-025).
 *
 * Tabela fechada: valor fora dela não destaca nada, em vez de presumir um
 * músculo. Quando a STORY-024 entregar músculos por exercício, esta função
 * passa a ler deles e a tabela por grupo/tipo some.
 */

export type MuscleRegion =
  | 'peitoral'
  | 'triceps'
  | 'ombro'
  | 'biceps'
  | 'dorsal'
  | 'trapezio'
  | 'quadriceps'
  | 'posterior'
  | 'gluteo'
  | 'panturrilha';

/** Nome em texto de cada região, para o leitor de tela e a lista abaixo do corpo. */
export const MUSCLE_REGION_LABELS: Record<MuscleRegion, string> = {
  peitoral: 'Peitoral',
  triceps: 'Tríceps',
  ombro: 'Ombro',
  biceps: 'Bíceps',
  dorsal: 'Dorsal',
  trapezio: 'Trapézio',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteo: 'Glúteo',
  panturrilha: 'Panturrilha',
};

const PUSH: MuscleRegion[] = ['peitoral', 'triceps', 'ombro'];
const PULL: MuscleRegion[] = ['biceps', 'dorsal', 'trapezio'];

const BY_MUSCLE_GROUP: Record<string, MuscleRegion[]> = {
  PeitoTriceps: PUSH,
  Ombro: ['ombro'],
  BicepsCostas: PULL,
  PernaFrontal: ['quadriceps'],
  PernaPosterior: ['posterior', 'gluteo'],
};

const BY_WORKOUT_TYPE: Record<string, MuscleRegion[]> = {
  push: PUSH,
  pull: PULL,
  lower: ['quadriceps', 'posterior', 'gluteo', 'panturrilha'],
};

type MuscleSource = {
  muscleGroup: string | null;
  workoutType: string | null;
  exercises?: { skipped: boolean }[] | null;
};

export function muscleRegions(source: MuscleSource): MuscleRegion[] {
  if (source.workoutType !== null) {
    // Execução da ficha: sem exercício realizado não há músculo trabalhado.
    const realizedAny = source.exercises?.some((exercise) => !exercise.skipped) ?? false;
    return realizedAny ? BY_WORKOUT_TYPE[source.workoutType] ?? [] : [];
  }

  return source.muscleGroup === null ? [] : BY_MUSCLE_GROUP[source.muscleGroup] ?? [];
}
