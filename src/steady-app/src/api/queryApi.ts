/**
 * Leitura da API — o lado oposto da fila.
 *
 * Enquanto o registro é offline-first (fila primeiro, rede depois), a leitura é
 * sempre online: o app nunca guarda uma avaliação de sobrecarga antiga como se
 * fosse a atual. Uma recomendação vencida é pior que nenhuma.
 */

/**
 * Os três estados que a home sabe exibir. Todos vêm do servidor — o app não
 * decide qual deles vale (FF-004, ADR-004).
 */
export type OverloadView =
  /** Histórico ainda não cobre a janela exigida pelo ADR-001. */
  | { status: 'gatheringData' }
  /** A regra foi avaliada e não há risco. */
  | { status: 'noRisk' }
  /** A regra foi avaliada e há risco — a sugestão vem pronta do domínio. */
  | { status: 'risk'; suggestion: string };

export type TrainingSessionSummary = {
  id: string;
  kind: 'running' | 'strength';
  /** ISO `yyyy-mm-dd`, como a API devolve. */
  date: string;
  /** Ausente na execução da ficha, que não registra duração. */
  durationMinutes: number | null;
  distanceKm: number | null;
  perceivedEffort: number | null;
  muscleGroup: string | null;
  intensity: string | null;
  /** Presente só na execução da ficha: `push`, `pull` ou `lower`. */
  workoutType: string | null;
};

export type QueryResult<T> =
  | { status: 'ok'; data: T }
  /** 401 mesmo depois de tentar renovar o token — o login é inevitável. */
  | { status: 'unauthenticated' }
  /** Sem rede, timeout ou erro do servidor: a tela mostra que não conseguiu ler. */
  | { status: 'failure' };

export interface QueryApi {
  overloadAssessment(): Promise<QueryResult<OverloadView>>;
  trainingHistory(): Promise<QueryResult<TrainingSessionSummary[]>>;
}
