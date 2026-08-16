import { todayIso } from '../date';

describe('Data do registro', () => {
  it('usa o dia local, não o UTC', () => {
    // 23h em UTC-3 já é o dia seguinte em UTC. Se a conversão passasse por
    // toISOString(), o treino cairia na janela errada da avaliação (ADR-001).
    jest.useFakeTimers().setSystemTime(new Date('2026-08-15T23:30:00-03:00'));

    expect(todayIso()).toBe('2026-08-15');

    jest.useRealTimers();
  });

  it('preenche mês e dia com zero à esquerda', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 5, 10, 0, 0));

    expect(todayIso()).toBe('2026-01-05');

    jest.useRealTimers();
  });
});
