import { formatExercisePrescription } from '../exercisePrescription';

describe('apresentação da prescrição ao corredor', () => {
  it('exibe séries e repetições por extenso', () => {
    expect(formatExercisePrescription(4, 6)).toBe('4 séries de 6 repetições');
  });

  it('respeita o singular', () => {
    expect(formatExercisePrescription(1, 1)).toBe('1 série de 1 repetição');
  });
});
