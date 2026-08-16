import type { OverloadView, QueryApi, QueryResult, TrainingSessionSummary } from '../../queryApi';

/**
 * Leitura falsa da API para os testes de tela.
 *
 * O padrão é a resposta mais comum do corredor novo — "reunindo dados" e
 * histórico vazio — para cada teste declarar só o que o seu cenário muda.
 */
export class FakeQueryApi implements QueryApi {
  private assessment: QueryResult<OverloadView> = {
    status: 'ok',
    data: { status: 'gatheringData' },
  };
  private history: QueryResult<TrainingSessionSummary[]> = { status: 'ok', data: [] };

  /** Quantas vezes a home consultou a avaliação — prova que ela não foi cacheada. */
  assessmentCalls = 0;

  willAssess(result: QueryResult<OverloadView>): this {
    this.assessment = result;
    return this;
  }

  willListHistory(result: QueryResult<TrainingSessionSummary[]>): this {
    this.history = result;
    return this;
  }

  async overloadAssessment(): Promise<QueryResult<OverloadView>> {
    this.assessmentCalls += 1;
    return this.assessment;
  }

  async trainingHistory(): Promise<QueryResult<TrainingSessionSummary[]>> {
    return this.history;
  }
}
