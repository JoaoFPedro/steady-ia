import { dayRequirements } from '../dayRequirements';
import { TRAINING_PLAN_DOCUMENT } from '../trainingPlanDocument';

/**
 * Cenários da spec (specs/STORY-012/spec.bdd.md), regra 4.
 *
 * A grade já carrega o que cada dia prevê: `hasRun` diz da corrida, a lista de
 * exercícios diz da musculação. Nada novo é escrito em `trainingPlanDocument`.
 */
describe('O que cada dia da grade prevê', () => {
  const [segunda, terca, quarta, quinta, sexta, sabado, domingo] =
    TRAINING_PLAN_DOCUMENT.weekPlan;

  it('dias só de musculação — segunda, quarta e sexta', () => {
    expect(dayRequirements(segunda)).toEqual({ run: false, strength: true });
    expect(dayRequirements(quarta)).toEqual({ run: false, strength: true });
    expect(dayRequirements(sexta)).toEqual({ run: false, strength: true });
  });

  it('dias combinados — terça e quinta preveem as duas modalidades', () => {
    expect(dayRequirements(terca)).toEqual({ run: true, strength: true });
    expect(dayRequirements(quinta)).toEqual({ run: true, strength: true });
  });

  it('sábado é longão: corrida sem musculação', () => {
    expect(dayRequirements(sabado)).toEqual({ run: true, strength: false });
  });

  it('domingo é descanso: não prevê nada', () => {
    expect(dayRequirements(domingo)).toEqual({ run: false, strength: false });
  });

  it('a semana tem 6 dias com treino — domingo é o único vazio', () => {
    const comTreino = TRAINING_PLAN_DOCUMENT.weekPlan.filter((dia) => {
      const previsto = dayRequirements(dia);
      return previsto.run || previsto.strength;
    });

    expect(comTreino).toHaveLength(6);
  });
});
