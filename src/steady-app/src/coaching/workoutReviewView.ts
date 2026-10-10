import type { WorkoutReview } from './types';

export type WorkoutReviewView = {
  title: string;
  action: string | null;
  explanation: string | null;
  explanationUnavailable: boolean;
  comparison: string[];
  coherence: string;
  isConflict: boolean;
};

export function workoutReviewView(review: WorkoutReview): WorkoutReviewView {
  const comparison = parseObject(review.comparisonJson);
  const explanation = parseObject(review.explanationJson);
  return {
    title: review.status === 'PrescriptionConflict'
      ? 'Prescrições em conflito'
      : 'Seu treino ficou diferente do planejado',
    action: actionLabel(review.action),
    explanation: textFrom(explanation),
    explanationUnavailable: review.explanationStatus === 'Unavailable',
    comparison: flattenComparison(comparison),
    coherence: coherenceLabel(review.coherenceStatus),
    isConflict: review.status === 'PrescriptionConflict',
  };
}

function parseObject(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

function textFrom(value: Record<string, unknown>): string | null {
  for (const key of ['explanation', 'summary', 'message']) {
    if (typeof value[key] === 'string') return value[key] as string;
  }
  return null;
}

function flattenComparison(value: Record<string, unknown>): string[] {
  const source = Array.isArray(value.fields) ? value.fields : Array.isArray(value.comparisons) ? value.comparisons : [];
  return source.slice(0, 6).map((item) => {
    if (!item || typeof item !== 'object') return String(item);
    const row = item as Record<string, unknown>;
    const field = String(row.field ?? row.name ?? 'Campo');
    const prescribed = row.prescribed ?? row.expected;
    const executed = row.executed ?? row.actual;
    return prescribed === undefined && executed === undefined
      ? field
      : `${field}: previsto ${String(prescribed ?? '—')} · realizado ${String(executed ?? '—')}`;
  });
}

function actionLabel(action: WorkoutReview['action']): string | null {
  if (action === 'Maintain') return 'Manter';
  if (action === 'ReduceLoad') return 'Reduzir carga';
  if (action === 'PrioritizeRecovery') return 'Priorizar recuperação';
  return null;
}

const coherenceLabel = (status: string): string => ({
  Unknown: 'Próximo treino ainda não observado',
  Coherent: 'Próximo treino coerente com a recomendação',
  NotCoherent: 'Próximo treino não coerente com a recomendação',
}[status] ?? status);
