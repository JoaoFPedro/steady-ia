import { coachingTimeline } from '../coachingTimeline';
import type { CoachingHistory } from '../types';

const execution = (id: string, date: string) => ({
  id, trainingSheetId: 's', workoutType: 'push' as const, date, createdAt: `${date}T02:00:00Z`,
  exercises: [],
});
const run = (id: string, date: string) => ({
  id, date, distanceKm: 7, durationMinutes: 45, averagePaceMinPerKm: 6, perceivedEffort: 5,
});

describe('histórico detalhado do personal', () => {
  it('mistura musculação e corrida numa linha do tempo, mais recente primeiro', () => {
    const history: CoachingHistory = {
      strengthExecutions: [execution('a', '2026-08-28')],
      runningSessions: [run('b', '2026-08-29'), run('c', '2026-08-24')],
    };

    expect(coachingTimeline(history).map((item) => [item.kind, item.date])).toEqual([
      ['run', '2026-08-29'],
      ['strength', '2026-08-28'],
      ['run', '2026-08-24'],
    ]);
  });

  it('o registro de hoje aparece no topo, mesmo com musculação de ontem', () => {
    const history: CoachingHistory = {
      strengthExecutions: [execution('a', '2026-08-28')],
      runningSessions: [run('b', '2026-08-29')],
    };

    expect(coachingTimeline(history)[0].date).toBe('2026-08-29');
  });

  it('no mesmo dia, musculação e corrida convivem', () => {
    const history: CoachingHistory = {
      strengthExecutions: [execution('a', '2026-08-29')],
      runningSessions: [run('b', '2026-08-29')],
    };

    expect(coachingTimeline(history)).toHaveLength(2);
  });

  it('histórico vazio devolve lista vazia', () => {
    expect(coachingTimeline({ strengthExecutions: [], runningSessions: [] })).toEqual([]);
  });

  it('histórico nulo devolve lista vazia', () => {
    expect(coachingTimeline(null)).toEqual([]);
  });
});
