import type {
  DetailResult,
  OverloadView,
  QueryApi,
  QueryResult,
  TrainingSessionDetail,
  TrainingSessionSummary,
} from '../../queryApi';

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

  private detail: DetailResult<TrainingSessionDetail> = { status: 'notFound' };

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

  willShowDetail(result: DetailResult<TrainingSessionDetail>): this {
    this.detail = result;
    return this;
  }

  async overloadAssessment(): Promise<QueryResult<OverloadView>> {
    this.assessmentCalls += 1;
    return this.assessment;
  }

  async trainingHistory(): Promise<QueryResult<TrainingSessionSummary[]>> {
    return this.history;
  }

  async trainingSession(): Promise<DetailResult<TrainingSessionDetail>> {
    return this.detail;
  }
}
