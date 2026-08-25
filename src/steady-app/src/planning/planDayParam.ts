import { TRAINING_PLAN_DOCUMENT, type WeekPlanDay } from './trainingPlanDocument';

/**
 * Leitura dos parâmetros da rota do planejamento (specs/STORY-012, regras 3 e 7).
 *
 * Parâmetro de rota é entrada externa, mesmo quando quem o escreveu foi a nossa
 * própria tela: um deep link pode chegar de qualquer lugar. Nada aqui confia em
 * `Number()`, que aceita `''` como zero e `'0x2'` como dois — os dois abririam
 * um dia que ninguém pediu.
 */
const UM_DIGITO = /^\d$/;

/** Índice do dia na grade — a validação mora aqui, e só aqui. */
export function planDayIndexFromParam(
  valor: string | undefined,
  weekPlan: readonly WeekPlanDay[] = TRAINING_PLAN_DOCUMENT.weekPlan,
): number | null {
  if (valor === undefined || !UM_DIGITO.test(valor)) return null;

  const indice = Number(valor);
  return indice < weekPlan.length ? indice : null;
}

export function planDayFromParam(
  valor: string | undefined,
  weekPlan: readonly WeekPlanDay[] = TRAINING_PLAN_DOCUMENT.weekPlan,
): WeekPlanDay | null {
  const indice = planDayIndexFromParam(valor, weekPlan);
  return indice === null ? null : weekPlan[indice];
}

export type SectionId = 'dados' | 'fases' | 'semana' | 'mobilidade' | 'regras';

const SECTIONS: SectionId[] = ['dados', 'fases', 'semana', 'mobilidade', 'regras'];

/** Aba desconhecida abre em "Seus dados" — o comportamento de sempre (regra 3). */
export function sectionFromParam(valor: string | undefined): SectionId {
  return SECTIONS.find((secao) => secao === valor) ?? 'dados';
}
