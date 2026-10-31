import type { ExerciseDetail, TrainingSessionDetail } from '../api/queryApi';
import type { TrainingSheet } from '../coaching/types';
import type { PendingRecord } from '../sync/types';
import { pendingSessions } from './latestWorkoutState';

type Body = Record<string, unknown>;

const isBody = (value: unknown): value is Body =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * O detalhe de um treino que ainda está na fila (`pending:{chave}:{modalidade}`).
 *
 * A fila guarda só o id do exercício, a carga, a nota e se foi pulado — nome,
 * séries e repetições vêm da ficha em cache. Só se usa a ficha quando é a mesma
 * em que o treino foi feito e todos os exercícios estão nela; do contrário a
 * lista fica `null` em vez de parcial ou trocada por outra prescrição.
 *
 * `null` quando o registro já saiu da fila (sincronizou entre o toque e a abertura).
 */
export function pendingWorkoutDetail(
  records: readonly PendingRecord[],
  id: string,
  sheet: TrainingSheet | null,
): TrainingSessionDetail | null {
  for (const record of records) {
    const summary = pendingSessions(record).find((item) => item.id === id);
    if (!summary) continue;

    return { ...summary, exercises: summary.kind === 'strength' ? pendingExercises(record, sheet) : null };
  }
  return null;
}

function strengthBody(record: PendingRecord): Body | null {
  if (!isBody(record.payload)) return null;
  if (record.kind === 'strengthWorkout') return record.payload;
  return record.kind === 'combinedWorkout' && isBody(record.payload.strength) ? record.payload.strength : null;
}

function pendingExercises(record: PendingRecord, sheet: TrainingSheet | null): ExerciseDetail[] | null {
  const body = strengthBody(record);
  if (!body || !sheet || body.trainingSheetId !== sheet.id || !Array.isArray(body.exercises)) return null;

  const prescriptions = new Map(
    sheet.workouts.flatMap((workout) => workout.exercises).map((exercise) => [exercise.id, exercise]),
  );

  const details: ExerciseDetail[] = [];
  for (const item of body.exercises) {
    if (!isBody(item)) return null;
    const prescription = typeof item.exerciseId === 'string' ? prescriptions.get(item.exerciseId) : undefined;
    if (!prescription) return null;

    details.push({
      name: prescription.name,
      sets: prescription.sets,
      repetitions: prescription.repetitions,
      loadKg: typeof item.loadKg === 'number' ? item.loadKg : null,
      note: typeof item.note === 'string' ? item.note : null,
      skipped: item.skipped === true,
      durationSeconds: prescription.durationSeconds,
    });
  }
  return details;
}
