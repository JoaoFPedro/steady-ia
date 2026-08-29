import type { ExerciseFormInput, FieldErrors } from './trainingSheetSchema';

/**
 * Operações puras sobre o formulário da ficha do personal (STORY-017).
 * Ficam fora da tela para serem testáveis sem renderizar componente — é como
 * o resto do app já separa regra de apresentação.
 */

/**
 * O domínio exige ao menos um exercício por treino: a remoção existe para o
 * card que sobrou, não para esvaziar o treino.
 */
export function canRemoveExercise(items: readonly ExerciseFormInput[]): boolean {
  return items.length > 1;
}

export function removeExercise(
  items: readonly ExerciseFormInput[],
  index: number,
): ExerciseFormInput[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

/** O erro do campo some assim que aquele campo é corrigido — só ele. */
export function clearFieldError(errors: FieldErrors, path: string): FieldErrors {
  if (errors[path] === undefined) return errors;

  const { [path]: _removed, ...rest } = errors;
  return rest;
}

/**
 * Remover um exercício descarta os erros dele e reindexa os seguintes: o erro
 * precisa continuar apontando para o card certo depois que a lista encolhe.
 */
export function dropExerciseErrors(
  errors: FieldErrors,
  list: string,
  index: number,
): FieldErrors {
  const prefix = `${list}.`;
  const result: FieldErrors = {};

  for (const [path, message] of Object.entries(errors)) {
    if (!path.startsWith(prefix)) {
      result[path] = message;
      continue;
    }

    const [, position, ...rest] = path.split('.');
    const itemIndex = Number(position);
    if (itemIndex === index) continue;

    const shifted = itemIndex > index ? itemIndex - 1 : itemIndex;
    result[[list, shifted, ...rest].join('.')] = message;
  }

  return result;
}
