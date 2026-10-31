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
  /** Ritmo médio da corrida em minutos por quilômetro, quando disponível. */
  averagePaceMinPerKm?: number | null;
  perceivedEffort: number | null;
  muscleGroup: string | null;
  intensity: string | null;
  /** Presente só na execução da ficha: `push`, `pull` ou `lower`. */
  workoutType: string | null;
  /**
   * Momento original do registro, em UTC. `null` nos registros anteriores à
   * STORY-024 e na execução da ficha: não se inventa horário (spec.bdd.md).
   */
  registeredAt: string | null;
  /** Verdadeiro apenas enquanto o registro ainda está na fila local. */
  pending?: boolean;
};

/** Um exercício da execução da ficha, como o detalhe do treino o mostra (ADR-021). */
export type ExerciseDetail = {
  name: string;
  sets: number;
  repetitions: number;
  loadKg: number | null;
  note: string | null;
  skipped: boolean;
  /** Exercício por tempo: a série mostra a duração em vez de repetições. */
  durationSeconds: number | null;
};

/**
 * O treino aberto na tela de detalhes. `exercises` só existe para a execução da
 * ficha; `null` na corrida e na musculação avulsa — o dado não existe, e a tela
 * não o inventa.
 */
export type TrainingSessionDetail = TrainingSessionSummary & {
  exercises: ExerciseDetail[] | null;
};

export type QueryResult<T> =
  | { status: 'ok'; data: T }
  /** 401 mesmo depois de tentar renovar o token — o login é inevitável. */
  | { status: 'unauthenticated' }
  /** Sem rede, timeout ou erro do servidor: a tela mostra que não conseguiu ler. */
  | { status: 'failure' };

/**
 * O detalhe por id distingue "não existe" de "não consegui ler": a primeira
 * resposta é definitiva, a segunda é só uma falha de rede ou de servidor.
 */
export type DetailResult<T> = QueryResult<T> | { status: 'notFound' };

export interface QueryApi {
  overloadAssessment(): Promise<QueryResult<OverloadView>>;
  trainingHistory(): Promise<QueryResult<TrainingSessionSummary[]>>;
  trainingSession(id: string): Promise<DetailResult<TrainingSessionDetail>>;
}
