import type { WorkoutType } from './types';

export type ExerciseInput = {
  exerciseId: string;
  name: string;
  load: string;
  note: string;
};

export type StrengthExecutionPayload = {
  trainingSheetId: string;
  workoutType: Exclude<WorkoutType, 'run'>;
  date: string;
  exercises: Array<{
    exerciseId: string;
    loadKg: number | null;
    note: string | null;
    skipped: boolean;
  }>;
};

type Validation = { valid: true; value: number | null } | { valid: false; message: string };

export function validateLoad(raw: string): Validation {
  const value = raw.trim();
  if (value === '') return { valid: true, value: null };
  if (!/^-?\d+(?:[.,]\d+)?$/.test(value)) {
    return { valid: false, message: 'Informe uma carga válida em quilogramas.' };
  }

  const decimals = value.split(/[.,]/)[1];
  if (decimals !== undefined && decimals.length > 2) {
    return { valid: false, message: 'Use no máximo 2 casas decimais na carga.' };
  }

  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999.99) {
    return { valid: false, message: 'A carga deve ficar entre 0 e 999,99 kg.' };
  }

  return { valid: true, value: parsed };
}

export function prepareStrengthExecution(
  trainingSheetId: string,
  workoutType: Exclude<WorkoutType, 'run'>,
  date: string,
  inputs: ExerciseInput[],
):
  | { status: 'invalid'; message: string }
  | { status: 'ready'; payload: StrengthExecutionPayload }
  | {
      status: 'confirmSkipped';
      skippedExerciseNames: string[];
      payload: StrengthExecutionPayload;
    } {
  const exercises: StrengthExecutionPayload['exercises'] = [];
  const skippedExerciseNames: string[] = [];

  for (const input of inputs) {
    const load = validateLoad(input.load);
    if (!load.valid) return { status: 'invalid', message: `${input.name}: ${load.message}` };
    if (input.note.length > 200) {
      return {
        status: 'invalid',
        message: `A observação de ${input.name} deve ter no máximo 200 caracteres.`,
      };
    }

    const skipped = load.value === null || load.value === 0;
    if (skipped) skippedExerciseNames.push(input.name);
    exercises.push({
      exerciseId: input.exerciseId,
      loadKg: skipped ? null : load.value,
      note: input.note.trim() || null,
      skipped,
    });
  }

  const payload: StrengthExecutionPayload = {
    trainingSheetId,
    workoutType,
    date,
    exercises,
  };

  return skippedExerciseNames.length > 0
    ? { status: 'confirmSkipped', skippedExerciseNames, payload }
    : { status: 'ready', payload };
}
