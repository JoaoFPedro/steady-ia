import {
  prepareStrengthExecution,
  validateLoad,
  type ExerciseInput,
} from '../workoutExecution';

const inputs = (load: string, note = ''): ExerciseInput[] => [
  { exerciseId: 'exercise-1', name: 'Agachamento livre', load, note },
];

describe('execução da ficha de musculação', () => {
  it.each(['', '0', '0,00'])('pede uma única confirmação quando a carga é %p', (load) => {
    const result = prepareStrengthExecution('sheet-1', 'lower', '2026-08-24', inputs(load));

    expect(result).toEqual({
      status: 'confirmSkipped',
      skippedExerciseNames: ['Agachamento livre'],
      payload: {
        trainingSheetId: 'sheet-1',
        workoutType: 'lower',
        date: '2026-08-24',
        exercises: [
          { exerciseId: 'exercise-1', loadKg: null, note: null, skipped: true },
        ],
      },
    });
  });

  it('envia todos os exercícios juntos e mantém nota apenas na execução atual', () => {
    const result = prepareStrengthExecution('sheet-1', 'push', '2026-08-24', [
      { exerciseId: 'a', name: 'Supino reto', load: '42,50', note: 'Última série difícil' },
      { exerciseId: 'b', name: 'Desenvolvimento', load: '20', note: '' },
    ]);

    expect(result).toEqual({
      status: 'ready',
      payload: {
        trainingSheetId: 'sheet-1',
        workoutType: 'push',
        date: '2026-08-24',
        exercises: [
          { exerciseId: 'a', loadKg: 42.5, note: 'Última série difícil', skipped: false },
          { exerciseId: 'b', loadKg: 20, note: null, skipped: false },
        ],
      },
    });
  });

  it.each([
    ['-1', 'A carga deve ficar entre 0 e 999,99 kg.'],
    ['1000', 'A carga deve ficar entre 0 e 999,99 kg.'],
    ['10,123', 'Use no máximo 2 casas decimais na carga.'],
    ['abc', 'Informe uma carga válida em quilogramas.'],
  ])('rejeita carga inválida %p', (load, message) => {
    expect(validateLoad(load)).toEqual({ valid: false, message });
  });

  it('rejeita observação acima de 200 caracteres', () => {
    const result = prepareStrengthExecution(
      'sheet-1', 'pull', '2026-08-24', inputs('20', 'x'.repeat(201)),
    );

    expect(result).toEqual({
      status: 'invalid',
      message: 'A observação de Agachamento livre deve ter no máximo 200 caracteres.',
    });
  });
});
