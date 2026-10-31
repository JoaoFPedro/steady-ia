import type { QueryApi, TrainingSessionSummary } from '../api/queryApi';
import type { PendingRecord } from '../sync/types';
import { latestWorkouts } from './latestWorkouts';

type HistoryReader = Pick<QueryApi, 'trainingHistory'>;
type PendingSource = { pending(): Promise<readonly PendingRecord[]> };
type Latest = ReturnType<typeof latestWorkouts<TrainingSessionSummary>>;

export type LatestWorkoutState =
  | { status: 'loaded'; workouts: Latest }
  | { status: 'unavailable' }
  | { status: 'sessionLost' };

/** Le a fila antes do servidor para não perder um item sincronizado entre as leituras. */
export async function loadLatestWorkoutState(
  api: HistoryReader,
  queue?: PendingSource,
): Promise<LatestWorkoutState> {
  let pending: readonly PendingRecord[];
  try {
    pending = queue ? await queue.pending() : [];
  } catch {
    return { status: 'unavailable' };
  }
  const result = await api.trainingHistory();
  if (result.status === 'unauthenticated') return { status: 'sessionLost' };
  // Sem histórico confiável, não apresentar um item da fila como o último.
  if (result.status === 'failure') return { status: 'unavailable' };
  return { status: 'loaded', workouts: latestWorkouts([...pending.flatMap(pendingSessions), ...result.data]) };
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

const numeric = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;
const text = (value: unknown): string | null => typeof value === 'string' ? value : null;

/** Um registro combinado contribui uma vez para cada modalidade. */
export function pendingSessions(record: PendingRecord): TrainingSessionSummary[] {
  const payload = object(record.payload);
  if (!payload) return [];
  const entries: Array<{ kind: 'running' | 'strength'; body: Record<string, unknown> | null }> = [];
  if (record.kind === 'running') entries.push({ kind: 'running', body: payload });
  if (record.kind === 'strength' || record.kind === 'strengthWorkout') entries.push({ kind: 'strength', body: payload });
  if (record.kind === 'combinedWorkout') {
    entries.push({ kind: 'running', body: object(payload.running) });
    entries.push({ kind: 'strength', body: object(payload.strength) });
  }
  return entries.flatMap(({ kind, body }) => {
    if (!body || typeof body.date !== 'string') return [];
    return [{
      id: `pending:${record.idempotencyKey}:${kind}`,
      kind,
      date: body.date,
      registeredAt: record.queuedAt,
      durationMinutes: numeric(body.durationMinutes),
      distanceKm: numeric(body.distanceKm),
      averagePaceMinPerKm: numeric(body.averagePaceMinPerKm),
      perceivedEffort: numeric(body.perceivedEffort),
      muscleGroup: text(body.muscleGroup),
      intensity: text(body.intensity),
      workoutType: text(body.workoutType),
      pending: true,
    }];
  });
}
