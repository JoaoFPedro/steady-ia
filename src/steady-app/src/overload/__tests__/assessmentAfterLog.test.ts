import { logRecord } from '../../features/logRecord';
import { loadHomeState } from '../../home/homeState';
import { RecordQueue } from '../../sync/recordQueue';
import { SyncEngine } from '../../sync/syncEngine';
import { FakeRecordApi } from '../../sync/__tests__/support/fakeApi';
import { FakeQueryApi } from '../../api/__tests__/support/fakeQueryApi';
import { InMemoryQueueStorage } from '../../sync/__tests__/support/inMemoryQueueStorage';

/**
 * Cenário da spec: "Corredor vê alerta de sobrecarga logo após registrar um treino".
 *
 * O valor da STORY-003 está no *momento*: o alerta precisa chegar enquanto a
 * decisão sobre o próximo treino ainda está em aberto. Por isso o registro
 * sincroniza e a home lê a avaliação em seguida — nunca no dia seguinte.
 */
describe('avaliação logo após registrar um treino', () => {
  function ambiente() {
    const queue = new RecordQueue(new InMemoryQueueStorage(), () => 'chave-fixa');
    const recordApi = new FakeRecordApi();
    const syncEngine = new SyncEngine(queue, recordApi);
    const queryApi = new FakeQueryApi();

    return { queue, recordApi, syncEngine, queryApi };
  }

  it('sincroniza o registro e a home já reflete o risco calculado pela API', async () => {
    const { queue, recordApi, syncEngine, queryApi } = ambiente();
    recordApi.willRespond({ status: 'ok' });
    queryApi.willAssess({
      status: 'ok',
      data: { status: 'risk', suggestion: 'Alivie o próximo treino de perna.' },
    });

    const outcome = await logRecord(queue, syncEngine, 'running', { distanceKm: 12 });
    const home = await loadHomeState(queue, queryApi);

    expect(outcome).toEqual({ status: 'saved' });
    expect(home.overload).toEqual({
      status: 'risk',
      suggestion: 'Alivie o próximo treino de perna.',
    });
    expect(home.pendingCount).toBe(0);
  });

  it('confirma o registro e o mantém pendente quando a rede falha', async () => {
    const { queue, recordApi, syncEngine, queryApi } = ambiente();
    recordApi.willRespond({ status: 'transportFailure' });

    const outcome = await logRecord(queue, syncEngine, 'running', { distanceKm: 12 });
    const home = await loadHomeState(queue, queryApi);

    expect(outcome).toEqual({ status: 'pending' });
    expect(home.pendingCount).toBe(1);
  });

  it('informa a rejeição de domínio em vez de deixar o registro em retry infinito', async () => {
    const { queue, recordApi, syncEngine } = ambiente();
    recordApi.willRespond({ status: 'rejected', message: 'Distância deve ser maior que zero.' });

    const outcome = await logRecord(queue, syncEngine, 'running', { distanceKm: 0 });

    expect(outcome).toEqual({
      status: 'rejected',
      message: 'Distância deve ser maior que zero.',
    });
    expect(await queue.count()).toBe(0);
  });

  it('reporta sessão perdida sem descartar o registro do corredor', async () => {
    const { queue, recordApi, syncEngine } = ambiente();
    recordApi.willRespond({ status: 'unauthenticated' });

    const outcome = await logRecord(queue, syncEngine, 'running', { distanceKm: 12 });

    expect(outcome).toEqual({ status: 'sessionLost' });
    expect(await queue.count()).toBe(1);
  });
});
