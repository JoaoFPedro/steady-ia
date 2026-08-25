import { homeHeader } from '../homeHeader';

/**
 * Cenários da spec (specs/STORY-011/spec.bdd.md): o cabeçalho inteiro, do
 * planejamento mais recente até o texto que a tela desenha.
 */
describe('Cabeçalho da Dashboard', () => {
  const manhaDe22 = new Date(2026, 7, 22, 8, 0); // sábado, 22/08/2026, 8h

  const plano = (raceDate: string) => ({ raceDate });
  /** `emSemanas(15)` → data da prova daqui a 15 semanas. */
  function emSemanas(semanas: number): string {
    const data = new Date(2026, 7, 22 + semanas * 7);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
  }

  it('mostra saudação, quanto falta e onde estou no plano', () => {
    const header = homeHeader(manhaDe22, 'João Pedro Silva', [plano(emSemanas(15))]);

    expect(header).toEqual({
      greeting: 'Bom dia, João',
      line: 'Semana 10 de 24 · fase Construção',
      tag: '15 semanas',
    });
  });

  it('sem planejamento nenhum, convida a criar um — sem semana, fase ou contagem', () => {
    const header = homeHeader(manhaDe22, 'João Pedro Silva', []);

    expect(header).toEqual({
      greeting: 'Bom dia, João',
      line: 'Crie seu planejamento para ver sua semana',
      tag: null,
    });
  });

  it('com a prova distante, diz em quantas semanas o plano começa', () => {
    const header = homeHeader(manhaDe22, null, [plano(emSemanas(30))]);

    expect(header).toEqual({
      greeting: 'Bom dia',
      line: 'O plano começa em 6 semanas',
      tag: '30 semanas',
    });
  });

  it('na véspera, fala no singular', () => {
    const header = homeHeader(manhaDe22, null, [plano('2026-08-23')]);

    expect(header.tag).toBe('1 semana');
    expect(header.line).toBe('Semana 24 de 24 · fase Polimento');
  });

  it('no dia da prova, marca que é hoje', () => {
    const header = homeHeader(manhaDe22, null, [plano('2026-08-22')]);

    expect(header.tag).toBe('É hoje');
    expect(header.line).toBe('Semana 24 de 24 · fase Polimento');
  });

  it('passada a prova, resta só a saudação', () => {
    const header = homeHeader(manhaDe22, 'João', [plano('2026-08-15')]);

    expect(header).toEqual({ greeting: 'Bom dia, João', line: null, tag: null });
  });

  it('usa o planejamento mais recente quando há mais de um', () => {
    // `loadPlanList` já devolve do mais recente para o mais antigo.
    const header = homeHeader(manhaDe22, null, [plano(emSemanas(15)), plano(emSemanas(30))]);

    expect(header.tag).toBe('15 semanas');
  });

  it('planejamento ainda na fila já orienta o cabeçalho', () => {
    // Para o cabeçalho, pendente e sincronizado são a mesma coisa: o que
    // importa é a data da prova, e ela é do corredor desde que ele a digitou.
    const naFila = { raceDate: emSemanas(4), idempotencyKey: 'chave-1', pending: true };
    const header = homeHeader(manhaDe22, null, [naFila]);

    expect(header.line).toBe('Semana 21 de 24 · fase Polimento');
  });

  it('data de prova ilegível cai no convite, sem quebrar a tela', () => {
    const header = homeHeader(manhaDe22, null, [plano('23/08/2026')]);

    expect(header).toEqual({
      greeting: 'Bom dia',
      line: 'Crie seu planejamento para ver sua semana',
      tag: null,
    });
  });
});
