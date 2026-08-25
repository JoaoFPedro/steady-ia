import { greeting } from '../greeting';

/**
 * Cenários da spec (specs/STORY-011/spec.bdd.md), regras 1 e 2.
 * A hora é a do aparelho; o nome vem da conta Google já resolvida (AccountView).
 */
describe('Saudação do cabeçalho da Dashboard', () => {
  it('saúda pelo primeiro nome de manhã', () => {
    expect(greeting(8, 'João Pedro Silva')).toBe('Bom dia, João');
  });

  it('acompanha o período do dia', () => {
    expect(greeting(14, 'João Pedro Silva')).toBe('Boa tarde, João');
    expect(greeting(21, 'João Pedro Silva')).toBe('Boa noite, João');
  });

  it('trata a madrugada como noite, não como manhã', () => {
    expect(greeting(3, 'João')).toBe('Boa noite, João');
  });

  it('vira o período nas bordas exatas', () => {
    expect(greeting(5, null)).toBe('Bom dia');
    expect(greeting(11, null)).toBe('Bom dia');
    expect(greeting(12, null)).toBe('Boa tarde');
    expect(greeting(17, null)).toBe('Boa tarde');
    expect(greeting(18, null)).toBe('Boa noite');
    expect(greeting(4, null)).toBe('Boa noite');
  });

  it('saúda sem nome quando a conta não informa nome', () => {
    expect(greeting(8, null)).toBe('Bom dia');
  });

  it('não saúda pelo e-mail nem por um nome em branco', () => {
    expect(greeting(8, '   ')).toBe('Bom dia');
  });
});
