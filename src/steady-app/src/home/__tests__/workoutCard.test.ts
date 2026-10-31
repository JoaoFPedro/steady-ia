import { workoutCard } from '../workoutCard';
import type { TrainingSessionSummary } from '../../api/queryApi';

describe('card da última corrida — STORY-024', () => {
  it('apresenta data, distância, duração e ritmo médio', () => {
    const run: TrainingSessionSummary = {
      id: 'run', kind: 'running', date: '2026-10-10', registeredAt: null,
      durationMinutes: 33, distanceKm: 5.5, averagePaceMinPerKm: 6.5,
      perceivedEffort: 4, muscleGroup: null, intensity: null, workoutType: null,
    };
    expect(workoutCard(run)).toMatchObject({
      title: 'Corrida', date: '10/10/2026', metrics: [
        { label: 'Distância', value: '5,5 km' },
        { label: 'Duração', value: '33 min' },
        { label: 'Ritmo médio', value: '6:30 min/km' },
      ],
    });
  });
});
