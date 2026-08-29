import type { NumericRange, RunPrescriptionDraft } from './types';

export type RunPrescriptionFormInput = {
  description: string;
  distanceMin: string;
  distanceMax: string;
  durationMin: string;
  durationMax: string;
  effortMin: string;
  effortMax: string;
};

export type RunPrescriptionFormResult =
  | { ok: true; draft: RunPrescriptionDraft }
  | { ok: false; message: string };

/**
 * Converte o formulário do personal em `RunPrescriptionDraft` (ADR-012).
 * Só valida a estrutura da faixa (é número? o máximo é maior que o mínimo?)
 * — os limites de cada campo (distância > 0, esforço 1–10, ...) são regra de
 * domínio e permanecem só no backend, para não duplicar a fonte da verdade.
 */
export function buildRunPrescriptionDraft(
  input: RunPrescriptionFormInput,
): RunPrescriptionFormResult {
  const description = input.description.trim();
  if (description === '') {
    return { ok: false, message: 'A descrição da corrida é obrigatória.' };
  }

  const distanceKm = parseRange(input.distanceMin, input.distanceMax, 'distância');
  if (!distanceKm.ok) return distanceKm;

  const durationMinutes = parseRange(input.durationMin, input.durationMax, 'duração');
  if (!durationMinutes.ok) return durationMinutes;

  const perceivedEffort = parseRange(input.effortMin, input.effortMax, 'esforço percebido');
  if (!perceivedEffort.ok) return perceivedEffort;

  return {
    ok: true,
    draft: {
      description,
      distanceKm: distanceKm.value,
      durationMinutes: durationMinutes.value,
      perceivedEffort: perceivedEffort.value,
    },
  };
}

type RangeResult = { ok: true; value: NumericRange | null } | { ok: false; message: string };

function parseRange(minText: string, maxText: string, label: string): RangeResult {
  const min = minText.trim();
  const max = maxText.trim();

  if (min === '') {
    return max === ''
      ? { ok: true, value: null }
      : { ok: false, message: `Informe o mínimo de ${label} antes do máximo.` };
  }

  const minValue = Number(min);
  if (!Number.isFinite(minValue)) {
    return { ok: false, message: `O mínimo de ${label} deve ser um número.` };
  }

  if (max === '') return { ok: true, value: { min: minValue, max: null } };

  const maxValue = Number(max);
  if (!Number.isFinite(maxValue)) {
    return { ok: false, message: `O máximo de ${label} deve ser um número.` };
  }
  if (maxValue <= minValue) {
    return { ok: false, message: `O máximo de ${label} deve ser maior que o mínimo.` };
  }

  return { ok: true, value: { min: minValue, max: maxValue } };
}
