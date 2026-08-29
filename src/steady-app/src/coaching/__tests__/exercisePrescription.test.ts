import { formatExercisePrescription } from '../exercisePrescription';

describe('apresentação da prescrição ao corredor', () => {
  it('exibe séries e repetições por extenso', () => {
    expect(formatExercisePrescription(4, 6)).toBe('4 séries de 6 repetições');
  });

  it('respeita o singular', () => {
    expect(formatExercisePrescription(1, 1)).toBe('1 série de 1 repetição');
  });

  it('acrescenta o tempo prescrito quando existe', () => {
    expect(formatExercisePrescription(3, 1, 40)).toBe('3 séries de 1 repetição · 40s');
  });

  it('exercício sem tempo não ganha sufixo vazio', () => {
    expect(formatExercisePrescription(4, 6, null)).toBe('4 séries de 6 repetições');
  });
});
