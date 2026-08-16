import type { QueryApi, TrainingSessionSummary } from '../api/queryApi';
import { intensityLabel, muscleGroupLabel } from './labels';

/** Uma linha do histórico, já pronta para a tela — sem lógica sobrando lá. */
export type HistoryItem = {
  id: string;
  /** "Corrida" ou "Musculação". */
  kicker: string;
  /** Resumo do esforço: "8,2 km · 45 min". */
  title: string;
  /** "15 de agosto". */
  date: string;
};

export type HistoryView =
  | { status: 'loaded'; items: HistoryItem[] }
  /** Nunca registrou nada — a tela convida a registrar o primeiro treino. */
  | { status: 'empty' }
  /** A leitura falhou. Distinto de `empty`: dizer "nada registrado" a quem tem
   *  histórico faria o corredor duvidar dos próprios registros. */
  | { status: 'unavailable' }
  | { status: 'sessionLost' };

export async function loadTrainingHistory(api: QueryApi): Promise<HistoryView> {
  const result = await api.trainingHistory();

  if (result.status === 'unauthenticated') return { status: 'sessionLost' };
  if (result.status === 'failure') return { status: 'unavailable' };
  if (result.data.length === 0) return { status: 'empty' };

  return { status: 'loaded', items: result.data.map(toItem) };
}

function toItem(session: TrainingSessionSummary): HistoryItem {
  return {
    id: session.id,
    kicker: session.kind === 'running' ? 'Corrida' : 'Musculação',
    title: describe(session),
    date: formatDate(session.date),
  };
}

function describe(session: TrainingSessionSummary): string {
  const duration = `${session.durationMinutes} min`;

  if (session.kind === 'running') {
    return session.distanceKm === null
      ? duration
      : `${formatKm(session.distanceKm)} km · ${duration}`;
  }

  return [muscleGroupLabel(session.muscleGroup), intensityLabel(session.intensity), duration]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/** Vírgula decimal, e sem casa decimal quando ela não diz nada ("8 km", não "8,0 km"). */
function formatKm(km: number): string {
  return (Number.isInteger(km) ? String(km) : km.toFixed(1)).replace('.', ',');
}

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * Formata a partir das partes do ISO, sem passar por `Date`.
 *
 * `new Date('2026-08-15')` é interpretado como UTC e, em fuso negativo, exibiria
 * o dia 14 — o treino apareceria na data errada para o corredor no Brasil.
 */
function formatDate(iso: string): string {
  const [, month, day] = iso.split('-');
  const monthName = MONTHS[Number(month) - 1];

  return monthName ? `${Number(day)} de ${monthName}` : iso;
}
