import { attemptSignOut, discardAndSignOut } from '../signOutAccount';
import { RecordQueue } from '../../sync/recordQueue';
import { SyncEngine } from '../../sync/syncEngine';
import { InMemoryQueueStorage } from '../../sync/__tests__/support/inMemoryQueueStorage';
import { FakeRecordApi } from '../../sync/__tests__/support/fakeApi';
import { FakeSession } from './support/fakeSession';

/**
 * Cenários da spec (specs/STORY-004/spec.bdd.md):
 *  - "Corredor confirma a saída descartando os pendentes"
 *  - "Corredor cancela a saída ao ver os registros pendentes"
 *  - "Nenhum registro pendente atravessa a troca de corredor"
 *
 * O ADR-005 é o motivo de este arquivo existir: o item da fila não carrega dono
 * e o token só é anexado no envio, então um pendente que sobreviva à saída seria
 * gravado na conta do próximo corredor a entrar no aparelho.
 */

function setup(events?: string[]) {
  const storage = new InMemoryQueueStorage();
  let n = 0;
  const queue = new RecordQueue(storage, () => `chave-${++n}`);
  const api = new FakeRecordApi();

  if (events) {
    const clear = queue.clear.bind(queue);
    queue.clear = async () => {
      events.push('clear');
      await clear();
    };
  }

  return { queue, api, syncEngine: new SyncEngine(queue, api) };
}

describe('Descarte da fila ao sair', () => {
  it('conta e descarta a musculação que ainda aguarda a corrida', async () => {
    const { queue, syncEngine } = setup();
    const session = new FakeSession();
    let pendingDraft = true;
    const draft = {
      hasPending: async () => pendingDraft,
      clear: async () => { pendingDraft = false; },
    };

    expect(await attemptSignOut(queue, syncEngine, session, draft)).toEqual({
      status: 'pendingRecords', count: 1,
    });
    expect(session.signedOut).toBe(false);

    expect(await discardAndSignOut(queue, session, draft)).toEqual({ status: 'signedOut' });
    expect(pendingDraft).toBe(false);
  });

  it('descarta os pendentes e encerra a sessão quando o corredor confirma', async () => {
    const { queue } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: 8 });
    await queue.enqueue('pain', { region: 'Canela' });

    const outcome = await discardAndSignOut(queue, session);

    expect(outcome).toEqual({ status: 'signedOut' });
    expect(await queue.count()).toBe(0);
    expect(session.signedOut).toBe(true);
  });

  it('descarta a fila ANTES de encerrar a sessão (ADR-005)', async () => {
    const events: string[] = [];
    const { queue } = setup(events);
    const session = new FakeSession({ events });

    await queue.enqueue('running', { distanceKm: 8 });

    await discardAndSignOut(queue, session);

    // Invertido, uma falha no descarte deixaria fila órfã com a sessão já
    // encerrada — exposta ao próximo corredor.
    expect(events).toEqual(['clear', 'signOut']);
  });

  it('mantém a fila quando o encerramento falha depois do descarte', async () => {
    const { queue } = setup();
    const session = new FakeSession({ signOutSucceeds: false });

    await queue.enqueue('running', { distanceKm: 8 });

    const outcome = await discardAndSignOut(queue, session);

    expect(outcome).toEqual({ status: 'failed' });
    expect(session.signedOut).toBe(false);
  });

  it('cancelar a saída não toca na fila nem na sessão', async () => {
    const { queue, api, syncEngine } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: 8 });
    await queue.enqueue('strength', { durationMinutes: 40 });
    api.willRespond({ status: 'transportFailure' }, { status: 'transportFailure' });

    // Cancelar é simplesmente não seguir para o `discardAndSignOut`.
    const outcome = await attemptSignOut(queue, syncEngine, session);

    expect(outcome).toEqual({ status: 'pendingRecords', count: 2 });
    expect(await queue.count()).toBe(2);
    expect(session.signedOut).toBe(false);
  });

  it('não deixa nenhum registro do corredor anterior para o próximo enviar', async () => {
    const { queue, api, syncEngine } = setup();
    const session = new FakeSession();

    await queue.enqueue('running', { distanceKm: 8 });
    await queue.enqueue('running', { distanceKm: 12 });

    await discardAndSignOut(queue, session);

    // O próximo corredor entra e a conexão volta: o auto-sync roda com o token DELE.
    const enviadosDepois = await syncEngine.sync();

    expect(enviadosDepois.synced).toBe(0);
    expect(api.sent).toHaveLength(0);
  });
});
