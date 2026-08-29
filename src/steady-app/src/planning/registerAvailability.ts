import { isoDate } from '../features/date';
import { dayCompletion, type DayStatus, type LoggedSession } from './dayCompletion';
import { dayRequirements } from './dayRequirements';
import type { WeekPlanDay } from './trainingPlanDocument';
import { startOfDay } from './trainingProgress';

/**
 * Se o dia ainda aceita registro (STORY-018).
 *
 * `cumprido` fecha o botão: tudo que o dia previa já tem registro, e um
 * segundo registro criaria sessão duplicada — a Lei do Domínio #2 não permite
 * apagar depois.
 *
 * `parcial` **continua aberto** de propósito. Ele só acontece em terça e
 * quinta, os dias combinados (ADR-011): o corredor registrou a musculação e a
 * corrida ainda falta. Fechar aqui tiraria dele o único caminho para registrar
 * o que resta.
 */
export function canRegisterDay(status: DayStatus): boolean {
  return status !== 'cumprido';
}

/**
 * O estado de hoje para efeito do botão de registro — **sem** o corte da
 * janela do plano que `weekStatuses` aplica.
 *
 * A janela (168 dias terminando na prova, regra 19) existe para manter exato o
 * denominador do progresso: registro fora dela não avança o plano. Mas "já
 * registrei o treino de hoje?" é outra pergunta, e a resposta não muda porque
 * a prova ainda está a onze meses. Sem esta leitura própria, quem monta o
 * plano com muita antecedência nunca via o botão fechar.
 *
 * Histórico ilegível (`null`) devolve `semMarca`: na dúvida o registro segue
 * liberado — bloquear por falha de leitura seria impedir o corredor de
 * registrar o treino que ele acabou de fazer (ADR-004).
 */
export function todayRegistrationStatus(
  today: Date,
  sessions: readonly LoggedSession[] | null,
  weekPlan: readonly WeekPlanDay[],
  todayIndex: number,
): DayStatus {
  const day = todayIndex < 0 ? undefined : weekPlan[todayIndex];
  if (sessions === null || day === undefined) return 'semMarca';

  const hojeIso = isoDate(startOfDay(today));
  return dayCompletion(hojeIso, hojeIso, dayRequirements(day), sessions);
}
