import { latestWorkouts } from '../latestWorkouts';

describe('últimos treinos na dashboard — STORY-024', () => {
  it('mostra a corrida e a musculação mais recentes por data de realização', () => {
    const result = latestWorkouts([
      { id: 'old-run', kind: 'running', date: '2026-10-10', registeredAt: '2026-10-10T09:00:00Z' },
      { id: 'strength', kind: 'strength', date: '2026-10-11', registeredAt: '2026-10-11T09:00:00Z' },
      { id: 'run', kind: 'running', date: '2026-10-12', registeredAt: '2026-10-12T09:00:00Z' },
    ]);

    expect(result.running?.id).toBe('run');
    expect(result.strength?.id).toBe('strength');
  });
});

describe('ordem desconhecida de treinos antigos — STORY-024', () => {
  it('mostra uma corrida e avisa quando não há horário para desempatar', () => {
    const result = latestWorkouts([
      { id: 'a', kind: 'running', date: '2026-10-10', registeredAt: null },
      { id: 'b', kind: 'running', date: '2026-10-10', registeredAt: null },
    ]);

    expect(['a', 'b']).toContain(result.running?.id);
    expect(result.orderUnknown.running).toBe(true);
  });
});

describe('horários equivalentes — STORY-024', () => {
  it('não inventa ordem quando a API e a fila representam o mesmo instante com formatos diferentes', () => {
    const result = latestWorkouts([
      { id: 'local', kind: 'running', date: '2026-10-10', registeredAt: '2026-10-10T12:34:56.000Z' },
      { id: 'server', kind: 'running', date: '2026-10-10', registeredAt: '2026-10-10T12:34:56Z' },
    ]);
    expect(result.orderUnknown.running).toBe(true);
  });
});
