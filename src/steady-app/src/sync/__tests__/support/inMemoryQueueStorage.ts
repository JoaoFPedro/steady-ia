import type { PendingRecord, QueueStorage } from '../../types';

/** Storage de fila em memória — substitui o AsyncStorage nos testes. */
export class InMemoryQueueStorage implements QueueStorage {
  private records: PendingRecord[] = [];

  async read(): Promise<PendingRecord[]> {
    return [...this.records];
  }

  async write(records: PendingRecord[]): Promise<void> {
    this.records = [...records];
  }
}
