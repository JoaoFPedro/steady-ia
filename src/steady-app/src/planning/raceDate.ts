/**
 * Data da prova: o corredor digita `dd/mm/aaaa`, o banco guarda `AAAA-MM-DD`.
 *
 * A normalização acontece **num ponto só** — aqui, antes de o pedido entrar na
 * fila. É o que mantém a ordenação honesta: em ISO, texto compara como data
 * (ADR-007, "Datas como texto ISO"). Se algum caminho gravasse `17/05/2027`,
 * nada quebraria — a lista só ficaria silenciosamente na ordem errada.
 */

export type RaceDateParse =
  | { status: 'ok'; iso: string }
  /** Não é `dd/mm/aaaa` — ano com 4 dígitos, barras como separador. */
  | { status: 'invalidFormat' }
  /** Tem o formato certo mas não existe no calendário (31/02, mês 13). */
  | { status: 'invalidDate' }
  /** Existe, mas é hoje ou antes: o plano é contado de trás para frente. */
  | { status: 'notInFuture' };

const ENTRADA = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseRaceDate(entrada: string): RaceDateParse {
  const partes = ENTRADA.exec(entrada.trim());
  if (!partes) return { status: 'invalidFormat' };

  const [, dia, mes, ano] = partes.map(Number) as unknown as [never, number, number, number];
  const data = new Date(ano, mes - 1, dia);

  // `new Date(2027, 1, 31)` não falha: vira 03/03. A ida e volta é o que denuncia.
  const existe =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  if (!existe) return { status: 'invalidDate' };

  const hoje = new Date();
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (data <= inicioDeHoje) return { status: 'notInFuture' };

  return { status: 'ok', iso: `${ano}-${pad(mes)}-${pad(dia)}` };
}

/**
 * Formata enquanto o corredor digita: `17052027` vira `17/05/2027`.
 *
 * Existe porque o campo usa teclado numérico — que é o certo para uma data, mas
 * **não tem a tecla `/`** no Android. Sem a máscara, o corredor digitava só
 * dígitos, o parse recusava como formato inválido e o plano nunca era enviado.
 */
export function maskRaceDate(entrada: string): string {
  const digitos = entrada.replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;

  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** ISO de volta para exibição. Devolve a entrada crua se ela não for ISO — dado antigo não quebra a tela. */
export function formatRaceDate(iso: string): string {
  const partes = ISO.exec(iso);
  if (!partes) return iso;

  const [, ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

/** Mensagem para o corredor. Nunca devolve string vazia — cada estado tem o seu motivo. */
export function raceDateMessage(status: Exclude<RaceDateParse['status'], 'ok'>): string {
  switch (status) {
    case 'invalidFormat':
      return 'Use o formato dd/mm/aaaa.';
    case 'invalidDate':
      return 'Essa data não existe no calendário.';
    case 'notInFuture':
      return 'A prova precisa ser numa data futura.';
  }
}

const pad = (valor: number) => String(valor).padStart(2, '0');
