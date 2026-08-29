import { loadTrainingHistory } from '../trainingHistory';
import { FakeQueryApi } from '../../api/__tests__/support/fakeQueryApi';
import type { TrainingSessionSummary } from '../../api/queryApi';

/**
 * Cenários da spec: "Corredor consulta seu histórico de treinos" e
 * "Corredor sem nenhum treino registrado".
 *
 * O histórico é o que dá lastro à avaliação de sobrecarga — é onde o corredor
 * confere se o registro que ele fez na rua realmente chegou.
 */

const corrida: TrainingSessionSummary = {
  id: 'a1',
  kind: 'running',
  date: '2026-08-15',
  durationMinutes: 45,
  distanceKm: 8.2,
  perceivedEffort: 7,
  muscleGroup: null,
  intensity: null,
  workoutType: null,
};

const musculacao: TrainingSessionSummary = {
  id: 'b2',
  kind: 'strength',
  date: '2026-08-14',
  durationMinutes: 50,
  distanceKm: null,
  perceivedEffort: null,
  muscleGroup: 'PernaPosterior',
  intensity: 'Pesado',
  workoutType: null,
};

describe('histórico de treinos', () => {
  it('descreve a sessão de corrida por distância e duração', async () => {
    const api = new FakeQueryApi().willListHistory({ status: 'ok', data: [corrida] });

    const view = await loadTrainingHistory(api);

    expect(view).toEqual({
      status: 'loaded',
      items: [{ id: 'a1', kicker: 'Corrida', title: '8,2 km · 45 min', date: '15 de agosto' }],
    });
  });

  it('descreve a sessão de musculação por grupo muscular e intensidade', async () => {
    const api = new FakeQueryApi().willListHistory({ status: 'ok', data: [musculacao] });

    const view = await loadTrainingHistory(api);

    expect(view).toEqual({
      status: 'loaded',
      items: [
        { id: 'b2', kicker: 'Musculação', title: 'Perna posterior · Pesado · 50 min', date: '14 de agosto' },
      ],
    });
  });

  it('preserva a ordem que a API devolve — mais recente primeiro', async () => {
    const api = new FakeQueryApi().willListHistory({ status: 'ok', data: [corrida, musculacao] });

    const view = await loadTrainingHistory(api);

    expect(view.status).toBe('loaded');
    expect(view.status === 'loaded' && view.items.map((i) => i.id)).toEqual(['a1', 'b2']);
  });

  it('descreve corrida sem distância registrada apenas pela duração', async () => {
    const api = new FakeQueryApi().willListHistory({
      status: 'ok',
      data: [{ ...corrida, distanceKm: null }],
    });

    const view = await loadTrainingHistory(api);

    expect(view.status === 'loaded' && view.items[0].title).toBe('45 min');
  });

  it('reporta estado inicial quando o corredor nunca registrou um treino', async () => {
    const api = new FakeQueryApi().willListHistory({ status: 'ok', data: [] });

    expect(await loadTrainingHistory(api)).toEqual({ status: 'empty' });
  });

  it('reporta indisponibilidade em vez de fingir histórico vazio', async () => {
    const api = new FakeQueryApi().willListHistory({ status: 'failure' });

    expect(await loadTrainingHistory(api)).toEqual({ status: 'unavailable' });
  });

  it('reporta sessão perdida para o app levar o corredor ao login', async () => {
    const api = new FakeQueryApi().willListHistory({ status: 'unauthenticated' });

    expect(await loadTrainingHistory(api)).toEqual({ status: 'sessionLost' });
  });

  // Correção da STORY-018: a execução da ficha não tem duração nem grupo
  // muscular — o rótulo vem do treino da ficha, e "0 min" seria mentira.

  it('execução da ficha aparece pelo nome do treino, sem duração inventada', async () => {
    const api = new FakeQueryApi().willListHistory({ status: 'ok', data: [{
      id: 'c3',
      kind: 'strength',
      date: '2026-08-29',
      durationMinutes: null,
      distanceKm: null,
      perceivedEffort: null,
      muscleGroup: null,
      intensity: null,
      workoutType: 'push',
    }] });

    const view = await loadTrainingHistory(api);

    expect(view).toEqual({
      status: 'loaded',
      items: [{ id: 'c3', kicker: 'Musculação', title: 'Empurrada', date: '29 de agosto' }],
    });
  });
});
