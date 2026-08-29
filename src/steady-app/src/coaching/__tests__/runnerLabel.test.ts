import { runnerLabel } from '../runnerLabel';

describe('como o personal identifica o corredor', () => {
  it('mostra o nome quando o corredor tem um', () => {
    expect(runnerLabel({ name: 'Ana Prado', email: 'ana@example.com' })).toBe('Ana Prado');
  });

  it('cai no e-mail enquanto o nome não chegou', () => {
    expect(runnerLabel({ name: null, email: 'ana@example.com' })).toBe('ana@example.com');
  });

  it('nome em branco vale como ausente', () => {
    expect(runnerLabel({ name: '   ', email: 'ana@example.com' })).toBe('ana@example.com');
  });
});
