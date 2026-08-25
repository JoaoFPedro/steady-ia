/**
 * Onde o corredor está no plano de 24 semanas (specs/STORY-011, regras 4 a 6).
 *
 * A contagem é **regressiva a partir da data da prova** — é o modelo que
 * `raceDate.ts` já assume ("o plano é contado de trás para frente") e o único
 * que faz o taper cair nas 4 semanas que antecedem a prova, independentemente
 * de quando o plano foi gerado.
 *
 * Nada aqui calcula treino (FF-004): é aritmética de calendário sobre a data
 * que o próprio corredor informou.
 */

/** Fases do plano, espelhadas de `TRAINING_PLAN_DOCUMENT.phases` — nome curto para o cabeçalho. */
export const PLAN_PHASES = [
  { name: 'Base', from: 1, to: 8 },
  { name: 'Construção', from: 9, to: 16 },
  { name: 'Pico', from: 17, to: 20 },
  { name: 'Polimento', from: 21, to: 24 },
] as const;

export const PLAN_TOTAL_WEEKS = PLAN_PHASES[PLAN_PHASES.length - 1].to;

export type TrainingProgress =
  /** Sem planejamento — ou com data de prova ilegível. Não há o que contar. */
  | { status: 'noPlan' }
  /** Prova a mais de 24 semanas: o plano ainda não começou. */
  | { status: 'beforeStart'; weeksToRace: number; weeksToStart: number }
  | { status: 'inPlan'; week: number; totalWeeks: number; phase: string; weeksToRace: number }
  | { status: 'raceDay'; week: number; totalWeeks: number; phase: string }
  | { status: 'raceOver' };

const DIA_EM_MS = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function trainingProgress(today: Date, raceDateIso: string | null): TrainingProgress {
  const prova = parseIsoDate(raceDateIso);
  if (prova === null) return { status: 'noPlan' };

  const dias = daysBetween(startOfDay(today), prova);

  if (dias < 0) return { status: 'raceOver' };
  if (dias === 0) {
    return {
      status: 'raceDay',
      week: PLAN_TOTAL_WEEKS,
      totalWeeks: PLAN_TOTAL_WEEKS,
      phase: phaseOfWeek(PLAN_TOTAL_WEEKS),
    };
  }

  // Para cima: qualquer coisa entre 1 e 7 dias é "1 semana" (regra 5). Para
  // baixo, a véspera da prova mostraria "0 semanas".
  const weeksToRace = Math.ceil(dias / 7);

  if (weeksToRace > PLAN_TOTAL_WEEKS) {
    return { status: 'beforeStart', weeksToRace, weeksToStart: weeksToRace - PLAN_TOTAL_WEEKS };
  }

  const week = PLAN_TOTAL_WEEKS - weeksToRace + 1;
  return { status: 'inPlan', week, totalWeeks: PLAN_TOTAL_WEEKS, phase: phaseOfWeek(week), weeksToRace };
}

function phaseOfWeek(week: number): string {
  // A última fase fecha o intervalo: `week` nunca passa de PLAN_TOTAL_WEEKS.
  return (PLAN_PHASES.find((fase) => week <= fase.to) ?? PLAN_PHASES[PLAN_PHASES.length - 1]).name;
}

/**
 * ISO para data local à meia-noite. Local de propósito: `new Date('2026-08-22')`
 * seria UTC e viraria o dia anterior a oeste de Greenwich — a prova apareceria
 * como já realizada no próprio dia dela.
 */
export function parseIsoDate(iso: string | null | undefined): Date | null {
  const partes = iso ? ISO.exec(iso) : null;
  if (!partes) return null;

  const [, ano, mes, dia] = partes.map(Number) as unknown as [never, number, number, number];
  const data = new Date(ano, mes - 1, dia);

  // Ida e volta: `new Date(2027, 12, 45)` não falha, escorrega para outro mês.
  const existe = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return existe ? data : null;
}

export const startOfDay = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate());

/** `round` e não `floor`: o horário de verão encurta ou estica um dos dias do intervalo. */
const daysBetween = (de: Date, ate: Date) => Math.round((ate.getTime() - de.getTime()) / DIA_EM_MS);
