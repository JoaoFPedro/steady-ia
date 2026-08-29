import { runPrescriptionSummary } from '../runPrescriptionSummary';
import type { RunPrescription } from '../types';

const base: RunPrescription = {
  description: 'Fartlek leve',
  distanceKm: null,
  durationMinutes: null,
  perceivedEffort: null,
};

describe('resumo numérico da corrida prescrita', () => {
  it('sem nenhum campo numérico não gera resumo', () => {
    expect(runPrescriptionSummary(base)).toBeNull();
  });

  it('alvo exato mostra um único valor', () => {
    expect(runPrescriptionSummary({ ...base, distanceKm: { min: 21, max: null } }))
      .toBe('21 km');
  });

  it('faixa mostra o intervalo', () => {
    expect(runPrescriptionSummary({ ...base, distanceKm: { min: 8, max: 10 } }))
      .toBe('8–10 km');
  });

  it('combina os três campos presentes, ignorando os ausentes', () => {
    const prescription: RunPrescription = {
      ...base,
      distanceKm: { min: 8, max: 10 },
      perceivedEffort: { min: 5, max: 6 },
    };

    expect(runPrescriptionSummary(prescription)).toBe('8–10 km · esforço 5–6');
  });

  it('duração usa minutos', () => {
    expect(runPrescriptionSummary({ ...base, durationMinutes: { min: 45, max: 55 } }))
      .toBe('45–55 min');
  });
});
