import { loadHomeState } from '../homeState';
import { RecordQueue } from '../../sync/recordQueue';
import { FakeQueryApi } from '../../api/__tests__/support/fakeQueryApi';
import { InMemoryQueueStorage } from '../../sync/__tests__/support/inMemoryQueueStorage';

/**
 * Cenário da spec: "Tela inicial sinaliza registros pendentes".
 *
 * O número de pendentes é o que impede o corredor de ler a avaliação como
 * completa: se três treinos ainda não chegaram ao servidor, a avaliação exibida
 * foi calculada sem eles.
 */
describe('tela inicial com registros pendentes', () => {
  function queueWith(): RecordQueue {
    let n = 0;
    return new RecordQueue(new InMemoryQueueStorage(), () => `chave-${(n += 1)}`);
  }

  it('informa quantos registros ainda não foram sincronizados', async () => {
    const queue = queueWith();
    await queue.enqueue('running', { distanceKm: 8 });
    await queue.enqueue('pain', { region: 'Joelho' });

    const state = await loadHomeState(queue, new FakeQueryApi());

    expect(state.pendingCount).toBe(2);
  });

  it('exibe a avaliação da API mesmo havendo pendentes', async () => {
    const queue = queueWith();
    await queue.enqueue('running', { distanceKm: 8 });

    const api = new FakeQueryApi().willAssess({
      status: 'ok',
      data: { status: 'risk', suggestion: 'Reduza a próxima corrida.' },
    });

    const state = await loadHomeState(queue, api);

    expect(state.overload).toEqual({ status: 'risk', suggestion: 'Reduza a próxima corrida.' });
    expect(state.pendingCount).toBe(1);
  });

  it('não sinaliza pendência quando a fila está vazia', async () => {
    const state = await loadHomeState(queueWith(), new FakeQueryApi());

    expect(state.pendingCount).toBe(0);
  });

  it('mostra os pendentes mesmo quando a avaliação não pôde ser lida', async () => {
    const queue = queueWith();
    await queue.enqueue('strength', { muscleGroup: 'PernaFrontal' });

    const api = new FakeQueryApi().willAssess({ status: 'failure' });

    const state = await loadHomeState(queue, api);

    expect(state.overload).toEqual({ status: 'unavailable' });
    expect(state.pendingCount).toBe(1);
  });

  it('reporta sessão perdida para o app levar o corredor ao login', async () => {
    const api = new FakeQueryApi().willAssess({ status: 'unauthenticated' });

    const state = await loadHomeState(queueWith(), api);

    expect(state.sessionLost).toBe(true);
  });
});
