import { loadLoggedSessions } from '../loggedSessions';
import type { TrainingSessionSummary } from '../../api/queryApi';

/**
 * Cenários da spec (specs/STORY-012/spec.bdd.md), regras 16 e 25.
 *
 * Um registro ainda na fila conta como registro: o corredor confirmou o treino
 * e a rede é problema do app, não dele (ADR-003). E histórico ilegível devolve
 * `null` — quem chama precisa poder dizer "não consegui ler" em vez de "0%".
 */
describe('Sessões que contam para o plano', () => {
  const doServidor = (date: string, kind: 'running' | 'strength'): TrainingSessionSummary => ({
    id: `${kind}-${date}`,
    kind,
    date,
    durationMinutes: 45,
    distanceKm: kind === 'running' ? 8 : null,
    perceivedEffort: kind === 'running' ? 5 : null,
    muscleGroup: kind === 'strength' ? 'PernaFrontal' : null,
    intensity: kind === 'strength' ? 'Pesado' : null,
  });

  const naFila = (date: string, kind: string) => ({
    idempotencyKey: `${kind}-${date}`,
    kind,
    payload: { date },
    queuedAt: `${date}T10:00:00.000Z`,
  });

  const fila = (itens: ReturnType<typeof naFila>[]) => ({ pending: async () => itens });
  const historico = (resultado: unknown) => ({ trainingHistory: async () => resultado as never });

  it('junta o que veio do servidor com o que ainda está na fila', async () => {
    const sessoes = await loadLoggedSessions(
      fila([naFila('2026-08-22', 'running')]),
      historico({ status: 'ok', data: [doServidor('2026-08-20', 'strength')] }),
    );

    expect(sessoes).toEqual({
      status: 'ok',
      sessions: [
        { date: '2026-08-20', kind: 'strength' },
        { date: '2026-08-22', kind: 'running' },
      ],
    });
  });

  it('ignora o que na fila não é treino — plano e dor não cumprem dia', async () => {
    const sessoes = await loadLoggedSessions(
      fila([naFila('2026-08-22', 'plan'), naFila('2026-08-22', 'pain')]),
      historico({ status: 'ok', data: [] }),
    );

    expect(sessoes).toEqual({ status: 'ok', sessions: [] });
  });

  it('histórico ilegível é "não consegui ler" — nunca lista vazia (regra 25)', async () => {
    const sessoes = await loadLoggedSessions(
      fila([naFila('2026-08-22', 'running')]),
      historico({ status: 'failure' }),
    );

    expect(sessoes).toEqual({ status: 'unavailable' });
  });

  it('sessão perdida é distinta de falha de rede — só ela leva ao login', async () => {
    expect(await loadLoggedSessions(fila([]), historico({ status: 'unauthenticated' }))).toEqual({
      status: 'sessionLost',
    });
  });

  it('sem nada em lugar nenhum, a lista é vazia — não é falha', async () => {
    expect(await loadLoggedSessions(fila([]), historico({ status: 'ok', data: [] }))).toEqual({
      status: 'ok',
      sessions: [],
    });
  });
});
