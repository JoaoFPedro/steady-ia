import {
  emptyExerciseInput,
  emptyRunInput,
  parseTrainingSheetForm,
  type TrainingSheetFormInput,
} from '../trainingSheetSchema';

function validExercise(name = 'Supino reto') {
  return { ...emptyExerciseInput(), name, sets: '4', repetitions: '6' };
}

function validForm(): TrainingSheetFormInput {
  return {
    push: [validExercise('Supino reto')],
    pull: [validExercise('Remada curvada')],
    lower: [validExercise('Agachamento livre')],
    tuesdayRun: { ...emptyRunInput(), description: 'Moderada' },
    thursdayRun: { ...emptyRunInput(), description: 'Intervalado' },
    saturdayRun: { ...emptyRunInput(), description: 'Longão' },
  };
}

describe('schema da ficha do personal', () => {
  it('ficha completa vira draft sem erro', () => {
    const result = parseTrainingSheetForm(validForm());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.push).toEqual([
      { name: 'Supino reto', sets: 4, repetitions: 6, durationSeconds: null, observation: null },
    ]);
    expect(result.draft.tuesdayRun.description).toBe('Moderada');
  });

  it('nome em branco endereça o erro ao campo do exercício', () => {
    const form = validForm();
    form.push[0].name = '   ';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['push.0.name']).toEqual(expect.any(String));
    expect(result.errors['push.0.sets']).toBeUndefined();
  });

  it('campos inválidos em exercícios diferentes aparecem juntos', () => {
    const form = validForm();
    form.push[0].name = '';
    form.pull[0].sets = '';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['push.0.name']).toEqual(expect.any(String));
    expect(result.errors['pull.0.sets']).toEqual(expect.any(String));
    expect(result.errors['lower.0.name']).toBeUndefined();
  });

  it('séries não numéricas são erro do campo, não do formulário', () => {
    const form = validForm();
    form.lower[0].repetitions = 'seis';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['lower.0.repetitions']).toEqual(expect.any(String));
  });

  it('não replica os limites do domínio: 40 séries passa no formulário', () => {
    const form = validForm();
    form.push[0].sets = '40';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
  });

  it('tempo em branco vira ausência, nunca zero', () => {
    const result = parseTrainingSheetForm(validForm());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.push[0].durationSeconds).toBeNull();
  });

  it('tempo preenchido vira número em segundos', () => {
    const form = validForm();
    form.push[0].durationSeconds = '40';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.push[0].durationSeconds).toBe(40);
  });

  it('tempo não numérico é erro do campo de tempo', () => {
    const form = validForm();
    form.push[0].durationSeconds = 'meio minuto';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['push.0.durationSeconds']).toEqual(expect.any(String));
  });

  it('tempo não dispensa séries nem repetições', () => {
    const form = validForm();
    form.push[0].durationSeconds = '40';
    form.push[0].repetitions = '';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['push.0.repetitions']).toEqual(expect.any(String));
  });

  it('observação em branco vira ausência, nunca texto vazio', () => {
    const form = validForm();
    form.push[0].observation = '   ';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.push[0].observation).toBeNull();
  });

  it('observação é aparada antes de virar draft', () => {
    const form = validForm();
    form.push[0].observation = '  não travar o cotovelo  ';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.push[0].observation).toBe('não travar o cotovelo');
  });

  it('observação acima de 200 caracteres é erro do campo', () => {
    const form = validForm();
    form.push[0].observation = 'a'.repeat(201);

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['push.0.observation']).toEqual(expect.stringContaining('200'));
  });

  it('séries fracionadas são erro do campo, não 400 opaco da API', () => {
    const form = validForm();
    form.push[0].sets = '4,5';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['push.0.sets']).toEqual(expect.any(String));
  });

  it('tempo fracionado é erro do campo de tempo', () => {
    const form = validForm();
    form.push[0].durationSeconds = '40.5';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['push.0.durationSeconds']).toEqual(expect.any(String));
  });

  it('descrição de corrida em branco endereça o dia certo', () => {
    const form = validForm();
    form.thursdayRun.description = '';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['thursdayRun.description']).toEqual(expect.any(String));
    expect(result.errors['tuesdayRun.description']).toBeUndefined();
  });

  it('descrição sozinha continua válida, sem nenhum número', () => {
    const result = parseTrainingSheetForm(validForm());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.tuesdayRun).toEqual({
      description: 'Moderada',
      distanceKm: null,
      durationMinutes: null,
      perceivedEffort: null,
    });
  });


  it('duração continua aceitando faixa', () => {
    const form = validForm();
    form.tuesdayRun.durationMin = '45';
    form.tuesdayRun.durationMax = '55';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.tuesdayRun.durationMinutes).toEqual({ min: 45, max: 55 });
  });

  it('faixa de duração invertida é erro do campo do máximo', () => {
    const form = validForm();
    form.saturdayRun.durationMin = '55';
    form.saturdayRun.durationMax = '45';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['saturdayRun.durationMax']).toEqual(expect.any(String));
  });

  // A distância é um valor só: o personal escreve "5,4 km", não uma faixa.
  it('km aceita decimal com vírgula, como o registro de corrida', () => {
    const form = validForm();
    form.saturdayRun.distanceKm = '5,4';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.saturdayRun.distanceKm).toEqual({ min: 5.4, max: null });
  });

  it('km aceita decimal com ponto', () => {
    const form = validForm();
    form.saturdayRun.distanceKm = '21.1';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.saturdayRun.distanceKm).toEqual({ min: 21.1, max: null });
  });

  it('km em branco continua ausente', () => {
    const result = parseTrainingSheetForm(validForm());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.tuesdayRun.distanceKm).toBeNull();
  });

  it('km não numérico é erro do campo', () => {
    const form = validForm();
    form.saturdayRun.distanceKm = 'meia maratona';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['saturdayRun.distanceKm']).toEqual(expect.any(String));
  });

  it('máximo sem mínimo é erro do campo do mínimo', () => {
    const form = validForm();
    form.tuesdayRun.durationMax = '55';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors['tuesdayRun.durationMin']).toEqual(expect.any(String));
  });

  it('esforço percebido segue a mesma regra de faixa', () => {
    const form = validForm();
    form.thursdayRun.effortMin = '7';
    form.thursdayRun.effortMax = '8';

    const result = parseTrainingSheetForm(form);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.thursdayRun.perceivedEffort).toEqual({ min: 7, max: 8 });
  });
});
