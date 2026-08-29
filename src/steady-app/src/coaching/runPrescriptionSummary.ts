import type { NumericRange, RunPrescription } from './types';

/**
 * Texto curto dos campos numéricos opcionais da corrida prescrita (ADR-012),
 * para exibir ao lado da descrição livre no detalhamento do dia. `null`
 * quando o personal não preencheu nenhum número — nesse caso a descrição
 * segue sendo a única instrução, como antes desta story.
 */
export function runPrescriptionSummary(prescription: RunPrescription): string | null {
  const parts = [
    format(prescription.distanceKm, 'km'),
    format(prescription.durationMinutes, 'min'),
    format(prescription.perceivedEffort, null, 'esforço'),
  ].filter((part): part is string => part !== null);

  return parts.length === 0 ? null : parts.join(' · ');
}

function format(range: NumericRange | null, unit: string | null, prefix?: string): string | null {
  if (range === null) return null;

  const value = range.max === null ? `${range.min}` : `${range.min}–${range.max}`;
  const withUnit = unit === null ? value : `${value} ${unit}`;
  return prefix === undefined ? withUnit : `${prefix} ${withUnit}`;
}
