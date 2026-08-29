import { z } from 'zod';
import type {
  ExerciseDraft,
  NumericRange,
  RunPrescriptionDraft,
  TrainingSheetDraft,
} from './types';

/**
 * Validação do formulário da ficha do personal (STORY-017).
 *
 * O schema valida **estrutura**: está preenchido? é número? o máximo é maior
 * que o mínimo? Os **limites** (séries 1–20, repetições 1–100, esforço 1–10)
 * continuam sendo regra de domínio e vivem só no backend — replicá-los aqui
 * criaria uma segunda fonte da verdade que diverge silenciosamente na próxima
 * mudança de regra.
 *
 * O erro sai endereçado por campo (`push.0.sets`, `tuesdayRun.distanceMax`)
 * para que a tela realce o campo, em vez de exibir uma frase no topo.
 */

export const OBSERVATION_MAX_LENGTH = 200;

export type ExerciseFormInput = {
  name: string;
  sets: string;
  repetitions: string;
  durationSeconds: string;
  observation: string;
};

export type RunPrescriptionFormInput = {
  description: string;
  /**
   * Quilometragem do dia — valor único, não faixa. O personal escreve "5,4",
   * como no registro de corrida; a vírgula decimal é a forma brasileira e é o
   * que o teclado do aparelho oferece.
   */
  distanceKm: string;
  durationMin: string;
  durationMax: string;
  effortMin: string;
  effortMax: string;
};

export type TrainingSheetFormInput = {
  push: ExerciseFormInput[];
  pull: ExerciseFormInput[];
  lower: ExerciseFormInput[];
  tuesdayRun: RunPrescriptionFormInput;
  thursdayRun: RunPrescriptionFormInput;
  saturdayRun: RunPrescriptionFormInput;
};

/** Erros por caminho de campo: `{ 'push.0.name': 'Informe o exercício.' }`. */
export type FieldErrors = Record<string, string>;

export type TrainingSheetFormResult =
  | { ok: true; draft: TrainingSheetDraft }
  | { ok: false; errors: FieldErrors };

export const emptyExerciseInput = (): ExerciseFormInput => ({
  name: '', sets: '', repetitions: '', durationSeconds: '', observation: '',
});

export const emptyRunInput = (): RunPrescriptionFormInput => ({
  description: '',
  distanceKm: '',
  durationMin: '', durationMax: '',
  effortMin: '', effortMax: '',
});

const requiredText = (message: string) =>
  z.string().transform((value) => value.trim()).refine((value) => value !== '', { message });

/**
 * Campo inteiro: fracionário é erro do campo. Sem isso o valor decimal passaria
 * daqui e quebraria na desserialização do `int` da API, devolvendo um 400
 * opaco em vez de uma mensagem endereçada ao campo.
 */
const isInteger = (value: string) => Number.isInteger(toNumber(value));

/** Vírgula é separador decimal aqui, como já era em `app/log/run.tsx`. */
const toNumber = (value: string) => Number(value.replace(',', '.'));

/** Campo numérico obrigatório: em branco e não-numérico são erros distintos. */
const requiredNumber = (missing: string, invalid: string, integer = false) =>
  z.string()
    .transform((value) => value.trim())
    .refine((value) => value !== '', { message: missing })
    .refine((value) => Number.isFinite(toNumber(value)), { message: invalid })
    .refine((value) => !integer || isInteger(value), { message: invalid })
    .transform(toNumber);

/** Campo numérico opcional: em branco é ausência, nunca zero (ADR-012). */
const optionalNumber = (invalid: string, integer = false) =>
  z.string()
    .transform((value) => value.trim())
    .refine((value) => value === '' || Number.isFinite(toNumber(value)), { message: invalid })
    .refine((value) => value === '' || !integer || isInteger(value), { message: invalid })
    .transform((value): number | null => (value === '' ? null : toNumber(value)));

