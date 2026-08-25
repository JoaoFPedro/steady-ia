import { requiresTraining, type DayRequirements } from './dayRequirements';

/**
 * Estado de um dia do plano (specs/STORY-012, regras 11 a 18).
 *
 * **Derivado, nunca gravado.** Não existe carimbo de "concluí": o dia fecha
 * porque os registros daquela data satisfazem o que a grade previa. É o que
 * dispensa entidade nova e mantém a Lei do Domínio #2 intacta — as sessões já
 * são imutáveis e esta leitura herda isso.
 */
export type DayStatus =
  /** Todas as modalidades previstas têm registro na data. */
  | 'cumprido'
  /** Parte delas — só possível em terça e quinta, os dias combinados. */
  | 'parcial'
  /** Data passada, previa treino, não tem registro nenhum. */
  | 'naoFeito'
  /** Domingo, o dia em curso ainda vazio, e tudo que ainda não chegou. */
  | 'semMarca';

/** O mínimo que a conta precisa de uma sessão — de onde ela veio não importa. */
export type LoggedSession = { date: string; kind: 'running' | 'strength' };

/**
 * Datas em ISO (`YYYY-MM-DD`) de propósito: comparam-se lexicograficamente,
 * sem `Date`, sem fuso e sem horário de verão no meio do caminho.
 */
export function dayCompletion(
  date: string,
  today: string,
  required: DayRequirements,
  sessions: readonly LoggedSession[],
): DayStatus {
  if (!requiresTraining(required)) return 'semMarca';
  if (date > today) return 'semMarca';

  const doDia = sessions.filter((sessao) => sessao.date === date);
  const feito = {
    run: doDia.some((sessao) => sessao.kind === 'running'),
    strength: doDia.some((sessao) => sessao.kind === 'strength'),
  };

  const faltando =
    (required.run && !feito.run) || (required.strength && !feito.strength);

  if (!faltando) return 'cumprido';

  const algumaFeita = (required.run && feito.run) || (required.strength && feito.strength);
  if (algumaFeita) return 'parcial';

  // Vazio: hoje ainda dá tempo, ontem não dá mais.
  return date === today ? 'semMarca' : 'naoFeito';
}
