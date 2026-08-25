export function formatExercisePrescription(sets: number, repetitions: number): string {
  const setsLabel = sets === 1 ? 'série' : 'séries';
  const repetitionsLabel = repetitions === 1 ? 'repetição' : 'repetições';
  return `${sets} ${setsLabel} de ${repetitions} ${repetitionsLabel}`;
}
