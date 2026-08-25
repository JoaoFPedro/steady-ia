import { PLAN_PHASES, PLAN_TOTAL_WEEKS, trainingProgress } from '../trainingProgress';
import { TRAINING_PLAN_DOCUMENT } from '../trainingPlanDocument';

/**
 * Cenários da spec (specs/STORY-011/spec.bdd.md), regras 4 a 6, 8, 9 e 10.
 * O plano é contado de trás para frente: a semana da prova é a 24ª.
 */
describe('Onde o corredor está no plano', () => {
  const hoje = new Date(2026, 7, 22); // sábado, 22/08/2026 — hora zero local

  /** Data da prova em ISO, a `dias` do `hoje` acima. */
  function emDias(dias: number): string {
    const data = new Date(2026, 7, 22 + dias);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
  }

  const emSemanas = (semanas: number) => emDias(semanas * 7);

  it('mostra a semana, a fase e quanto falta', () => {
    expect(trainingProgress(hoje, emSemanas(15))).toEqual({
      status: 'inPlan',
      week: 10,
      totalWeeks: 24,
      phase: 'Construção',
      weeksToRace: 15,
    });
  });

  it('a fase acompanha o avanço do plano', () => {
    expect(trainingProgress(hoje, emSemanas(24))).toMatchObject({ week: 1, phase: 'Base' });
    expect(trainingProgress(hoje, emSemanas(17))).toMatchObject({ week: 8, phase: 'Base' });
    expect(trainingProgress(hoje, emSemanas(16))).toMatchObject({ week: 9, phase: 'Construção' });
    expect(trainingProgress(hoje, emSemanas(9))).toMatchObject({ week: 16, phase: 'Construção' });
    expect(trainingProgress(hoje, emSemanas(8))).toMatchObject({ week: 17, phase: 'Pico' });
    expect(trainingProgress(hoje, emSemanas(5))).toMatchObject({ week: 20, phase: 'Pico' });
    expect(trainingProgress(hoje, emSemanas(4))).toMatchObject({ week: 21, phase: 'Polimento' });
    expect(trainingProgress(hoje, emSemanas(1))).toMatchObject({ week: 24, phase: 'Polimento' });
  });

  it('conta as semanas para cima: a véspera é uma semana, não zero', () => {
    expect(trainingProgress(hoje, emDias(1))).toMatchObject({ weeksToRace: 1, week: 24 });
    expect(trainingProgress(hoje, emDias(7))).toMatchObject({ weeksToRace: 1, week: 24 });
    expect(trainingProgress(hoje, emDias(8))).toMatchObject({ weeksToRace: 2, week: 23 });
  });

  it('com a prova a mais de 24 semanas, o plano ainda não começou', () => {
    expect(trainingProgress(hoje, emSemanas(30))).toEqual({
      status: 'beforeStart',
      weeksToRace: 30,
      weeksToStart: 6,
    });
  });

  it('um dia além das 24 semanas ainda é véspera do início do plano', () => {
    expect(trainingProgress(hoje, emDias(24 * 7 + 1))).toEqual({
      status: 'beforeStart',
      weeksToRace: 25,
      weeksToStart: 1,
    });
  });

  it('no dia da prova, é hoje — e é a última semana', () => {
    expect(trainingProgress(hoje, emDias(0))).toEqual({
      status: 'raceDay',
      week: 24,
      totalWeeks: 24,
      phase: 'Polimento',
    });
  });

  it('passada a prova, não há mais plano corrente', () => {
    expect(trainingProgress(hoje, emDias(-1))).toEqual({ status: 'raceOver' });
    expect(trainingProgress(hoje, emDias(-7))).toEqual({ status: 'raceOver' });
  });

  it('ignora a hora do aparelho: o que conta é o dia', () => {
    const fimDaTarde = new Date(2026, 7, 22, 23, 59);

    expect(trainingProgress(fimDaTarde, emDias(0))).toMatchObject({ status: 'raceDay' });
    expect(trainingProgress(fimDaTarde, emDias(1))).toMatchObject({ weeksToRace: 1 });
  });

  it('sem planejamento, ou com data ilegível, não afirma nada', () => {
    expect(trainingProgress(hoje, null)).toEqual({ status: 'noPlan' });
    expect(trainingProgress(hoje, '')).toEqual({ status: 'noPlan' });
    expect(trainingProgress(hoje, '22/08/2027')).toEqual({ status: 'noPlan' });
    expect(trainingProgress(hoje, '2027-13-45')).toEqual({ status: 'noPlan' });
  });

  /** Regra 6: divergir do documento faria Dashboard e plano discordarem na mesma tela. */
  it('usa os mesmos limites de fase escritos no documento do plano', () => {
    const doDocumento = TRAINING_PLAN_DOCUMENT.phases.map((fase) => {
      const [, de, ate] = /Sem\. (\d+)–(\d+)/.exec(fase.weeks) as RegExpExecArray;
      return { name: fase.name.replace(/^\d+\.\s*/, ''), from: Number(de), to: Number(ate) };
    });

    expect(PLAN_PHASES).toHaveLength(doDocumento.length);
    PLAN_PHASES.forEach((fase, i) => {
      expect(fase.from).toBe(doDocumento[i].from);
      expect(fase.to).toBe(doDocumento[i].to);
      expect(doDocumento[i].name.startsWith(fase.name)).toBe(true);
    });
    expect(PLAN_TOTAL_WEEKS).toBe(doDocumento[doDocumento.length - 1].to);
  });
});
