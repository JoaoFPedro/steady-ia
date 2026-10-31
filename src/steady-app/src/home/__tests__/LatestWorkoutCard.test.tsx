import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { LatestWorkoutCard } from '../LatestWorkoutCard';
import type { TrainingSessionSummary } from '../../api/queryApi';

const run: TrainingSessionSummary = {
  id: 'run', kind: 'running', date: '2026-10-10', registeredAt: null,
  durationMinutes: 33, distanceKm: 5.5, averagePaceMinPerKm: 6.5,
  perceivedEffort: 4, muscleGroup: null, intensity: null, workoutType: null,
};

describe('card da dashboard — STORY-024', () => {
  it('permite abrir o treino apresentado e informa ordem desconhecida', async () => {
    const onPress = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LatestWorkoutCard session={run} orderUnknown onPress={onPress} />);
    });
    const button = renderer!.root.findAll((node) =>
      typeof node.props.accessibilityLabel === 'string' &&
      node.props.accessibilityLabel.startsWith('Ver detalhes da corrida de 10/10/2026'),
    )[0];
    expect(button.props.accessibilityLabel).toContain('Ritmo médio: 6:30 min/km');
    expect(button.props.accessibilityRole).toBe('button');
    const content = JSON.stringify(renderer!.toJSON());
    expect(content).toContain('ordem entre treinos');
    expect(content).toContain('6:30 min/km');
    await act(async () => { button.props.onPress(); });
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => { renderer!.unmount(); });
  });
});
