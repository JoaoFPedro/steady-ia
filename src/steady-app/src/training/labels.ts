/**
 * Vocabulário de treino em português, espelhando `Steady.Domain.Training`.
 *
 * Fica aqui, e não na tela de registro, porque o histórico precisa exibir os
 * mesmos rótulos que o corredor escolheu ao registrar — dois mapas separados
 * divergiriam no primeiro grupo muscular novo.
 */

export type MuscleGroup =
  | 'PeitoTriceps'
  | 'Ombro'
  | 'PernaFrontal'
  | 'PernaPosterior'
  | 'BicepsCostas';

export type Intensity = 'Leve' | 'Moderado' | 'Pesado';

/** Na ordem em que a tela de registro oferece: perna primeiro, por ser o que a avaliação cruza. */
export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'PernaFrontal', label: 'Perna frontal' },
  { value: 'PernaPosterior', label: 'Perna posterior' },
  { value: 'PeitoTriceps', label: 'Peito e tríceps' },
  { value: 'BicepsCostas', label: 'Bíceps e costas' },
  { value: 'Ombro', label: 'Ombro' },
];

export const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: 'Leve', label: 'Leve' },
  { value: 'Moderado', label: 'Moderado' },
  { value: 'Pesado', label: 'Pesado' },
];

const byValue = (options: { value: string; label: string }[], value: string | null): string | null =>
  options.find((option) => option.value === value)?.label ?? value;

export const muscleGroupLabel = (value: string | null): string | null =>
  byValue(MUSCLE_GROUPS, value);

export const intensityLabel = (value: string | null): string | null => byValue(INTENSITIES, value);
