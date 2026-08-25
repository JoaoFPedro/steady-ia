import { planProgress } from '../planProgress';
import { dayRequirements } from '../dayRequirements';
import { TRAINING_PLAN_DOCUMENT } from '../trainingPlanDocument';
import type { LoggedSession } from '../dayCompletion';

/**
 * Cenários da spec (specs/STORY-012/spec.bdd.md), regras 19 a 26.
 *
 * A janela são os 168 dias que terminam na prova; o denominador é 144 (24
 * semanas × 6 dias com treino). Quem entra no meio não chega a 100% — e a
 * tela diz em que semana entrou, para o teto não se ler como fracasso.
 */
describe('Quanto do plano já foi percorrido', () => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const mais = (base: Date, dias: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias);

  /** Sábado, 06/02/2027. A janela do plano começa 167 dias antes. */
  const PROVA = new Date(2027, 1, 6);
  const RACE_DATE = iso(PROVA);
  const INICIO = mais(PROVA, -167);

  /**
   * Domingo→sábado (`Date.getDay()`) para o índice de `weekPlan`, que é
   * segunda→domingo. Escrito à mão aqui de propósito: se a implementação
   * errar o deslocamento, o teste não erra junto.
   */
  const INDICE_NO_PLANO = [6, 0, 1, 2, 3, 4, 5];
  const previstoEm = (d: Date) =>
    dayRequirements(TRAINING_PLAN_DOCUMENT.weekPlan[INDICE_NO_PLANO[d.getDay()]]);

  /** Registra tudo que a grade pedia, dia a dia, no intervalo fechado. */
  function cumprindoTudo(de: Date, ate: Date): LoggedSession[] {
    const sessoes: LoggedSession[] = [];

    for (let d = de; d.getTime() <= ate.getTime(); d = mais(d, 1)) {
      const previsto = previstoEm(d);
      if (previsto.strength) sessoes.push({ date: iso(d), kind: 'strength' });
      if (previsto.run) sessoes.push({ date: iso(d), kind: 'running' });
    }

    return sessoes;
  }

  const plano = (createdAt: string) => ({ raceDate: RACE_DATE, createdAt });
  const desdeOInicio = plano(iso(INICIO));

  describe('a conta (regras 19 a 22)', () => {
    it('cumprir o plano inteiro desde a semana 1 chega a 100%', () => {
      expect(planProgress(PROVA, desdeOInicio, cumprindoTudo(INICIO, PROVA))).toEqual({
        status: 'ok',
        completed: 144,
        total: 144,
        percent: 100,
        enteredAtWeek: null,
      });
    });

    it('o denominador é 144 mesmo com o plano no começo', () => {
      expect(planProgress(INICIO, desdeOInicio, [])).toMatchObject({ total: 144, percent: 0 });
    });

    it('26 dias cumpridos são 18% do plano', () => {
      // Os 31 primeiros dias da janela (começa num domingo) têm 26 com treino.
      // Os dias 31 a 34 ficam sem registro de propósito.
      const sessoes = cumprindoTudo(INICIO, mais(INICIO, 30));

      expect(planProgress(mais(INICIO, 34), desdeOInicio, sessoes)).toEqual({
        status: 'ok',
        completed: 26,
        total: 144,
        percent: 18,
        enteredAtWeek: null,
      });
    });

    it('dia parcial não conta — meia quinta não é quinta (regra 21)', () => {
      const quinta = mais(INICIO, (4 - INICIO.getDay() + 7) % 7); // primeira quinta da janela
      const soMusculacao: LoggedSession[] = [{ date: iso(quinta), kind: 'strength' }];

      expect(planProgress(mais(quinta, 1), desdeOInicio, soMusculacao)).toMatchObject({
        completed: 0,
      });
    });

    it('nunca passa de 100% (regra 22)', () => {
      const demais = cumprindoTudo(mais(INICIO, -30), mais(PROVA, 30));

      expect(planProgress(PROVA, desdeOInicio, demais)).toMatchObject({
        completed: 144,
        percent: 100,
      });
    });

    it('registro fora da janela do plano não conta (regra 19)', () => {
      const antigos = cumprindoTudo(mais(INICIO, -60), mais(INICIO, -1));

      expect(planProgress(mais(INICIO, 3), desdeOInicio, antigos)).toMatchObject({
        completed: 0,
        percent: 0,
      });
    });

    it('o futuro da janela ainda não conta, mesmo já registrado', () => {
      const tudo = cumprindoTudo(INICIO, PROVA);
      const naSegundaSemana = mais(INICIO, 10);

      const resultado = planProgress(naSegundaSemana, desdeOInicio, tudo);

      expect(resultado).toMatchObject({ status: 'ok' });
      if (resultado.status !== 'ok') throw new Error('esperava progresso');
      expect(resultado.completed).toBeLessThan(144);
    });
  });

  describe('quem entrou no meio do plano (regra 23)', () => {
    /** Criado a 10 semanas da prova → semana 15 de 24. */
    const entrouTarde = mais(PROVA, -70);
    const planoTardio = plano(iso(entrouTarde));

    it('cumprindo tudo desde a entrada, o teto é 42% — e a semana de entrada é dita', () => {
      expect(
        planProgress(PROVA, planoTardio, cumprindoTudo(entrouTarde, PROVA)),
      ).toEqual({
        status: 'ok',
        completed: 61,
        total: 144,
        percent: 42,
        enteredAtWeek: 15,
      });
    });

    it('createdAt do servidor vem com hora — é o formato que produção usa', () => {
      const comHora = { raceDate: RACE_DATE, createdAt: `${iso(entrouTarde)}T13:45:00.000Z` };

      expect(planProgress(PROVA, comHora, [])).toMatchObject({ enteredAtWeek: 15 });
    });

    it('createdAt ilegível não inventa semana de entrada', () => {
      expect(planProgress(PROVA, plano('nem-data-nem-hora'), [])).toMatchObject({
        enteredAtWeek: null,
      });
    });

    it('quem começou na semana 1 não tem nada a explicar', () => {
      expect(planProgress(PROVA, desdeOInicio, [])).toMatchObject({ enteredAtWeek: null });
    });
  });

  describe('quando não há porcentagem a mostrar (regra 24)', () => {
    it('sem planejamento nenhum', () => {
      expect(planProgress(PROVA, null, [])).toEqual({ status: 'none' });
    });

    it('prova a mais de 24 semanas — o plano ainda não começou', () => {
      const longe = { raceDate: iso(mais(PROVA, 0)), createdAt: iso(PROVA) };
      const muitoAntes = mais(PROVA, -200);

      expect(planProgress(muitoAntes, longe, [])).toEqual({ status: 'none' });
    });

    it('a prova já passou', () => {
      expect(planProgress(mais(PROVA, 1), desdeOInicio, [])).toEqual({ status: 'none' });
    });

    it('data de prova ilegível', () => {
      expect(planProgress(PROVA, { raceDate: 'nao-e-data', createdAt: '' }, [])).toEqual({
        status: 'none',
      });
    });
  });

  describe('quando o histórico não pôde ser lido (regra 25)', () => {
    it('não vira 0% — vira "não consegui ler"', () => {
      expect(planProgress(PROVA, desdeOInicio, null)).toEqual({ status: 'unavailable' });
    });

    it('sem plano, a falta de histórico nem chega a importar', () => {
      expect(planProgress(PROVA, null, null)).toEqual({ status: 'none' });
    });
  });
});
