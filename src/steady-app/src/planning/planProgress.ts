import { addDays, isoDate } from '../features/date';
import { dayCompletion, type LoggedSession } from './dayCompletion';
import { dayRequirements, requiresTraining } from './dayRequirements';
import { planWindow } from './planWindow';
import { TRAINING_PLAN_DOCUMENT, type WeekPlanDay } from './trainingPlanDocument';
import { PLAN_TOTAL_WEEKS, parseIsoDate, startOfDay, trainingProgress } from './trainingProgress';
import { weekPlanDayFor } from './weekPlanDay';

/**
 * Quanto do plano de 24 semanas já foi percorrido (specs/STORY-012, regras 19 a 26).
 *
 * **Avanço, não aderência**: começa em 0 e só sobe. O denominador é fixo — quem
 * entra no meio do plano não chega a 100%, e `enteredAtWeek` existe para a tela
 * poder dizer isso. Um teto de 42% sem explicação se lê como fracasso.
 *
 * A conta acontece no app, sobre o que `trainingHistory()` devolveu mais a fila
 * local. É o único arranjo em que um registro ainda pendente fecha o dia na hora
 * (ADR-003) — o servidor ainda não o conhece. Segue o precedente do
 * `trainingProgress.ts`: aritmética de calendário, não regra de treino.
 */
export type PlanProgress =
  /** Sem plano, antes do início da janela, ou prova já passada — nada a mostrar. */
  | { status: 'none' }
  /** O histórico não pôde ser lido. Nunca 0%: "não li" não é "você não treinou" (ADR-004). */
  | { status: 'unavailable' }
  | {
      status: 'ok';
      completed: number;
      total: number;
      percent: number;
      /** Semana em que o corredor entrou, quando não foi na 1ª. `null` não tem o que explicar. */
      enteredAtWeek: number | null;
    };

/** Só o que a conta precisa de um planejamento. */
export type ProgressPlan = { raceDate: string; createdAt: string };

export function planProgress(
  today: Date,
  plan: ProgressPlan | null,
  sessions: readonly LoggedSession[] | null,
  weekPlan: readonly WeekPlanDay[] = TRAINING_PLAN_DOCUMENT.weekPlan,
): PlanProgress {
  if (plan === null) return { status: 'none' };

  const posicao = trainingProgress(today, plan.raceDate);
  if (posicao.status !== 'inPlan' && posicao.status !== 'raceDay') return { status: 'none' };

  // Só depois de saber que há plano: sem plano, a falta de histórico não importa.
  if (sessions === null) return { status: 'unavailable' };

  // `trainingProgress` já provou que a data é legível ao não devolver `noPlan`.
  const janela = planWindow(plan.raceDate) as { start: Date; end: Date };
  const hoje = startOfDay(today);
  const ate = hoje.getTime() < janela.end.getTime() ? hoje : janela.end;
  const hojeIso = isoDate(hoje);

  // 24 semanas × os dias com treino da grade. Derivado, não escrito à mão: se a
  // grade mudar de forma, o denominador acompanha.
  const total = PLAN_TOTAL_WEEKS * weekPlan.filter((dia) => requiresTraining(dayRequirements(dia))).length;

  let completed = 0;
  for (let dia = janela.start; dia.getTime() <= ate.getTime(); dia = addDays(dia, 1)) {
    const previsto = dayRequirements(weekPlanDayFor(dia.getDay(), weekPlan));
    if (dayCompletion(isoDate(dia), hojeIso, previsto, sessions) === 'cumprido') completed += 1;
  }

  // Sem teto explícito: a janela tem 168 dias, logo 24 de cada dia da semana e
  // no máximo `total` dias com treino. `completed` não tem como ultrapassá-lo.
  return {
    status: 'ok',
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    enteredAtWeek: entryWeek(plan),
  };
}

/** Em que semana o corredor entrou — `null` quando entrou na 1ª e não há o que explicar. */
function entryWeek(plan: ProgressPlan): number | null {
  const criado = dateOf(plan.createdAt);
  if (criado === null) return null;

  const naCriacao = trainingProgress(criado, plan.raceDate);
  if (naCriacao.status !== 'inPlan' && naCriacao.status !== 'raceDay') return null;

  return naCriacao.week > 1 ? naCriacao.week : null;
}

/**
 * `createdAt` vem do servidor como timestamp completo, mas os testes e a fila
 * local usam data pura. Aceita os dois — e nunca deixa `new Date('2026-08-22')`
 * interpretar UTC e devolver a véspera.
 */
function dateOf(iso: string): Date | null {
  const puro = parseIsoDate(iso);
  if (puro !== null) return puro;

  const instante = new Date(iso);
  return Number.isNaN(instante.getTime()) ? null : startOfDay(instante);
}
