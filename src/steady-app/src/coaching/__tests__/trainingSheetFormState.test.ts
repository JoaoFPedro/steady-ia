import {
  canRemoveExercise,
  clearFieldError,
  dropExerciseErrors,
  removeExercise,
} from '../trainingSheetFormState';
import { emptyExerciseInput } from '../trainingSheetSchema';

function exercise(name: string) {
  return { ...emptyExerciseInput(), name };
}

describe('estado do formulário da ficha', () => {
  it('remove o exercício pedido e preserva os demais', () => {
    const items = [exercise('Supino'), exercise('Crucifixo'), exercise('Tríceps')];

    expect(removeExercise(items, 1)).toEqual([exercise('Supino'), exercise('Tríceps')]);
  });

  it('remover não altera a lista original', () => {
    const items = [exercise('Supino'), exercise('Crucifixo')];

    removeExercise(items, 0);

    expect(items).toHaveLength(2);
  });

  it('o último exercício do treino não é removível', () => {
    expect(canRemoveExercise([exercise('Supino')])).toBe(false);
  });

  it('com dois ou mais exercícios a remoção é permitida', () => {
    expect(canRemoveExercise([exercise('Supino'), exercise('Crucifixo')])).toBe(true);
  });

  it('corrigir um campo apaga só o erro daquele campo', () => {
    const errors = { 'push.0.name': 'Informe o nome.', 'pull.0.sets': 'Informe as séries.' };

    expect(clearFieldError(errors, 'push.0.name')).toEqual({ 'pull.0.sets': 'Informe as séries.' });
  });

  it('apagar erro de campo sem erro devolve o mesmo mapa', () => {
    const errors = { 'push.0.name': 'Informe o nome.' };

    expect(clearFieldError(errors, 'push.0.sets')).toBe(errors);
  });

  it('remover exercício descarta os erros dele e reindexa os seguintes', () => {
    const errors = {
      'push.0.name': 'Informe o nome.',
      'push.1.sets': 'Informe as séries.',
      'push.2.name': 'Informe o nome.',
      'pull.0.name': 'Informe o nome.',
    };

    expect(dropExerciseErrors(errors, 'push', 1)).toEqual({
      'push.0.name': 'Informe o nome.',
      'push.1.name': 'Informe o nome.',
      'pull.0.name': 'Informe o nome.',
    });
  });
});
