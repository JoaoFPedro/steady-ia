/**
 * Vocabulário do formulário de solicitação de plano — espelha
 * `.discovery/referencias/plano-treino-input-schema.md`, o `TrainingPlanRequest`.
 *
 * Mesmo padrão de `training/labels.ts`: arrays de `{ value, label }` prontos
 * para `Choice`/`MultiChoice`.
 */

export type RaceDistance = '5' | '10' | '21.1' | '42.2' | 'ultra';
export type Weekday = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sáb' | 'dom';
export type TrainingDaysPerWeek = '3' | '4' | '5' | '6';
export type EquipmentAccess = 'academia_completa' | 'halteres_casa' | 'peso_corporal';
export type PainArea = 'canela' | 'joelho' | 'it_band' | 'lombar' | 'tornozelo' | 'panturrilha' | 'nenhuma';

export const RACE_DISTANCES: { value: RaceDistance; label: string }[] = [
  { value: '5', label: '5km' },
  { value: '10', label: '10km' },
  { value: '21.1', label: '21km (meia)' },
  { value: '42.2', label: '42km (maratona)' },
  { value: 'ultra', label: 'Ultra' },
];

export const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sáb', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

export const TRAINING_DAYS_PER_WEEK: { value: TrainingDaysPerWeek; label: string }[] = [
  { value: '3', label: '3 dias' },
  { value: '4', label: '4 dias' },
  { value: '5', label: '5 dias' },
  { value: '6', label: '6 dias' },
];

/** `sub` explica o que muda na prática — RDL e hip thrust exigem carga externa (plano-fonte). */
export const EQUIPMENT_ACCESS: { value: EquipmentAccess; label: string; sub: string }[] = [
  {
    value: 'academia_completa',
    label: 'Academia completa',
    sub: 'Todo o Dia B como descrito — RDL, hip thrust e afundo búlgaro com carga livre.',
  },
  {
    value: 'halteres_casa',
    label: 'Halteres em casa',
    sub: 'RDL e hip thrust adaptados com halteres — mesmo estímulo, carga menor.',
  },
  {
    value: 'peso_corporal',
    label: 'Peso corporal',
    sub: 'RDL vira good morning e hip thrust vira ponte de glúteo — sem carga externa.',
  },
];

export const PAIN_AREAS: { value: PainArea; label: string }[] = [
  { value: 'canela', label: 'Canela' },
  { value: 'joelho', label: 'Joelho' },
  { value: 'it_band', label: 'IT band' },
  { value: 'lombar', label: 'Lombar' },
  { value: 'tornozelo', label: 'Tornozelo' },
  { value: 'panturrilha', label: 'Panturrilha' },
  { value: 'nenhuma', label: 'Nenhuma' },
];

/** "Campos derivados" do schema (seção 3) — o que o app calcula, não pergunta. */
export const DERIVED_FIELDS: string[] = [
  'Duração total do plano e em que semana cai cada fase — Base, Construção, Pico e Taper.',
  'Progressão semanal do longão, respeitando a regra dos 10%.',
  'Zonas de ritmo (fácil, moderado, forte), a partir do seu tempo de referência.',
  'Semanas de recuo a cada 3 semanas de progressão.',
];
