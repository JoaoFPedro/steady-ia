import { RecordQueue } from '../recordQueue';
import { InMemoryQueueStorage } from './support/inMemoryQueueStorage';

/**
 * Cenários da spec (specs/STORY-003/spec.bdd.md):
 *  - "Corredor registra treino sem conexão"
 *  - "Fila sincroniza sozinha quando a conexão volta" (parte de fila)
 */
describe('Fila de registros', () => {
  it('aceita o registro mesmo sem conexão e o mantém pendente', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new RecordQueue(storage, () => 'chave-fixa');

    await queue.enqueue('running', { distanceKm: 8 });

    const pending = await queue.pending();
    expect(pending).toHaveLength(1);
    expect(pending[0].kind).toBe('running');
    expect(pending[0].payload).toEqual({ distanceKm: 8 });
  });

  it('persiste a fila no storage, para sobreviver ao app ser fechado', async () => {
    const storage = new InMemoryQueueStorage();

    await new RecordQueue(storage, () => 'chave-1').enqueue('pain', { region: 'Canela' });

    // Uma instância nova, como se o app tivesse reaberto.
    const pending = await new RecordQueue(storage, () => 'chave-2').pending();
    expect(pending).toHaveLength(1);
    expect(pending[0].idempotencyKey).toBe('chave-1');
  });

  it('preserva a ordem em que os registros foram criados', async () => {
    const storage = new InMemoryQueueStorage();
    let n = 0;
    const queue = new RecordQueue(storage, () => `chave-${++n}`);

    await queue.enqueue('running', { distanceKm: 5 });
    await queue.enqueue('strength', { durationMinutes: 40 });
    await queue.enqueue('pain', { region: 'Joelho' });

    const pending = await queue.pending();
    expect(pending.map((r) => r.kind)).toEqual(['running', 'strength', 'pain']);
  });

  it('remove da fila apenas o registro indicado', async () => {
    const storage = new InMemoryQueueStorage();
    let n = 0;
    const queue = new RecordQueue(storage, () => `chave-${++n}`);

    const primeiro = await queue.enqueue('running', { distanceKm: 5 });
    await queue.enqueue('strength', { durationMinutes: 40 });

    await queue.remove(primeiro.idempotencyKey);

    const pending = await queue.pending();
    expect(pending).toHaveLength(1);
    expect(pending[0].kind).toBe('strength');
  });

  it('conta os pendentes — é o número que a home mostra ao corredor', async () => {
    const storage = new InMemoryQueueStorage();
    let n = 0;
    const queue = new RecordQueue(storage, () => `chave-${++n}`);

    expect(await queue.count()).toBe(0);

    await queue.enqueue('running', { distanceKm: 5 });
    await queue.enqueue('running', { distanceKm: 7 });

    expect(await queue.count()).toBe(2);
  });
});
