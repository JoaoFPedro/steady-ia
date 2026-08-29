export function formatExercisePrescription(
  sets: number,
  repetitions: number,
  /** Tempo prescrito em segundos; ausente não vira sufixo vazio (STORY-017). */
  durationSeconds: number | null = null,
): string {
  const setsLabel = sets === 1 ? 'série' : 'séries';
  const repetitionsLabel = repetitions === 1 ? 'repetição' : 'repetições';
  const prescription = `${sets} ${setsLabel} de ${repetitions} ${repetitionsLabel}`;

  return durationSeconds === null ? prescription : `${prescription} · ${durationSeconds}s`;
}
