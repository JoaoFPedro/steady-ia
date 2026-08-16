/**
 * Só o que a ida ao login usa do router do `expo-router` — mantém a regra
 * testável sem montar navegação de verdade.
 */
export type LoginRedirect = {
  canDismiss(): boolean;
  dismissAll(): void;
  replace(href: '/login'): void;
};

/**
 * Leva o corredor ao login sem deixar tela autenticada no histórico.
 *
 * `replace` sozinho troca apenas a tela atual: saindo de `/account`, ou caindo
 * no login a partir de `/log/run`, a home continuaria empilhada e o gesto de
 * voltar a reexibiria — já sem sessão. Esvaziar a pilha antes é o que fecha isso.
 */
export function goToLogin(router: LoginRedirect): void {
  if (router.canDismiss()) router.dismissAll();

  router.replace('/login');
}
