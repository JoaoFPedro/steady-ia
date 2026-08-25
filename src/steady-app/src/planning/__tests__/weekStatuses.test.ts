import { weekStatuses } from '../weekStatuses';
import { weekPlanIndexFor } from '../weekPlanDay';
import { TRAINING_PLAN_DOCUMENT } from '../trainingPlanDocument';
import type { LoggedSession } from '../dayCompletion';

/**
 * Cenários da spec (specs/STORY-012/spec.bdd.md): o detalhamento da semana
 * mostrando o estado de cada dia (regras 11 a 15) e só dentro da janela do
 * plano (regra 19).
 *
 * O resultado vem alinhado a `weekPlan` — índice 0 é segunda, 6 é domingo.
 */
describe('Estado dos sete dias que a aba Semana mostra', () => {
  const weekPlan = TRAINING_PLAN_DOCUMENT.weekPlan;
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const mais = (base: Date, dias: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias);

  /** Quinta, 20/08/2026. A semana vai de segunda 17 a domingo 23. */
  const QUINTA = new Date(2026, 7, 20);
  const SEGUNDA = new Date(2026, 7, 17);

  /** Prova bem no meio do plano, para a semana toda cair dentro da janela. */
  const plano = { raceDate: iso(mais(QUINTA, 70)), createdAt: iso(mais(QUINTA, -30)) };

  const corrida = (d: Date): LoggedSession => ({ date: iso(d), kind: 'running' });
  const musculacao = (d: Date): LoggedSession => ({ date: iso(d), kind: 'strength' });

  it('o índice do dia de hoje aponta para a linha certa da grade', () => {
    expect(weekPlanIndexFor(new Date(2026, 7, 17).getDay())).toBe(0); // segunda
    expect(weekPlanIndexFor(QUINTA.getDay())).toBe(3); // quinta
    expect(weekPlanIndexFor(new Date(2026, 7, 23).getDay())).toBe(6); // domingo
  });

  it('dias passados sem registro aparecem como não feitos; hoje e o futuro, sem marca', () => {
    expect(weekStatuses(QUINTA, plano, [], weekPlan)).toEqual([
      'naoFeito', // segunda 17 — previa musculação
      'naoFeito', // terça 18
      'naoFeito', // quarta 19
      'semMarca', // quinta 20 — hoje, ainda dá tempo
      'semMarca', // sexta 21 — futuro
      'semMarca', // sábado 22 — futuro
      'semMarca', // domingo 23 — descanso
    ]);
  });

  it('cumprido, parcial e não feito convivem na mesma semana', () => {
    const sessoes = [
      musculacao(SEGUNDA), // segunda: só musculação prevista → cumprido
      musculacao(mais(SEGUNDA, 1)), // terça: previa as duas → parcial
      // quarta sem nada → não feito
      musculacao(QUINTA),
      corrida(QUINTA), // quinta: as duas → cumprido
    ];

    expect(weekStatuses(QUINTA, plano, sessoes, weekPlan)).toEqual([
      'cumprido',
      'parcial',
      'naoFeito',
      'cumprido',
      'semMarca',
      'semMarca',
      'semMarca',
    ]);
  });

  it('domingo nunca recebe marca, nem com treino registrado nele', () => {
    const domingo = mais(SEGUNDA, 6);
    const naSemanaSeguinte = mais(domingo, 1);

    const estados = weekStatuses(naSemanaSeguinte, plano, [corrida(domingo)], weekPlan);

    expect(estados[6]).toBe('semMarca');
  });

  it('semana fora da janela do plano não recebe marca nenhuma (regra 19)', () => {
    const provaAntiga = { raceDate: iso(mais(QUINTA, -30)), createdAt: iso(mais(QUINTA, -200)) };

    expect(weekStatuses(QUINTA, provaAntiga, [], weekPlan)).toEqual(Array(7).fill('semMarca'));
  });

  it('sem planejamento, nada é marcado', () => {
    expect(weekStatuses(QUINTA, null, [], weekPlan)).toEqual(Array(7).fill('semMarca'));
  });

  it('histórico ilegível não inventa falha: nada é marcado', () => {
    expect(weekStatuses(QUINTA, plano, null, weekPlan)).toEqual(Array(7).fill('semMarca'));
  });

  it('só os dias já dentro da janela são marcados quando o plano acabou de começar', () => {
    // Prova daqui a 24 semanas: a janela começa nesta semana, na quarta.
    const inicioNaQuarta = {
      raceDate: iso(mais(new Date(2026, 7, 19), 167)),
      createdAt: iso(new Date(2026, 7, 19)),
    };

    const estados = weekStatuses(QUINTA, inicioNaQuarta, [], weekPlan);

    expect(estados[0]).toBe('semMarca'); // segunda 17 — antes da janela
    expect(estados[1]).toBe('semMarca'); // terça 18 — antes da janela
    expect(estados[2]).toBe('naoFeito'); // quarta 19 — primeiro dia da janela
  });
});
