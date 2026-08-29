import { buildRunPrescriptionDraft } from '../runPrescriptionForm';

const emptyInput = {
  description: '', distanceMin: '', distanceMax: '',
  durationMin: '', durationMax: '', effortMin: '', effortMax: '',
};

describe('formulário de prescrição de corrida do personal', () => {
  it('descrição sozinha é válida, sem nenhum número', () => {
    const result = buildRunPrescriptionDraft({ ...emptyInput, description: '  Fartlek leve  ' });

    expect(result).toEqual({
      ok: true,
      draft: {
        description: 'Fartlek leve',
        distanceKm: null,
        durationMinutes: null,
        perceivedEffort: null,
      },
    });
  });

  it('descrição vazia é rejeitada antes de qualquer número', () => {
    const result = buildRunPrescriptionDraft(emptyInput);

    expect(result).toEqual({ ok: false, message: expect.stringContaining('descrição') });
  });

  it('mínimo sozinho vira alvo exato', () => {
    const result = buildRunPrescriptionDraft({ ...emptyInput, description: 'Longão', distanceMin: '21' });

    expect(result).toEqual({
      ok: true,
      draft: { description: 'Longão', distanceKm: { min: 21, max: null }, durationMinutes: null, perceivedEffort: null },
    });
  });

  it('mínimo e máximo viram faixa', () => {
    const result = buildRunPrescriptionDraft({
      ...emptyInput, description: 'Moderada', distanceMin: '8', distanceMax: '10',
    });

    expect(result).toEqual({
      ok: true,
      draft: { description: 'Moderada', distanceKm: { min: 8, max: 10 }, durationMinutes: null, perceivedEffort: null },
    });
  });

  it('máximo sem mínimo é rejeitado', () => {
    const result = buildRunPrescriptionDraft({
      ...emptyInput, description: 'Longão', distanceMax: '10',
    });

    expect(result.ok).toBe(false);
  });

  it('máximo menor ou igual ao mínimo é rejeitado', () => {
    const result = buildRunPrescriptionDraft({
      ...emptyInput, description: 'Longão', distanceMin: '12', distanceMax: '8',
    });

    expect(result.ok).toBe(false);
  });

  it('texto não numérico é rejeitado', () => {
    const result = buildRunPrescriptionDraft({
      ...emptyInput, description: 'Longão', distanceMin: 'abc',
    });

    expect(result.ok).toBe(false);
  });

  it('os três campos são independentes entre si', () => {
    const result = buildRunPrescriptionDraft({
      ...emptyInput, description: 'Qualidade', effortMin: '7', effortMax: '8',
    });

    expect(result).toEqual({
      ok: true,
      draft: {
        description: 'Qualidade',
        distanceKm: null,
        durationMinutes: null,
        perceivedEffort: { min: 7, max: 8 },
      },
    });
  });
});
