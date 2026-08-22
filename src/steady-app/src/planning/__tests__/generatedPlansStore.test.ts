import {
  addGeneratedPlan,
  latestGeneratedPlan,
  listGeneratedPlans,
  resetGeneratedPlans,
} from '../generatedPlansStore';

/** Cenários da spec (specs/STORY-008/spec.bdd.md). */
describe('Histórico de planos gerados na sessão', () => {
  beforeEach(() => {
    resetGeneratedPlans();
  });

  it('não há plano nenhum antes da primeira geração', () => {
    expect(listGeneratedPlans()).toEqual([]);
    expect(latestGeneratedPlan()).toBeNull();
  });

  it('gerar um plano cria uma entrada com os dados preenchidos', () => {
    addGeneratedPlan({ raceDistance: '21.1', raceDate: '2026-12-06' });

    const plans = listGeneratedPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].raceDistance).toBe('21.1');
    expect(plans[0].raceDate).toBe('2026-12-06');
    expect(plans[0].id).toBeTruthy();
    expect(plans[0].createdAt).toBeInstanceOf(Date);
  });

  it('o plano mais recente vem primeiro na lista', () => {
    addGeneratedPlan({ raceDistance: '10', raceDate: '2026-09-01' });
    addGeneratedPlan({ raceDistance: '42.2', raceDate: '2027-04-12' });

    const plans = listGeneratedPlans();
    expect(plans).toHaveLength(2);
    expect(plans[0].raceDistance).toBe('42.2');
    expect(plans[1].raceDistance).toBe('10');
  });

  it('o plano mais recente é o último gerado', () => {
    addGeneratedPlan({ raceDistance: '10', raceDate: '2026-09-01' });
    addGeneratedPlan({ raceDistance: '42.2', raceDate: '2027-04-12' });

    expect(latestGeneratedPlan()?.raceDistance).toBe('42.2');
  });

  it('cada plano gerado recebe um id diferente', () => {
    const first = addGeneratedPlan({ raceDistance: '10', raceDate: '2026-09-01' });
    const second = addGeneratedPlan({ raceDistance: '42.2', raceDate: '2027-04-12' });

    expect(first.id).not.toBe(second.id);
  });
});
