import { planProgressView } from '../planProgressView';

/**
 * Cenários da spec (specs/STORY-012/spec.bdd.md), regras 23 a 25.
 *
 * A decisão de texto mora aqui, não na tela: é o que permite testá-la sem
 * `@testing-library/react-native`, indisponível no Expo SDK 57.
 */
describe('O avanço do plano como a Dashboard mostra', () => {
  it('mostra a porcentagem e a conta que a produziu', () => {
    expect(
      planProgressView({
        status: 'ok',
        completed: 26,
        total: 144,
        percent: 18,
        enteredAtWeek: null,
      }),
    ).toEqual({
      status: 'ok',
      headline: '18%',
      percent: 18,
      detail: '26 de 144 treinos do plano',
      note: null,
    });
  });

  it('quem entrou no meio do plano vê em que semana entrou (regra 23)', () => {
    expect(
      planProgressView({
        status: 'ok',
        completed: 61,
        total: 144,
        percent: 42,
        enteredAtWeek: 15,
      }),
    ).toMatchObject({
      headline: '42%',
      note: 'Você entrou na semana 15 — o plano completo tem 24',
    });
  });

  it('um treino só não vira plural', () => {
    expect(
      planProgressView({ status: 'ok', completed: 1, total: 144, percent: 1, enteredAtWeek: null }),
    ).toMatchObject({ detail: '1 de 144 treinos do plano' });
  });

  it('histórico ilegível não vira 0% (regra 25)', () => {
    expect(planProgressView({ status: 'unavailable' })).toEqual({
      status: 'unavailable',
      headline: null,
      detail: 'Não foi possível ler seus registros agora.',
      note: null,
    });
  });

  it('sem plano, antes do início ou passada a prova, não há o que mostrar (regra 24)', () => {
    expect(planProgressView({ status: 'none' })).toEqual({ status: 'hidden' });
  });
});
