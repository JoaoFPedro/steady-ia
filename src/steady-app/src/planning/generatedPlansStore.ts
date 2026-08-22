import type { RaceDistance } from './trainingPlanRequest';

/**
 * Histórico de planos gerados na sessão atual (specs/STORY-008/spec.bdd.md).
 *
 * Módulo singleton em memória — sem `AsyncStorage`, sem API: Dashboard e
 * Planejamento são abas irmãs sem ancestral comum abaixo do `_layout.tsx`
 * raiz, e este é o jeito mais simples de compartilhar o histórico entre
 * elas. Fecha o app, perde a lista — decisão de produto registrada em
 * `specs/STORY-008/story.md` (persistência real fica para quando a geração
 * deixar de ser mockada).
 */
export type GeneratedPlan = {
  id: string;
  raceDistance: RaceDistance;
  raceDate: string;
  createdAt: Date;
};

let plans: GeneratedPlan[] = [];
let nextId = 1;

export function addGeneratedPlan(input: { raceDistance: RaceDistance; raceDate: string }): GeneratedPlan {
  const plan: GeneratedPlan = {
    id: String(nextId++),
    raceDistance: input.raceDistance,
    raceDate: input.raceDate,
    createdAt: new Date(),
  };
  plans = [plan, ...plans];
  return plan;
}

/** Mais recente primeiro. */
export function listGeneratedPlans(): GeneratedPlan[] {
  return plans;
}

export function latestGeneratedPlan(): GeneratedPlan | null {
  return plans[0] ?? null;
}

/** Só para teste — não há forma de "limpar o histórico" no produto. */
export function resetGeneratedPlans(): void {
  plans = [];
  nextId = 1;
}
