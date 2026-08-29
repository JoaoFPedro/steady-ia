import { SteadyTrainingPlanCache, type SteadyTrainingPlanStorage } from '../steadyTrainingPlanCache';
import type { TrainingPlanDocument } from '../trainingPlanDocument';
import type { SteadyTrainingPlanReader } from '../steadyTrainingPlanReader';

const plan = (title: string): TrainingPlanDocument => ({
  title,
  subtitle: 's',
  principle: { intro: 'i', points: [] },
  phases: [],
  phaseCycleNote: 'n',
  weekOverview: [],
  weekOverviewNote: 'n',
  weekPlan: [],
  taperAdjustment: { title: 't', intro: 'i', items: [] },
  longRunProgression: [],
  mobility: [],
  goldenRules: [],
  paceNote: 'n',
});

function storage(
  initial: TrainingPlanDocument | null,
): SteadyTrainingPlanStorage & { value: TrainingPlanDocument | null } {
  return {
    value: initial,
    async read() { return this.value; },
    async write(value) { this.value = value; },
    async clear() { this.value = null; },
  };
}

describe('cache do plano do Steady', () => {
  it('usa o plano em cache quando está offline', async () => {
    const local = storage(plan('cache'));
    const api = {
      steadyTrainingPlan: jest.fn(async () => ({ status: 'failure' as const })),
    } as unknown as SteadyTrainingPlanReader;

    const result = await new SteadyTrainingPlanCache(local, api).load();

    expect(result).toEqual({ status: 'ok', data: plan('cache'), stale: true });
  });

  it('substitui o cache quando o plano vem do servidor', async () => {
    const local = storage(plan('velho'));
    const api = {
      steadyTrainingPlan: jest.fn(async () => ({ status: 'ok' as const, data: plan('novo') })),
    } as unknown as SteadyTrainingPlanReader;

    const result = await new SteadyTrainingPlanCache(local, api).load();

    expect(result).toEqual({ status: 'ok', data: plan('novo'), stale: false });
    expect(local.value?.title).toBe('novo');
  });

  it('não inventa plano quando não há servidor nem cache', async () => {
    const local = storage(null);
    const api = {
      steadyTrainingPlan: jest.fn(async () => ({ status: 'failure' as const })),
    } as unknown as SteadyTrainingPlanReader;

    await expect(new SteadyTrainingPlanCache(local, api).load()).resolves.toEqual({ status: 'failure' });
  });

  it('não exibe o cache quando a sessão foi perdida', async () => {
    const local = storage(plan('cache'));
    const api = {
      steadyTrainingPlan: jest.fn(async () => ({ status: 'unauthenticated' as const })),
    } as unknown as SteadyTrainingPlanReader;

    await expect(new SteadyTrainingPlanCache(local, api).load())
      .resolves.toEqual({ status: 'unauthenticated' });
  });
});
