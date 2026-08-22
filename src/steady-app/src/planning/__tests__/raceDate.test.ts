import { parseRaceDate, formatRaceDate, maskRaceDate } from '../raceDate';

describe('Data da prova — entrada em dd/mm/aaaa, armazenamento em ISO', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 22, 10, 0, 0));
  });
  afterEach(() => jest.useRealTimers());

  it('converte dd/mm/aaaa para ISO', () => {
    expect(parseRaceDate('17/05/2027')).toEqual({ status: 'ok', iso: '2027-05-17' });
  });

  it('aceita o primeiro dia depois de hoje', () => {
    expect(parseRaceDate('23/08/2026')).toEqual({ status: 'ok', iso: '2026-08-23' });
  });

  it.each(['17/05', '2027-05-17', '17-05-2027', '17/05/27', 'amanhã', ''])(
    'recusa formato inválido: %s',
    (entrada) => {
      expect(parseRaceDate(entrada).status).toBe('invalidFormat');
    },
  );

  it.each(['31/02/2027', '32/01/2027', '01/13/2027', '00/01/2027'])(
    'recusa data que não existe no calendário: %s',
    (entrada) => {
      expect(parseRaceDate(entrada).status).toBe('invalidDate');
    },
  );

  it('recusa data no passado', () => {
    expect(parseRaceDate('21/08/2026').status).toBe('notInFuture');
  });

  it('recusa a data de hoje — um plano contado de trás para frente daria zero semanas', () => {
    expect(parseRaceDate('22/08/2026').status).toBe('notInFuture');
  });

  it('formata ISO de volta para dd/mm/aaaa, para exibição', () => {
    expect(formatRaceDate('2027-05-17')).toBe('17/05/2027');
  });

  it('devolve o ISO cru se ele não for uma data reconhecível', () => {
    // Defensivo: dado antigo ou de outra origem não deve quebrar a tela.
    expect(formatRaceDate('sei lá')).toBe('sei lá');
  });
});

describe('Máscara de digitação — o teclado numérico não tem a tecla "/"', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['17', '17'],
    ['170', '17/0'],
    ['1705', '17/05'],
    ['170520', '17/05/20'],
    ['17052027', '17/05/2027'],
  ])('vai inserindo as barras: %s -> %s', (entrada, esperado) => {
    expect(maskRaceDate(entrada)).toBe(esperado);
  });

  it('é idempotente — reaplicar sobre o texto já formatado não muda nada', () => {
    expect(maskRaceDate('17/05/2027')).toBe('17/05/2027');
  });

  it('ignora o que não for dígito', () => {
    expect(maskRaceDate('1a7/b0c5')).toBe('17/05');
  });

  it('para de aceitar depois de 8 dígitos', () => {
    expect(maskRaceDate('170520279999')).toBe('17/05/2027');
  });

  it('permite apagar através da barra', () => {
    // "17/0" com backspace vira "17/", que precisa colapsar para "17" — senão a
    // barra volta sozinha e o campo trava.
    expect(maskRaceDate('17/')).toBe('17');
  });

  it('o resultado da máscara completa é aceito pelo parse', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 22));
    expect(parseRaceDate(maskRaceDate('17052027'))).toEqual({ status: 'ok', iso: '2027-05-17' });
    jest.useRealTimers();
  });
});

