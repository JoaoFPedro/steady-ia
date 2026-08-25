import { dayCompletion, type LoggedSession } from '../dayCompletion';

/**
 * Cenários da spec (specs/STORY-012/spec.bdd.md), regras 11 a 18.
 *
 * O dia se fecha sozinho: nenhum destes testes marca nada — todos apenas
 * registram treino e perguntam em que estado o dia ficou.
 */
describe('Estado de um dia do plano', () => {
  const HOJE = '2026-08-20'; // quinta-feira

  const combinado = { run: true, strength: true };
  const soMusculacao = { run: false, strength: true };
  const soCorrida = { run: true, strength: false };
  const descanso = { run: false, strength: false };

  const corrida = (date: string): LoggedSession => ({ date, kind: 'running' });
  const musculacao = (date: string): LoggedSession => ({ date, kind: 'strength' });

  const estado = (
    date: string,
    previsto: { run: boolean; strength: boolean },
    sessions: LoggedSession[],
  ) => dayCompletion(date, HOJE, previsto, sessions);

  describe('cumprido — todas as modalidades previstas têm registro (regra 11)', () => {
    it('dia combinado com as duas registradas', () => {
      expect(estado(HOJE, combinado, [musculacao(HOJE), corrida(HOJE)])).toBe('cumprido');
    });

    it('dia só de musculação com a musculação registrada', () => {
      expect(estado(HOJE, soMusculacao, [musculacao(HOJE)])).toBe('cumprido');
    });

    it('sábado com o longão registrado', () => {
      expect(estado(HOJE, soCorrida, [corrida(HOJE)])).toBe('cumprido');
    });
  });

  describe('parcial — parte das previstas (regra 12)', () => {
    it('dia combinado com só a musculação é parcial, não cumprido', () => {
      expect(estado(HOJE, combinado, [musculacao(HOJE)])).toBe('parcial');
    });

    it('dia combinado com só a corrida também é parcial', () => {
      expect(estado(HOJE, combinado, [corrida(HOJE)])).toBe('parcial');
    });

    it('parcial existe mesmo no dia em curso — não é falha, é meio caminho', () => {
      expect(estado(HOJE, combinado, [corrida(HOJE)])).toBe('parcial');
    });
  });

  describe('não feito — data passada, prevista e vazia (regra 13)', () => {
    it('a quarta passou sem registro nenhum', () => {
      expect(estado('2026-08-19', soMusculacao, [])).toBe('naoFeito');
    });

    it('registro em outra data não salva o dia', () => {
      expect(estado('2026-08-19', soMusculacao, [musculacao(HOJE)])).toBe('naoFeito');
    });
  });

  describe('sem marca — o dia em curso e o que ainda vem (regra 14)', () => {
    it('hoje sem registro nenhum não é falha', () => {
      expect(estado(HOJE, combinado, [])).toBe('semMarca');
    });

    it('dia futuro não recebe marca', () => {
      expect(estado('2026-08-22', soCorrida, [])).toBe('semMarca');
    });

    it('nem mesmo um futuro já registrado vira cumprido antes da hora', () => {
      expect(estado('2026-08-22', soCorrida, [corrida('2026-08-22')])).toBe('semMarca');
    });
  });

  it('domingo nunca recebe marca: não há o que cumprir (regra 15)', () => {
    expect(estado('2026-08-16', descanso, [])).toBe('semMarca');
    expect(estado(HOJE, descanso, [])).toBe('semMarca');
    expect(estado(HOJE, descanso, [corrida(HOJE)])).toBe('semMarca');
  });

  it('não confere grupo muscular nem distância — qualquer registro serve (regra 17)', () => {
    // A grade pedia costas e bíceps; o corredor registrou perna. O dia fecha.
    expect(estado(HOJE, soMusculacao, [musculacao(HOJE)])).toBe('cumprido');
  });

  it('registrar de novo num dia cumprido não altera o estado (regra 18)', () => {
    const umaVez = estado(HOJE, combinado, [musculacao(HOJE), corrida(HOJE)]);
    const duasVezes = estado(HOJE, combinado, [
      musculacao(HOJE),
      corrida(HOJE),
      corrida(HOJE),
      musculacao(HOJE),
    ]);

    expect(umaVez).toBe('cumprido');
    expect(duasVezes).toBe('cumprido');
  });
});
