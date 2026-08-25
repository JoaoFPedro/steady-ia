/**
 * Aritmética de calendário local — nunca UTC.
 *
 * `toISOString()` converte para UTC e, à noite, devolveria o dia seguinte: o
 * treino cairia na janela errada da avaliação de sobrecarga (ADR-001) e o dia
 * errado do plano (STORY-012).
 */

/** Data em ISO (`YYYY-MM-DD`) no fuso local. */
export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(): string {
  return isoDate(new Date());
}

/** Soma dias preservando a meia-noite local — imune a horário de verão. */
export function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}
