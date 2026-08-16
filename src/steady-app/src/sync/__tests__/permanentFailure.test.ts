import { RecordQueue } from '../recordQueue';
import { SyncEngine } from '../syncEngine';
import { InMemoryQueueStorage } from './support/inMemoryQueueStorage';
import { FakeRecordApi } from './support/fakeApi';

/**
 * Cenário da spec: "Registro rejeitado pela validação de domínio".
 *
 * 400 é falha permanente — o servidor nunca vai aceitar aquele corpo. Manter o
 * item na fila o faria reenviar para sempre.
 */
describe('Falha permanente na sincronização', () => {
  it('remove o registro rejeitado da fila', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-1');
    const api = new FakeRecordApi().willRespond({
      status: 'rejected',
      message: 'A distância deve ser maior que zero.',
    });

    await queue.enqueue('running', { distanceKm: 0 });
    await new SyncEngine(queue, api).sync();

    expect(await queue.count()).toBe(0);
  });

  it('relata a mensagem do domínio, para o corredor saber o que não foi salvo', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-1');
    const api = new FakeRecordApi().willRespond({
      status: 'rejected',
      message: 'A distância deve ser maior que zero.',
    });

    await queue.enqueue('running', { distanceKm: 0 });
    const resumo = await new SyncEngine(queue, api).sync();

    expect(resumo.rejected).toEqual([
      { kind: 'running', message: 'A distância deve ser maior que zero.' },
    ]);
  });

  it('não trava a fila: os registros seguintes continuam sendo enviados', async () => {
    const storage = new InMemoryQueueStorage();
    let n = 0;
    const queue = new RecordQueue(storage, () => `chave-${++n}`);
    const api = new FakeRecordApi().willRespond(
      { status: 'rejected', message: 'A distância deve ser maior que zero.' },
      { status: 'ok' },
    );

    await queue.enqueue('running', { distanceKm: 0 });
    await queue.enqueue('running', { distanceKm: 10 });

    const resumo = await new SyncEngine(queue, api).sync();

    expect(resumo.synced).toBe(1);
    expect(resumo.rejected).toHaveLength(1);
    expect(await queue.count()).toBe(0);
  });
});
