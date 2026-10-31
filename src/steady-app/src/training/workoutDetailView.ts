import type { ExerciseDetail, TrainingSessionDetail } from '../api/queryApi';
import { intensityLabel, muscleGroupLabel, WORKOUT_LABELS } from './labels';
import { MUSCLE_REGION_LABELS, muscleRegions, type MuscleRegion } from './muscleRegions';

/** Um exercício pronto para a tela: uma linha de texto por série, sem lógica sobrando lá. */
export type ExerciseView = {
  name: string;
  skipped: boolean;
  /** `["1 · 10 reps · 20 kg", ...]`; vazio no exercício pulado. */
  sets: string[];
  note: string | null;
};

export type WorkoutDetailView = {
  title: string;
  /** "Empurrada" (treino da ficha) ou o grupo muscular da avulsa. */
  subtitle: string | null;
  /** `dd/mm/aaaa`, como o card da dashboard. */
  date: string;
  pending: boolean;
  /** Só as métricas que existem: dado ausente não aparece como zero. */
  metrics: { label: string; value: string }[];
  regions: MuscleRegion[];
  regionLabels: string[];
  mapNotice: string | null;
  /** `null` quando o registro não detalha exercícios (musculação avulsa). */
  exercises: ExerciseView[] | null;
  exercisesNotice: string | null;
};

const NO_MUSCLES = 'Nenhum músculo trabalhado neste registro.';
const NO_EXERCISES = 'Este registro não detalha exercícios.';

export function workoutDetailView(session: TrainingSessionDetail): WorkoutDetailView {
  const regions = muscleRegions(session);
  const exercises = session.exercises?.map(toExerciseView) ?? null;

  return {
    title: 'Musculação',
    subtitle: subtitleOf(session),
    date: formatDate(session.date),
    pending: session.pending === true,
    metrics: metricsOf(session),
    regions,
    regionLabels: regions.map((region) => MUSCLE_REGION_LABELS[region]),
    mapNotice: regions.length === 0 ? NO_MUSCLES : null,
    exercises,
    exercisesNotice: exercises === null ? NO_EXERCISES : null,
  };
}

function subtitleOf(session: TrainingSessionDetail): string | null {
  if (session.workoutType !== null) return WORKOUT_LABELS[session.workoutType] ?? null;
  return muscleGroupLabel(session.muscleGroup);
}

function metricsOf(session: TrainingSessionDetail): { label: string; value: string }[] {
  const metrics: { label: string; value: string }[] = [];

  if (session.exercises !== null) {
    const realized = session.exercises.filter((exercise) => !exercise.skipped);
    const total = session.exercises.length;
    metrics.push({
      label: 'Exercícios',
      value: realized.length === total ? String(total) : `${realized.length} de ${total}`,
    });
    metrics.push({ label: 'Séries', value: String(realized.reduce((sum, item) => sum + item.sets, 0)) });
  } else {
    const group = muscleGroupLabel(session.muscleGroup);
    const intensity = intensityLabel(session.intensity);
    if (group !== null) metrics.push({ label: 'Grupo muscular', value: group });
    if (intensity !== null) metrics.push({ label: 'Intensidade', value: intensity });
  }

  if (session.durationMinutes !== null) metrics.push({ label: 'Duração', value: `${session.durationMinutes} min` });
  return metrics;
}

function toExerciseView(exercise: ExerciseDetail): ExerciseView {
  const amount = exercise.durationSeconds === null ? `${exercise.repetitions} reps` : `${exercise.durationSeconds} s`;
  const load = exercise.loadKg === null ? null : `${String(exercise.loadKg).replace('.', ',')} kg`;

  return {
    name: exercise.name,
    skipped: exercise.skipped,
    sets: exercise.skipped
      ? []
      : Array.from({ length: exercise.sets }, (_, index) =>
          [String(index + 1), amount, load].filter((part): part is string => part !== null).join(' · ')),
    note: exercise.note,
  };
}

/** Das partes do ISO, sem `Date`: em fuso negativo o dia sairia errado. */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
}
