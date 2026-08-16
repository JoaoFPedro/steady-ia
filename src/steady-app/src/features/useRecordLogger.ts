import { useState } from 'react';
import { useRouter } from 'expo-router';
import { recordQueue, syncEngine } from '../services';
import { logRecord } from './logRecord';
import type { RecordKind } from '../sync/types';

/**
 * Liga as telas de registro ao `logRecord` — a decisão de navegar é a única
 * parte que depende do React e por isso mora aqui.
 */
export function useRecordLogger(kind: RecordKind) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function log(payload: unknown) {
    setSaving(true);
    setProblem(null);

    try {
      const outcome = await logRecord(recordQueue, syncEngine, kind, payload);

      if (outcome.status === 'rejected') {
        setProblem(outcome.message);
        return;
      }

      // A fila continua intacta; ela é retomada assim que o login for refeito.
      if (outcome.status === 'sessionLost') {
        router.replace('/login');
        return;
      }

      // `saved` e `pending` são o mesmo desfecho para o corredor: está guardado.
      // A home mostra quantos ainda faltam sincronizar.
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return { log, saving, problem };
}
