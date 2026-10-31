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

  /**
   * Só o que está guardado, sem ir à rede. Serve a quem precisa apenas
   * reconhecer uma ficha já usada (treino pendente na fila); falha de leitura
   * do armazenamento é "sem ficha", nunca erro para a tela.
   */
  async cached(): Promise<TrainingSheet | null> {
    try {
      return await this.storage.read();
    } catch {
      return null;
    }
  }

  clear(): Promise<void> {
    return this.storage.clear();
  }
}
