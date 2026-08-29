import type { TrainingPlanDocument } from './trainingPlanDocument';
import type { SteadyTrainingPlanReader } from './steadyTrainingPlanReader';

export interface SteadyTrainingPlanStorage {
  read(): Promise<TrainingPlanDocument | null>;
  write(plan: TrainingPlanDocument): Promise<void>;
  clear(): Promise<void>;
}

export type CachedPlanResult =
  | { status: 'ok'; data: TrainingPlanDocument; stale: boolean }
  | { status: 'unauthenticated' }
  | { status: 'failure' };

/**
 * Cache do plano do Steady — mesmo papel que `TrainingSheetCache` exerce para
 * a ficha do personal (ADR-013). Falha de leitura sem cache nunca vira plano
 * vazio (ADR-004): o chamador recebe `failure` e decide como avisar.
 */
export class SteadyTrainingPlanCache {
  constructor(
    private readonly storage: SteadyTrainingPlanStorage,
    private readonly api: SteadyTrainingPlanReader,
  ) {}

  async load(): Promise<CachedPlanResult> {
    const cached = await this.storage.read();
    const remote = await this.api.steadyTrainingPlan();

    if (remote.status === 'ok') {
      await this.storage.write(remote.data);
      return { status: 'ok', data: remote.data, stale: false };
    }

    if (remote.status === 'unauthenticated') return remote;
    if (cached !== null) return { status: 'ok', data: cached, stale: true };
    return { status: 'failure' };
  }
}
