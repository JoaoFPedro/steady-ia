import type { TrainingSessionSummary } from '../api/queryApi';

export type WorkoutCardData = {
  title: string;
  date: string;
  metrics: Array<{ label: string; value: string }>;
};

/** Dados recebidos não são inferidos: ausência é diferente de zero. */
export function workoutCard(session: TrainingSessionSummary): WorkoutCardData {
  const parts = session.date.split('-');
  const date = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : session.date;
  const duration = session.durationMinutes === null ? 'Indisponível' : `${session.durationMinutes} min`;

  if (session.kind === 'running') {
    const distance = session.distanceKm === null ? 'Indisponível' :
      `${session.distanceKm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`;
    const pace = session.averagePaceMinPerKm;
    const totalSeconds = pace == null || !Number.isFinite(pace) || pace <= 0 ? null : Math.round(pace * 60);
    const paceText = totalSeconds === null ? 'Indisponível' :
      `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')} min/km`;
    return {
      title: 'Corrida', date,
      metrics: [
        { label: 'Distância', value: distance },
        { label: 'Duração', value: duration },
        { label: 'Ritmo médio', value: paceText },
      ],
    };
  }

  return {
    title: 'Musculação', date,
    metrics: [{ label: 'Duração', value: duration }, { label: 'Séries', value: 'Indisponível' }],
  };
}
