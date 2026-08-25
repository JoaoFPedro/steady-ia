import { trainingProgress } from '../planning/trainingProgress';
import { greeting } from './greeting';

/**
 * O cabeçalho da Dashboard, já resolvido em texto (specs/STORY-011).
 *
 * A tela só desenha: manter a decisão aqui é o que permite testá-la sem
 * `@testing-library/react-native`, indisponível no Expo SDK 57 (STORY-003).
 */
export type HomeHeader = {
  /** "Bom dia, João" — ou só "Bom dia" quando a conta não informa nome. */
  greeting: string;
  /** Semana e fase, ou o convite a planejar. `null` quando não há o que dizer. */
  line: string | null;
  /** Etiqueta de contagem à direita: "15 semanas", "É hoje" ou nenhuma. */
  tag: string | null;
};

/** Só o que o cabeçalho precisa de um planejamento — não o `PlanRequestSummary` inteiro. */
export type PlannedRace = { raceDate: string };

const CONVITE = 'Crie seu planejamento para ver sua semana';

/** `plans` vem do mais recente para o mais antigo, como `loadPlanList` devolve. */
export function homeHeader(
  now: Date,
  displayName: string | null,
  plans: readonly PlannedRace[],
): HomeHeader {
  const saudacao = greeting(now.getHours(), displayName);
  const progress = trainingProgress(now, plans[0]?.raceDate ?? null);

  switch (progress.status) {
    case 'noPlan':
      return { greeting: saudacao, line: CONVITE, tag: null };

    case 'raceOver':
      return { greeting: saudacao, line: null, tag: null };

    case 'beforeStart':
      return {
        greeting: saudacao,
        line: `O plano começa em ${weeks(progress.weeksToStart)}`,
        tag: weeks(progress.weeksToRace),
      };

    case 'raceDay':
      return { greeting: saudacao, line: planLine(progress), tag: 'É hoje' };

    case 'inPlan':
      return { greeting: saudacao, line: planLine(progress), tag: weeks(progress.weeksToRace) };
  }
}

const planLine = (p: { week: number; totalWeeks: number; phase: string }) =>
  `Semana ${p.week} de ${p.totalWeeks} · fase ${p.phase}`;

const weeks = (n: number) => (n === 1 ? '1 semana' : `${n} semanas`);
