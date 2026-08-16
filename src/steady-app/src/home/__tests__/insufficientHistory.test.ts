import { loadHomeState } from '../homeState';
import { RecordQueue } from '../../sync/recordQueue';
import { FakeQueryApi } from '../../api/__tests__/support/fakeQueryApi';
import { InMemoryQueueStorage } from '../../sync/__tests__/support/inMemoryQueueStorage';

/**
 * Cenário da spec: "Corredor com menos de 14 dias de histórico".
 *
 * Dizer "sem risco" a quem tem uma semana de registro é dar uma garantia que o
 * ADR-001 nunca deu — a regra sequer foi avaliada. O estado vem do servidor
 * (`hasSufficientHistory`, ADR-004); o app não conhece o limiar de 14 dias.
 */
describe('avaliação com histórico curto', () => {
  const emptyQueue = () => new RecordQueue(new InMemoryQueueStorage(), () => 'chave');

  it('mostra "reunindo dados" em vez de "sem risco"', async () => {
    const api = new FakeQueryApi().willAssess({ status: 'ok', data: { status: 'gatheringData' } });

    const state = await loadHomeState(emptyQueue(), api);

    expect(state.overload).toEqual({ status: 'gatheringData' });
  });

  it('distingue "reunindo dados" de "avaliei e não há risco"', async () => {
    const api = new FakeQueryApi().willAssess({ status: 'ok', data: { status: 'noRisk' } });

    const state = await loadHomeState(emptyQueue(), api);

    expect(state.overload).toEqual({ status: 'noRisk' });
  });

  it('consulta a avaliação a cada carga, sem reaproveitar a anterior', async () => {
    const api = new FakeQueryApi();

    await loadHomeState(emptyQueue(), api);
    await loadHomeState(emptyQueue(), api);

    expect(api.assessmentCalls).toBe(2);
  });
});
