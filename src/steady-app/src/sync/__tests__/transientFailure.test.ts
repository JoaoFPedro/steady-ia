import { RecordQueue } from '../recordQueue';
import { SyncEngine } from '../syncEngine';
import { InMemoryQueueStorage } from './support/inMemoryQueueStorage';
import { FakeRecordApi } from './support/fakeApi';

/**
 * Cenários da spec:
 *  - "Falha transitória do servidor durante a sincronização"
 *  - "Fila sincroniza sozinha quando a conexão volta"
 *  - "Renovação do token falha" (lado da fila: nada se perde)
 */
describe('Falha transitória na sincronização', () => {
  it('mantém o registro na fila quando o servidor falha temporariamente', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-1');
    const api = new FakeRecordApi().willRespond({ status: 'serverFailure' });

    await queue.enqueue('running', { distanceKm: 10 });
    await new SyncEngine(queue, api).sync();

    expect(await queue.count()).toBe(1);
  });

  it('mantém o registro na fila quando não há conexão', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-1');
    const api = new FakeRecordApi().willRespond({ status: 'transportFailure' });

    await queue.enqueue('running', { distanceKm: 10 });
    await new SyncEngine(queue, api).sync();

    expect(await queue.count()).toBe(1);
  });

  it('envia o pendente na tentativa seguinte, quando a conexão volta', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-1');
    const api = new FakeRecordApi().willRespond(
      { status: 'transportFailure' },
      { status: 'ok' },
    );

    await queue.enqueue('running', { distanceKm: 10 });
    const engine = new SyncEngine(queue, api);

    await engine.sync();
    expect(await queue.count()).toBe(1);

    await engine.sync();
    expect(await queue.count()).toBe(0);
  });

  it('interrompe o ciclo quando a sessão caiu, preservando a fila inteira', async () => {
    const storage = new InMemoryQueueStorage();
    let n = 0;
    const queue = new RecordQueue(storage, () => `chave-${++n}`);
    const api = new FakeRecordApi().willRespond({ status: 'unauthenticated' });

    await queue.enqueue('running', { distanceKm: 10 });
    await queue.enqueue('strength', { durationMinutes: 40 });

    const resumo = await new SyncEngine(queue, api).sync();

    expect(resumo.unauthenticated).toBe(true);
    expect(await queue.count()).toBe(2);
    // Não insiste com o segundo item: sem sessão, toda tentativa falharia igual.
    expect(api.sent).toHaveLength(1);
  });
});
