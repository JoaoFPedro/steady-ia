import { applySignOutOutcome, pendingRecordsWarning } from '../signOutFeedback';

/**
 * Cenários da spec (specs/STORY-005/spec.bdd.md):
 *  - "Corredor sai da conta pelo rodapé do menu"      → menu fecha, depois navega
 *  - "Falha ao encerrar a sessão a partir do menu"    → avisa, menu continua aberto
 *  - "Corredor sai pelo menu tendo registros pendentes" → o número no aviso
 */

function effects() {
  const events: string[] = [];

  return {
    events,
    spy: {
      closeMenu: () => void events.push('closeMenu'),
      goToLogin: () => void events.push('goToLogin'),
      showFailure: () => void events.push('showFailure'),
    },
  };
}

describe('Desfecho da saída no menu', () => {
  it('fecha o menu ANTES de levar ao login', () => {
    const { events, spy } = effects();

    applySignOutOutcome({ status: 'signedOut' }, spy);

    // Invertido, o painel ficaria montado sobre a tela de login (regra 8).
    expect(events).toEqual(['closeMenu', 'goToLogin']);
  });

  it('avisa da falha sem fechar o menu nem navegar', () => {
    const { events, spy } = effects();

    applySignOutOutcome({ status: 'failed' }, spy);

    expect(events).toEqual(['showFailure']);
  });

  it('não navega quando ainda falta a confirmação do descarte', () => {
    const { events, spy } = effects();

    applySignOutOutcome({ status: 'pendingRecords', count: 3 }, spy);

    expect(events).toEqual([]);
  });
});

describe('Aviso de registros pendentes', () => {
  it('usa o singular para um registro', () => {
    expect(pendingRecordsWarning(1)).toBe(
      '1 registro ainda não foi enviado e será perdido se você sair agora.',
    );
  });

  it('usa o plural e o número exato — "alguns registros" não deixa ninguém decidir', () => {
    expect(pendingRecordsWarning(3)).toBe(
      '3 registros ainda não foram enviados e serão perdidos se você sair agora.',
    );
  });
});
