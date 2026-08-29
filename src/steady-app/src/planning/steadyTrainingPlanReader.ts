import type { QueryResult } from '../api/queryApi';
import type { TrainingPlanDocument } from './trainingPlanDocument';

/**
 * Leitura do plano do Steady persistido no servidor (ADR-013, STORY-016).
 * Implementada por `HttpCoachingApi` junto da leitura da ficha do personal —
 * as duas são fontes de prescrição, lidas pelo mesmo cliente.
 */
export interface SteadyTrainingPlanReader {
  steadyTrainingPlan(): Promise<QueryResult<TrainingPlanDocument>>;
}
