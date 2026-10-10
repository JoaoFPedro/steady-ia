import { workoutReviewView } from '../workoutReviewView';
import type { WorkoutReview } from '../types';

const review = (partial: Partial<WorkoutReview> = {}): WorkoutReview => ({
  id: 'r1', executionId: 'e1', executionKind: 'Running', executionDate: '2026-08-30',
  status: 'Divergent', action: 'ReduceLoad', policyVersion: 1,
  comparisonJson: JSON.stringify({ fields: [{ field: 'distance', prescribed: 10, executed: 8 }] }),
  explanationStatus: 'Available', explanationJson: JSON.stringify({ explanation: 'Você correu menos e com esforço maior.' }),
  understoodAt: null, contested: false, coherenceStatus: 'Unknown', ...partial,
});

describe('apresentação da revisão', () => {
  it('mantém comparação e ação quando a explicação está indisponível', () => {
    const view = workoutReviewView(review({ explanationStatus: 'Unavailable', explanationJson: null }));
    expect(view.action).toBe('Reduzir carga');
    expect(view.comparison).toEqual(['distance: previsto 10 · realizado 8']);
    expect(view.explanationUnavailable).toBe(true);
  });

  it('identifica conflito sem escolher uma ação', () => {
    const view = workoutReviewView(review({ status: 'PrescriptionConflict', action: null }));
    expect(view.isConflict).toBe(true);
    expect(view.action).toBeNull();
  });
});
