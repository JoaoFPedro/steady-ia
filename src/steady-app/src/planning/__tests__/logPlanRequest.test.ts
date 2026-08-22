import { logPlanRequest } from '../logPlanRequest';
import type { PlanRequestPayload } from '../planRequest';

const payload = {
  raceDistance: '42.2',
  raceDate: '2027-05-17',
  raceIsFirstTime: true,
  longestRecentRunKm: 21,
  trainingDaysPerWeek: 4,
  currentWeeklyRunningDays: null,
  referenceDistanceKm: null,
  referenceDuration: null,
  strengthSessionMinutes: null,
  equipmentAccess: null,
  recurringPainAreas: [],
  priorInjuries: null,
} as PlanRequestPayload;

const fakeQueue = () => ({
  enqueue: jest.fn(async () => ({ idempotencyKey: 'chave-1', kind: 'plan', payload, queuedAt: 'agora' })),
});

const fakeSync = (summary: unknown) => ({ sync: jest.fn(async () => summary) });

describe('Registrar pedido de plano', () => {
  it('enfileira antes de tentar a rede — o pedido não depende de sinal', async () => {
    const queue = fakeQueue();
    const sync = fakeSync({ rejected: [], unauthenticated: false, deferred: 1 });

    const { outcome, idempotencyKey } = await logPlanRequest(queue as never, sync as never, payload);

    expect(queue.enqueue).toHaveBeenCalledWith('plan', payload);
    expect(outcome.status).toBe('pending');
    expect(idempotencyKey).toBe('chave-1');
  });

  it('devolve saved quando a fila esvaziou na hora', async () => {
    const { outcome } = await logPlanRequest(
      fakeQueue() as never,
      fakeSync({ rejected: [], unauthenticated: false, deferred: 0 }) as never,
      payload,
    );

    expect(outcome.status).toBe('saved');
  });

  it('propaga a recusa da API para o corredor', async () => {
    const { outcome } = await logPlanRequest(
      fakeQueue() as never,
      fakeSync({ rejected: [{ kind: 'plan', message: 'Data inválida.' }], unauthenticated: false, deferred: 0 }) as never,
      payload,
    );

    expect(outcome).toEqual({ status: 'rejected', message: 'Data inválida.' });
  });

  it('avisa quando a sessão caiu — a fila fica intacta', async () => {
    const { outcome } = await logPlanRequest(
      fakeQueue() as never,
      fakeSync({ rejected: [], unauthenticated: true, deferred: 1 }) as never,
      payload,
    );

    expect(outcome.status).toBe('sessionLost');
  });
});
