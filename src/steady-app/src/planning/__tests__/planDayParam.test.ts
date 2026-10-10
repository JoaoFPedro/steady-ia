import { planDayFromParam, planDayIndexFromParam, sectionFromParam } from '../planDayParam';
import { TRAINING_PLAN_DOCUMENT } from '../trainingPlanDocument';

/**
 * Parâmetro de rota é entrada externa — mesmo vindo da nossa própria tela.
 * Um deep link malformado abre a tela como ela sempre abriu, nunca num estado
 * inventado (specs/STORY-012, regras 3 e 7).
 */
describe('Parâmetros da rota do planejamento', () => {
  const { weekPlan } = TRAINING_PLAN_DOCUMENT;

  describe('dia da grade', () => {
    it('aceita os sete índices válidos', () => {
      expect(planDayFromParam('0')).toBe(weekPlan[0]);
      expect(planDayFromParam('3')).toBe(weekPlan[3]);
      expect(planDayFromParam('6')).toBe(weekPlan[6]);
    });

    it('ausente devolve nulo', () => {
      expect(planDayFromParam(undefined)).toBeNull();
    });

    it('vazio devolve nulo — `Number("")` é zero e abriria a segunda', () => {
      expect(planDayFromParam('')).toBeNull();
      expect(planDayFromParam('   ')).toBeNull();
    });

    it('fora do intervalo devolve nulo', () => {
      expect(planDayFromParam('-1')).toBeNull();
      expect(planDayFromParam('7')).toBeNull();
      expect(planDayFromParam('999')).toBeNull();
    });

    it('o que não é inteiro devolve nulo', () => {
      expect(planDayFromParam('2.5')).toBeNull();
      expect(planDayFromParam('quinta')).toBeNull();
      expect(planDayFromParam('NaN')).toBeNull();
      expect(planDayFromParam('0x2')).toBeNull();
    });
  });

  describe('índice do dia — mesma validação, outro formato', () => {
    it('devolve o índice quando o dia é válido', () => {
      expect(planDayIndexFromParam('0')).toBe(0);
      expect(planDayIndexFromParam('6')).toBe(6);
    });

    it('recusa exatamente o que a outra recusa', () => {
      for (const entrada of [undefined, '', '   ', '-1', '7', '2.5', 'quinta', '0x2']) {
        expect(planDayIndexFromParam(entrada)).toBeNull();
        expect(planDayFromParam(entrada)).toBeNull();
      }
    });
  });

  describe('aba de entrada', () => {
    it('reconhece as abas que existem', () => {
      expect(sectionFromParam('semana')).toBe('semana');
      expect(sectionFromParam('regras')).toBe('regras');
    });

    it('link legado de mobilidade abre a Semana, onde o conteúdo passou a viver', () => {
      expect(sectionFromParam('mobilidade')).toBe('semana');
    });

    it('qualquer outra coisa abre em "Seus dados", como sempre abriu (regra 3)', () => {
      expect(sectionFromParam(undefined)).toBe('dados');
      expect(sectionFromParam('')).toBe('dados');
      expect(sectionFromParam('inexistente')).toBe('dados');
    });
  });
});
