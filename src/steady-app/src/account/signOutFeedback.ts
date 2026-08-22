import type { SignOutOutcome } from './signOutAccount';

/**
 * O que o corredor vê para cada desfecho da saída.
 *
 * Separado do hook porque são as duas únicas decisões da casca que podem estar
 * erradas em silêncio: a **ordem** entre fechar o menu e navegar, e o número no
 * aviso de descarte. O resto do menu é estado de React, verificável só no aparelho.
 */
export type SignOutEffects = {
  closeMenu(): void;
  goToLogin(): void;
  showFailure(): void;
};

export function applySignOutOutcome(outcome: SignOutOutcome, effects: SignOutEffects): void {
  if (outcome.status === 'failed') return effects.showFailure();

  // `pendingRecords` não é desfecho: a decisão ainda é do corredor, no diálogo.
  if (outcome.status !== 'signedOut') return;

  // Fechar primeiro. Invertido, o painel sobra montado sobre a tela de login.
  effects.closeMenu();
  effects.goToLogin();
}

/** O corredor precisa do número exato para decidir — "alguns registros" não decide nada. */
export function pendingRecordsWarning(count: number): string {
  return count === 1
    ? '1 registro ainda não foi enviado e será perdido se você sair agora.'
    : `${count} registros ainda não foram enviados e serão perdidos se você sair agora.`;
}
