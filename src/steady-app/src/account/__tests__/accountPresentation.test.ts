import { presentAccount } from '../accountPresentation';

/**
 * Cenários da spec (specs/STORY-005/spec.bdd.md):
 *  - "Corredor reconhece em qual conta está"
 *  - "Conta Google sem foto"
 *  - "Foto não carrega por falta de conexão"
 *  - "Conta Google sem nome"
 *  - "Aparelho não informa qual conta está autenticada"
 */
describe('Identidade exibida no menu', () => {
  it('mostra foto, nome e e-mail quando a conta tem tudo', () => {
    const view = presentAccount({
      email: 'corredor@gmail.com',
      name: 'João Pedro',
      photoUrl: 'https://lh3.googleusercontent.com/foto',
    });

    expect(view.email).toBe('corredor@gmail.com');
    expect(view.displayName).toBe('João Pedro');
    expect(view.photoUrl).toBe('https://lh3.googleusercontent.com/foto');
  });

  it('sempre oferece uma inicial, mesmo quando há foto — o avatar não pode depender da rede', () => {
    const view = presentAccount({
      email: 'corredor@gmail.com',
      name: 'João Pedro',
      photoUrl: 'https://lh3.googleusercontent.com/foto',
    });

    expect(view.initial).toBe('J');
  });

  it('cai para a inicial do nome quando a conta não tem foto', () => {
    const view = presentAccount({ email: 'corredor@gmail.com', name: 'Ana', photoUrl: null });

    expect(view.photoUrl).toBeNull();
    expect(view.initial).toBe('A');
  });

  it('tira a inicial do e-mail quando não há nome', () => {
    const view = presentAccount({ email: 'corredor@gmail.com', name: null, photoUrl: null });

    expect(view.displayName).toBeNull();
    expect(view.initial).toBe('C');
  });

  it('trata nome em branco como ausente — não vira inicial vazia', () => {
    const view = presentAccount({ email: 'corredor@gmail.com', name: '   ', photoUrl: null });

    expect(view.displayName).toBeNull();
    expect(view.initial).toBe('C');
  });

  it('degrada sem quebrar quando o aparelho não informa a conta', () => {
    const view = presentAccount(null);

    expect(view.displayName).toBeNull();
    expect(view.email).toBeNull();
    expect(view.photoUrl).toBeNull();
    // O avatar continua desenhável e tocável: é o gatilho do menu.
    expect(view.initial).toBe('?');
  });
});
