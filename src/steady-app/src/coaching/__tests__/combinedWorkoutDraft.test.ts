import { CombinedWorkoutDrafts, type CombinedDraftStorage } from '../combinedWorkoutDraft';
import type { StrengthExecutionPayload } from '../workoutExecution';
import { RecordQueue } from '../../sync/recordQueue';
import { InMemoryQueueStorage } from '../../sync/__tests__/support/inMemoryQueueStorage';

class MemoryDraftStorage implements CombinedDraftStorage {
  value: StrengthExecutionPayload | null = null;
  async read() { return this.value; }
  async write(value: StrengthExecutionPayload) { this.value = value; }
  async clear() { this.value = null; }
}

const strength: StrengthExecutionPayload = {
  trainingSheetId: 'sheet-1', workoutType: 'lower', date: '2026-08-25',
  exercises: [{ exerciseId: 'exercise-1', loadKg: 60, note: null, skipped: false }],
};
const running = {
  date: '2026-08-25', distanceKm: 8, durationMinutes: 45,
  averagePaceMinPerKm: 5.6, perceivedEffort: 5,
};

function setup() {
  const storage = new MemoryDraftStorage();
  const queueStorage = new InMemoryQueueStorage();
  const queue = new RecordQueue(queueStorage, () => 'combined-key');
  return { storage, queue, drafts: new CombinedWorkoutDrafts(storage, queue) };
}

describe('rascunho de musculação aguardando corrida', () => {
  it('conclui as duas execuções como um item combinado', async () => {
    const { drafts, queue, storage } = setup();
    await drafts.hold(strength);

    await drafts.completeWithRun(running);

    expect(await queue.pending()).toEqual([expect.objectContaining({
      kind: 'combinedWorkout', payload: { strength, running },
    })]);
    expect(storage.value).toBeNull();
  });

  it('finaliza somente musculação quando a corrida não acontece', async () => {
    const { drafts, queue } = setup();
    await drafts.hold(strength);

    await drafts.finishStrengthOnly();

    expect(await queue.pending()).toEqual([expect.objectContaining({
      kind: 'strengthWorkout', payload: strength,
    })]);
  });

  it('recupera como musculação isolada após reinício', async () => {
    const { drafts, queue } = setup();
    await drafts.hold(strength);

    await drafts.recover();

    expect(await queue.pending()).toHaveLength(1);
    expect((await queue.pending())[0].kind).toBe('strengthWorkout');
  });

  it('informa e limpa o rascunho pendente no encerramento da sessão', async () => {
    const { drafts } = setup();
    expect(await drafts.hasPending()).toBe(false);
    await drafts.hold(strength);
    expect(await drafts.hasPending()).toBe(true);

    await drafts.clear();

    expect(await drafts.hasPending()).toBe(false);
  });
});
