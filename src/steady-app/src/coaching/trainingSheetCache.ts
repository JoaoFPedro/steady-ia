import type { CoachingApi, TrainingSheet } from './types';

export interface TrainingSheetStorage {
  read(): Promise<TrainingSheet | null>;
  write(sheet: TrainingSheet): Promise<void>;
  clear(): Promise<void>;
}

export type CachedSheetResult =
  | { status: 'ok'; data: TrainingSheet; stale: boolean }
  | { status: 'unauthenticated' }
  | { status: 'failure' };

export class TrainingSheetCache {
  constructor(
    private readonly storage: TrainingSheetStorage,
    private readonly api: CoachingApi,
  ) {}

  async load(): Promise<CachedSheetResult> {
    const cached = await this.storage.read();
    const remote = await this.api.activeTrainingSheet();

    if (remote.status === 'ok') {
      await this.storage.write(remote.data);
      return { status: 'ok', data: remote.data, stale: false };
    }

    if (remote.status === 'unauthenticated') return remote;
    if (cached !== null) return { status: 'ok', data: cached, stale: true };
    return { status: 'failure' };
  }

  clear(): Promise<void> {
    return this.storage.clear();
  }
}
