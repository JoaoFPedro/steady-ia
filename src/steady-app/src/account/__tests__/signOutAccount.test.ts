import { attemptSignOut } from '../signOutAccount';
import { RecordQueue } from '../../sync/recordQueue';
import { SyncEngine } from '../../sync/syncEngine';
import { InMemoryQueueStorage } from '../../sync/__tests__/support/inMemoryQueueStorage';
import { FakeRecordApi } from '../../sync/__tests__/support/fakeApi';
import { FakeSession } from './support/fakeSession';

/**
 * Cenários da spec (specs/STORY-004/spec.bdd.md):
 *  - "Corredor sai da conta com tudo sincronizado"
 *  - "Saída sincroniza os pendentes antes de encerrar"
 *  - "Corredor sai sem conexão com registros pendentes"
 *  - "Sessão já caiu quando o corredor decide sair"
 *  - "Registro pendente é rejeitado durante a sincronização de saída"
 *  - "Falha ao encerrar a sessão no Google"
 */

function setup() {
  const storage = new InMemoryQueueStorage();
  let n = 0;
  const queue = new RecordQueue(storage, () => `chave-${++n}`);
  const api = new FakeRecordApi();

  return { queue, api, syncEngine: new SyncEngine(queue, api) };
}

describe('Sair da conta', () => {
  it('encerra a sessão direto quando não há registros pendentes', async () => {
    const { queue, syncEngine } = setup();
    const session = new FakeSession();

    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(outcome).toEqual({ status: 'signedOut' });
    expect(session.signedOut).toBe(true);
  });

  it('sincroniza os pendentes antes de encerrar — e não pede confirmação', async () => {
    const { queue, api, syncEngine } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: 8 });
    await queue.enqueue('strength', { durationMinutes: 40 });
    api.willRespond({ status: 'ok' }, { status: 'ok' });

    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(api.sent).toHaveLength(2);
    expect(outcome).toEqual({ status: 'signedOut' });
    expect(await queue.count()).toBe(0);
  });

  it('avisa quantos registros serão perdidos quando a fila não esvazia', async () => {
    const { queue, api, syncEngine } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: 8 });
    await queue.enqueue('running', { distanceKm: 5 });
    await queue.enqueue('pain', { region: 'Joelho' });
    // Sem conexão: as três tentativas falham no transporte e tudo fica na fila.
    api.willRespond(
      { status: 'transportFailure' },
      { status: 'transportFailure' },
      { status: 'transportFailure' },
    );

    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(outcome).toEqual({ status: 'pendingRecords', count: 3 });
  });

  it('não encerra a sessão enquanto a confirmação não vem', async () => {
    const { queue, api, syncEngine } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: 8 });
    api.willRespond({ status: 'transportFailure' });

    await attemptSignOut(queue, syncEngine, session);

    expect(session.signedOut).toBe(false);
    expect(await queue.count()).toBe(1);
  });

  it('trata a sessão já caída como qualquer outra saída com pendentes', async () => {
    const { queue, api, syncEngine } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: 8 });
    api.willRespond({ status: 'unauthenticated' });

    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(outcome).toEqual({ status: 'pendingRecords', count: 1 });
  });

  it('não pede confirmação por um registro que a API rejeitou na saída', async () => {
    const { queue, api, syncEngine } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: -1 });
    // 400: o SyncEngine já remove da fila (STORY-003, regra 4). Nada a perder.
    api.willRespond({ status: 'rejected', message: 'Distância inválida.' });

    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(outcome).toEqual({ status: 'signedOut' });
    expect(session.signedOut).toBe(true);
  });

  it('sai mesmo se a sincronização de saída estourar erro', async () => {
    const { queue, syncEngine } = setup();
    const session = new FakeSession();
    jest.spyOn(syncEngine, 'sync').mockRejectedValue(new Error('falha inesperada'));

    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(outcome).toEqual({ status: 'signedOut' });
  });

  it('informa a falha e mantém o corredor autenticado quando o Google recusa sair', async () => {
    const { queue, syncEngine } = setup();
    const session = new FakeSession({ signOutSucceeds: false });

    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(outcome).toEqual({ status: 'failed' });
    expect(session.signedOut).toBe(false);
  });
});
