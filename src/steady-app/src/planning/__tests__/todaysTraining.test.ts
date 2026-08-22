import { todaysTraining } from '../todaysTraining';
import { TRAINING_PLAN_DOCUMENT } from '../trainingPlanDocument';

const { weekPlan } = TRAINING_PLAN_DOCUMENT;

/**
 * Cenários da spec (specs/STORY-007/spec.bdd.md).
 * `Date.getDay()`: 0 = domingo … 6 = sábado.
 */
describe('Treino do dia no card da Dashboard', () => {
  it('segunda-feira mostra perna pesada, sem corrida', () => {
    const training = todaysTraining(1, weekPlan);

    expect(training.title).toBe('Perna (pesada)');
    expect(training.title).not.toContain('+');
    expect(training.description).toBe(weekPlan[0].intro);
  });

  it('terça-feira interpola musculação e corrida moderada com "+"', () => {
    const training = todaysTraining(2, weekPlan);

    expect(training.title).toBe('Peito e tríceps + corrida moderada');
    expect(training.description).toBe(weekPlan[1].runNote);
  });

  it('quinta-feira interpola musculação e corrida de qualidade com "+"', () => {
    const training = todaysTraining(4, weekPlan);

    expect(training.title).toBe('Costas e bíceps + corrida de qualidade');
    expect(training.description).toBe(weekPlan[3].runNote);
  });

  it('sábado mostra só o longão, sem "+"', () => {
    const training = todaysTraining(6, weekPlan);

    expect(training.title).toBe('Longão');
    expect(training.title).not.toContain('+');
    expect(training.description).toBe(weekPlan[5].intro);
  });

  it('domingo mostra descanso', () => {
    const training = todaysTraining(0, weekPlan);

    expect(training.title).toBe('Descanso');
    expect(training.description).toBe(weekPlan[6].intro);
  });

  it('quarta-feira mostra ombro, sem corrida', () => {
    const training = todaysTraining(3, weekPlan);

    expect(training.title).toBe('Ombro');
    expect(training.title).not.toContain('+');
  });

  it('sexta-feira mostra perna leve, sem corrida', () => {
    const training = todaysTraining(5, weekPlan);

    expect(training.title).toBe('Perna (leve)');
    expect(training.title).not.toContain('+');
  });
});
