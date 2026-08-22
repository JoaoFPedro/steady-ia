import type { EquipmentAccess, PainArea, RaceDistance } from './trainingPlanRequest';

/**
 * Pedido de plano no formato que a API espera (`Steady.Api/Contracts/PlanRequestContracts`).
 *
 * `raceDate` já vai em ISO: a conversão de `dd/mm/aaaa` acontece uma vez só, em
 * `parseRaceDate`, antes de o pedido entrar na fila.
 */
export type PlanRequestPayload = {
  raceDistance: RaceDistance;
  raceDate: string;
  raceIsFirstTime: boolean;
  longestRecentRunKm: number;
  trainingDaysPerWeek: number;
  currentWeeklyRunningDays: number | null;
  referenceDistanceKm: number | null;
  referenceDuration: string | null;
  strengthSessionMinutes: number | null;
  equipmentAccess: EquipmentAccess | null;
  recurringPainAreas: PainArea[];
  priorInjuries: string | null;
};

/** O mesmo pedido como a API devolve, acrescido do que só o servidor sabe. */
export type PlanRequestSummary = PlanRequestPayload & {
  /**
   * Identidade estável do pedido: existe desde antes de ele chegar ao servidor,
   * e é por ela que a tela navega e que a lista reconcilia pendente com enviado
   * (spec STORY-010, regra 3).
   */
  idempotencyKey: string;
  createdAt: string;
  /** `true` enquanto o pedido ainda está na fila local. */
  pending: boolean;
};
