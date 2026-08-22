import { loadPlanList } from '../planListState';
import type { PlanRequestSummary } from '../planRequest';
import type { QueryResult } from '../../api/queryApi';

const base = {
  raceDistance: '42.2' as const,
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
};

const doServidor = (idempotencyKey: string, createdAt: string): PlanRequestSummary => ({
  ...base,
  idempotencyKey,
  createdAt,
  pending: false,
});

const fakeQueue = (itens: { idempotencyKey: string; queuedAt: string }[]) => ({
  pending: async () =>
    itens.map((item) => ({ ...item, kind: 'plan' as const, payload: base })),
});

const fakeApi = (resultado: QueryResult<PlanRequestSummary[]>) => ({
  planRequests: async () => resultado,
});

describe('Lista de planejamentos', () => {
  it('mostra os do servidor, mais recente primeiro', async () => {
    const state = await loadPlanList(
      fakeQueue([]),
      fakeApi({
        status: 'ok',
        data: [doServidor('antigo', '2026-08-01T10:00:00Z'), doServidor('novo', '2026-08-20T10:00:00Z')],
      }),
    );

    expect(state.status).toBe('ok');
    expect(state.plans.map((p) => p.idempotencyKey)).toEqual(['novo', 'antigo']);
  });

  it('mostra o pendente da fila, marcado como pendente', async () => {
    const state = await loadPlanList(
      fakeQueue([{ idempotencyKey: 'na-fila', queuedAt: '2026-08-21T10:00:00Z' }]),
      fakeApi({ status: 'ok', data: [] }),
    );

    expect(state.plans).toHaveLength(1);
    expect(state.plans[0].idempotencyKey).toBe('na-fila');
    expect(state.plans[0].pending).toBe(true);
  });

  it('não duplica quando o pendente já chegou ao servidor', async () => {
    // Janela real: a fila ainda tem o item, o servidor já o registrou.
    const state = await loadPlanList(
      fakeQueue([{ idempotencyKey: 'mesma-chave', queuedAt: '2026-08-21T10:00:00Z' }]),
      fakeApi({ status: 'ok', data: [doServidor('mesma-chave', '2026-08-21T10:00:05Z')] }),
    );

    expect(state.plans).toHaveLength(1);
    expect(state.plans[0].pending).toBe(false);
  });

  it('sem nenhum planejamento, devolve lista vazia com status ok', async () => {
    const state = await loadPlanList(fakeQueue([]), fakeApi({ status: 'ok', data: [] }));

    expect(state.status).toBe('ok');
    expect(state.plans).toEqual([]);
  });

  it('API indisponível mostra os pendentes e avisa — não finge lista vazia', async () => {
    const state = await loadPlanList(
      fakeQueue([{ idempotencyKey: 'na-fila', queuedAt: '2026-08-21T10:00:00Z' }]),
      fakeApi({ status: 'failure' }),
    );

    expect(state.status).toBe('unavailable');
    expect(state.plans.map((p) => p.idempotencyKey)).toEqual(['na-fila']);
  });

  it('API indisponível e fila vazia ainda é "não sei", não "não há"', async () => {
    // A distinção do ADR-004: lista vazia por falha de leitura não pode ser lida
    // como "você ainda não criou nenhum planejamento".
    const state = await loadPlanList(fakeQueue([]), fakeApi({ status: 'failure' }));

    expect(state.status).toBe('unavailable');
    expect(state.plans).toEqual([]);
  });

  it('sessão perdida é um estado próprio', async () => {
    const state = await loadPlanList(fakeQueue([]), fakeApi({ status: 'unauthenticated' }));

    expect(state.status).toBe('sessionLost');
  });

  it('ordena pendente e enviado juntos, pela data de criação', async () => {
    const state = await loadPlanList(
      fakeQueue([{ idempotencyKey: 'pendente', queuedAt: '2026-08-22T10:00:00Z' }]),
      fakeApi({ status: 'ok', data: [doServidor('enviado', '2026-08-10T10:00:00Z')] }),
    );

    expect(state.plans.map((p) => p.idempotencyKey)).toEqual(['pendente', 'enviado']);
  });
});
