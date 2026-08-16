import { RecordQueue } from '../recordQueue';
import { SyncEngine } from '../syncEngine';
import { InMemoryQueueStorage } from './support/inMemoryQueueStorage';
import { FakeRecordApi } from './support/fakeApi';

/**
 * Cenário da spec: "Reenvio do mesmo registro não cria duplicata".
 *
 * O risco que justifica tudo isto (ADR-003): treino duplicado infla a carga de
 * corrida e faz o ADR-001 disparar um alerta de sobrecarga falso.
 */
describe('Idempotência no reenvio', () => {
  it('reenvia com a MESMA chave gerada quando o registro entrou na fila', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-do-item');
    const api = new FakeRecordApi().willRespond(
      { status: 'transportFailure' }, // primeira tentativa: resposta se perde
      { status: 'ok' },               // reenvio
    );

    await queue.enqueue('running', { distanceKm: 8 });

    await new SyncEngine(queue, api).sync();
    await new SyncEngine(queue, api).sync();

    expect(api.sent).toHaveLength(2);
    expect(api.sent[0].idempotencyKey).toBe('chave-do-item');
    expect(api.sent[1].idempotencyKey).toBe('chave-do-item');
  });

  it('não gera chave nova a cada tentativa de envio', async () => {
    const storage = new InMemoryQueueStorage();
    let chamadasAoGerador = 0;
    const queue = new RecordQueue(storage, () => `chave-${++chamadasAoGerador}`);
    const api = new FakeRecordApi().willRespond(
      { status: 'transportFailure' },
      { status: 'transportFailure' },
      { status: 'ok' },
    );

    await queue.enqueue('running', { distanceKm: 8 });
    const engine = new SyncEngine(queue, api);

    await engine.sync();
    await engine.sync();
    await engine.sync();

    expect(chamadasAoGerador).toBe(1);
    expect(new Set(api.sent.map((r) => r.idempotencyKey)).size).toBe(1);
  });

  it('tira o item da fila quando o servidor confirma', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-do-item');
    const api = new FakeRecordApi().willRespond({ status: 'ok' });

    await queue.enqueue('running', { distanceKm: 8 });
    await new SyncEngine(queue, api).sync();

    expect(await queue.count()).toBe(0);
  });

  it('cada registro novo recebe a sua própria chave', async () => {
    const storage = new InMemoryQueueStorage();
    let n = 0;
    const queue = new RecordQueue(storage, () => `chave-${++n}`);

    const primeiro = await queue.enqueue('running', { distanceKm: 8 });
    const segundo = await queue.enqueue('running', { distanceKm: 8 });

    expect(primeiro.idempotencyKey).not.toBe(segundo.idempotencyKey);
  });
});
