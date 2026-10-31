/** Dados mínimos para ordenar treinos da dashboard (STORY-024). */
export type WorkoutOrder = {
  id: string;
  kind: 'running' | 'strength';
  /** Data local da realização, em formato ISO. */
  date: string;
  /** Momento do registro em UTC; indisponível nos registros legados. */
  registeredAt: string | null;
};

/** Seleciona o último treino por modalidade e sinaliza empates sem ordem conhecida. */
export function latestWorkouts<T extends WorkoutOrder>(workouts: readonly T[]): {
  running: T | null;
  strength: T | null;
  orderUnknown: { running: boolean; strength: boolean };
} {
  const latest: { running: T | null; strength: T | null } = { running: null, strength: null };
  const orderUnknown = { running: false, strength: false };

  for (const workout of workouts) {
    const previous = latest[workout.kind];
    if (previous === null || workout.date > previous.date) {
      latest[workout.kind] = workout;
      orderUnknown[workout.kind] = false;
      continue;
    }
    if (workout.date !== previous.date || workout.id === previous.id) continue;

    const currentTime = workout.registeredAt === null ? NaN : Date.parse(workout.registeredAt);
    const previousTime = previous.registeredAt === null ? NaN : Date.parse(previous.registeredAt);
    if (!Number.isFinite(currentTime) || !Number.isFinite(previousTime) || currentTime === previousTime) {
      orderUnknown[workout.kind] = true;
    }
    if (Number.isFinite(currentTime) && Number.isFinite(previousTime) && currentTime > previousTime) {
      latest[workout.kind] = workout;
    }
  }

  return { ...latest, orderUnknown };
}
