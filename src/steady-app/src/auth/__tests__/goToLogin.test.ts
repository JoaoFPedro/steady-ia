import { goToLogin, type LoginRedirect } from '../goToLogin';

/**
 * Cenário da spec (specs/STORY-004/spec.bdd.md):
 *  - "Corredor não retorna a telas autenticadas pelo histórico de navegação"
 *
 * `replace` sozinho troca apenas a tela atual. Saindo de `/account` — ou caindo
 * no login a partir de `/log/run` — a home continuaria na pilha, e o gesto de
 * voltar devolveria o corredor a uma tela autenticada sem sessão.
 */

function router(canDismiss: boolean) {
  const events: string[] = [];

  const fake: LoginRedirect = {
    canDismiss: () => canDismiss,
    dismissAll: () => void events.push('dismissAll'),
    replace: (href) => void events.push(`replace:${href}`),
  };

  return { fake, events };
}

describe('Ir para o login', () => {
  it('esvazia a pilha antes de trocar pela tela de login', async () => {
    const { fake, events } = router(true);

    goToLogin(fake);

    expect(events).toEqual(['dismissAll', 'replace:/login']);
  });

  it('vai direto ao login quando já está na raiz da pilha', async () => {
    const { fake, events } = router(false);

    goToLogin(fake);

    // `dismissAll` na raiz é no-op na melhor das hipóteses; não vale chamar.
    expect(events).toEqual(['replace:/login']);
  });
});