/** Texto opcional: em branco é ausência, nunca string vazia. */
const optionalText = (max: number, tooLong: string) =>
  z.string()
    .transform((value) => value.trim())
    .refine((value) => value.length <= max, { message: tooLong })
    .transform((value): string | null => (value === '' ? null : value));

const exerciseSchema = z.object({
  name: requiredText('Informe o nome do exercício.'),
  sets: requiredNumber('Informe as séries.', 'As séries devem ser um número inteiro.', true),
  repetitions: requiredNumber(
    'Informe as repetições.', 'As repetições devem ser um número inteiro.', true),
  durationSeconds: optionalNumber('O tempo deve ser um número inteiro de segundos.', true),
  observation: optionalText(
    OBSERVATION_MAX_LENGTH,
    `A observação aceita no máximo ${OBSERVATION_MAX_LENGTH} caracteres.`),
}) satisfies z.ZodType<ExerciseDraft, ExerciseFormInput>;

const runSchema = z
  .object({
    description: requiredText('Informe a descrição da corrida.'),
    distanceKm: optionalNumber('A distância deve ser um número, como 5,4.'),
    durationMin: optionalNumber('O mínimo de duração deve ser um número inteiro.', true),
    durationMax: optionalNumber('O máximo de duração deve ser um número inteiro.', true),
    effortMin: optionalNumber('O mínimo de esforço deve ser um número inteiro.', true),
    effortMax: optionalNumber('O máximo de esforço deve ser um número inteiro.', true),
  })
  .superRefine((value, ctx) => {
    checkRange(ctx, value.durationMin, value.durationMax, 'duration', 'duração');
    checkRange(ctx, value.effortMin, value.effortMax, 'effort', 'esforço');
  })
  .transform((value): RunPrescriptionDraft => ({
    description: value.description,
    // Alvo exato: a distância nunca é faixa (ADR-012 aceita `max` ausente).
    distanceKm: value.distanceKm === null ? null : { min: value.distanceKm, max: null },
    durationMinutes: range(value.durationMin, value.durationMax),
    perceivedEffort: range(value.effortMin, value.effortMax),
  }));

const trainingSheetSchema = z.object({
  push: z.array(exerciseSchema),
  pull: z.array(exerciseSchema),
  lower: z.array(exerciseSchema),
  tuesdayRun: runSchema,
  thursdayRun: runSchema,
  saturdayRun: runSchema,
});

export function parseTrainingSheetForm(input: TrainingSheetFormInput): TrainingSheetFormResult {
  const result = trainingSheetSchema.safeParse(input);
  return result.success
    ? { ok: true, draft: result.data }
    : { ok: false, errors: fieldErrors(result.error) };
}

/**
 * O máximo exige um mínimo correspondente e precisa ser maior que ele — a
 * mesma regra que `NumericRange` aplica no domínio. O erro é ancorado no campo
 * que o personal precisa corrigir, não no par.
 */
function checkRange(
  ctx: z.RefinementCtx,
  min: number | null,
  max: number | null,
  field: 'distance' | 'duration' | 'effort',
  label: string,
) {
  if (min === null && max !== null) {
    ctx.addIssue({
      code: 'custom',
      path: [`${field}Min`],
      message: `Informe o mínimo de ${label} antes do máximo.`,
    });
    return;
  }

  if (min !== null && max !== null && max <= min) {
    ctx.addIssue({
      code: 'custom',
      path: [`${field}Max`],
      message: `O máximo de ${label} deve ser maior que o mínimo.`,
    });
  }
}

function range(min: number | null, max: number | null): NumericRange | null {
  return min === null ? null : { min, max };
}

/**
 * Achata os issues do zod em `caminho → primeira mensagem`. A primeira vence:
 * mostrar duas mensagens no mesmo campo não ajuda quem está corrigindo.
 */
function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (errors[path] === undefined) errors[path] = issue.message;
  }
  return errors;
}
