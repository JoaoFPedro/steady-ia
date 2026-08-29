import { canRegisterDay, todayRegistrationStatus } from '../registerAvailability';
import type { WeekPlanDay } from '../trainingPlanDocument';

/**
 * O botão "Registrar Treino" só existe no dia de hoje. Registrado o treino do
 * dia, ele desabilita — mas só naquele dia, e só quando não falta modalidade.
 */
describe('disponibilidade do registro do dia', () => {
  it('dia previsto e ainda sem registro aceita o registro', () => {
    expect(canRegisterDay('semMarca')).toBe(true);
  });

  it('dia já cumprido não aceita novo registro', () => {
    expect(canRegisterDay('cumprido')).toBe(false);
  });

  it('dia parcial ainda aceita: falta a outra modalidade', () => {
    expect(canRegisterDay('parcial')).toBe(true);
  });

  it('dia não feito continua aceitando o registro', () => {
    expect(canRegisterDay('naoFeito')).toBe(true);
  });

  // A janela do plano (168 dias terminando na prova) governa o progresso, não
  // o botão: "já registrei hoje?" vale mesmo com a prova a 11 meses.
  describe('status de hoje, sem a janela do plano', () => {
    const sabado = { day: 'Sábado — longão', hasRun: true, exercises: [] } as unknown as WeekPlanDay;
    const segunda = {
      day: 'Segunda — inferiores', hasRun: false, exercises: [{ name: 'Agachamento' }],
    } as unknown as WeekPlanDay;
    const semana = [segunda, segunda, segunda, segunda, segunda, sabado, segunda];
    const hoje = new Date(2026, 7, 29); // sábado, muito antes da janela do plano

    it('dia cumprido fecha o botão mesmo fora da janela do plano', () => {
      const status = todayRegistrationStatus(
        hoje, [{ date: '2026-08-29', kind: 'running' }], semana, 5);

      expect(status).toBe('cumprido');
      expect(canRegisterDay(status)).toBe(false);
    });

    it('sem registro do dia o botão continua aberto', () => {
      const status = todayRegistrationStatus(hoje, [], semana, 5);

      expect(canRegisterDay(status)).toBe(true);
    });

    it('registro de outra data não fecha hoje', () => {
      const status = todayRegistrationStatus(
        hoje, [{ date: '2026-08-28', kind: 'running' }], semana, 5);

      expect(canRegisterDay(status)).toBe(true);
    });

    it('histórico ilegível nunca bloqueia o registro', () => {
      const status = todayRegistrationStatus(hoje, null, semana, 5);

      expect(canRegisterDay(status)).toBe(true);
    });

    it('fora da semana do plano não há botão a fechar', () => {
      const status = todayRegistrationStatus(hoje, [], semana, -1);

      expect(canRegisterDay(status)).toBe(true);
    });
  });
});
