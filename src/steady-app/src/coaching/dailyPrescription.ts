import type { RunPrescription, TrainingSheet, WorkoutPrescription } from './types';

export type DailyPrescription = {
  strength: WorkoutPrescription | null;
  run: RunPrescription | null;
};

const STRENGTH_BY_DAY = ['lower', 'push', 'push', 'pull', 'lower', null, null] as const;
const RUN_DAY = { 1: 'tuesday', 3: 'thursday', 5: 'saturday' } as const;

export function dailyPrescription(
  sheet: TrainingSheet | null,
  dayIndex: number,
): DailyPrescription {
  if (sheet === null) return { strength: null, run: null };

  const strengthType = STRENGTH_BY_DAY[dayIndex] ?? null;
  const strength = strengthType === null
    ? null
    : sheet.workouts.find((workout) => workout.type === strengthType) ?? null;
  const run = sheet.workouts.find((workout) => workout.type === 'run');
  const runDay = RUN_DAY[dayIndex as keyof typeof RUN_DAY];

  return {
    strength,
    run: runDay === undefined ? null : run?.runDescriptions?.[runDay] ?? null,
  };
}
