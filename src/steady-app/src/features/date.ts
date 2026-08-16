/**
 * Data de hoje em ISO (`YYYY-MM-DD`) no fuso local.
 *
 * `toISOString()` converte para UTC e, à noite, devolveria o dia seguinte —
 * o treino cairia na janela errada da avaliação de sobrecarga (ADR-001).
 */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}
