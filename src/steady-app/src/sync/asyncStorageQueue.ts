import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PendingRecord, QueueStorage } from './types';

const STORAGE_KEY = '@steady/fila-de-registros';

/**
 * Persistência da fila em AsyncStorage.
 *
 * A fila precisa sobreviver ao app ser fechado — sem isso, um registro feito na
 * rua se perderia ao trocar de aplicativo, que é justamente quando ele acontece.
 */
export class AsyncStorageQueue implements QueueStorage {
  async read(): Promise<PendingRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PendingRecord[]) : [];
    } catch {
      // Conteúdo corrompido: começar vazio é melhor que travar o app num
      // estado do qual o corredor não consegue sair.
      return [];
    }
  }

  async write(records: PendingRecord[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}
