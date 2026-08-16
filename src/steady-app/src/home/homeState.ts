import type { OverloadView, QueryApi } from '../api/queryApi';
import type { RecordQueue } from '../sync/recordQueue';

/**
 * Tudo que a tela inicial precisa saber, numa leitura só.
 *
 * A avaliação e o número de pendentes andam juntos de propósito: sem o segundo,
 * o corredor leria a primeira como completa mesmo quando três treinos ainda não
 * chegaram ao servidor.
 */
export type HomeState = {
  /** `unavailable` quando a leitura falhou — nunca uma avaliação antiga. */
  overload: OverloadView | { status: 'unavailable' };
  pendingCount: number;
  /** A renovação do token falhou: o app precisa levar o corredor ao login. */
  sessionLost: boolean;
};

export async function loadHomeState(queue: RecordQueue, api: QueryApi): Promise<HomeState> {
  const [assessment, pendingCount] = await Promise.all([api.overloadAssessment(), queue.count()]);

  if (assessment.status === 'ok') {
    return { overload: assessment.data, pendingCount, sessionLost: false };
  }

  return {
    overload: { status: 'unavailable' },
    pendingCount,
    sessionLost: assessment.status === 'unauthenticated',
  };
}
