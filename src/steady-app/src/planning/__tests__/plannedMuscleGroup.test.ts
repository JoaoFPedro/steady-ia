import { plannedMuscleGroup } from '../plannedMuscleGroup';
import { TRAINING_PLAN_DOCUMENT } from '../trainingPlanDocument';
import { MUSCLE_GROUPS } from '../../training/labels';

/**
 * Cenários da spec (specs/STORY-012/spec.bdd.md), regra 8.
 *
 * O formulário chega sabendo o treino do dia, mas só pré-seleciona o grupo
 * muscular quando a grade é inequívoca. Nos dias de perna ela não é — e a tela
 * não adivinha.
 */
describe('Grupo muscular que a grade do dia indica', () => {
  const [segunda, terca, quarta, quinta, sexta, sabado, domingo] =
    TRAINING_PLAN_DOCUMENT.weekPlan;

  it('pré-seleciona onde a grade aponta um grupo só', () => {
    expect(plannedMuscleGroup(terca)).toBe('PeitoTriceps');
    expect(plannedMuscleGroup(quarta)).toBe('Ombro');
    expect(plannedMuscleGroup(quinta)).toBe('BicepsCostas');
  });

  it('não adivinha nos dias de perna: a grade cobre frontal e posterior', () => {
    expect(plannedMuscleGroup(segunda)).toBeNull();
    expect(plannedMuscleGroup(sexta)).toBeNull();
  });

  it('dias sem musculação não indicam grupo nenhum', () => {
    expect(plannedMuscleGroup(sabado)).toBeNull();
    expect(plannedMuscleGroup(domingo)).toBeNull();
  });

  it('todo grupo indicado existe entre os que a tela de registro oferece', () => {
    const oferecidos = MUSCLE_GROUPS.map((opcao) => opcao.value);

    for (const dia of TRAINING_PLAN_DOCUMENT.weekPlan) {
      const indicado = plannedMuscleGroup(dia);
      if (indicado !== null) expect(oferecidos).toContain(indicado);
    }
  });
});
