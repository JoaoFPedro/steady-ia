import type { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import type { MuscleRegion } from './muscleRegions';

/** Região do Steady → parte do corpo da biblioteca de mapa corporal (ADR-021). */
const SLUG_BY_REGION: Record<MuscleRegion, Slug> = {
  peitoral: 'chest',
  triceps: 'triceps',
  ombro: 'deltoids',
  biceps: 'biceps',
  dorsal: 'upper-back',
  trapezio: 'trapezius',
  quadriceps: 'quadriceps',
  posterior: 'hamstring',
  gluteo: 'gluteal',
  panturrilha: 'calves',
};

/**
 * Intensidade fixa em 1: o mapa só diz "trabalhado", sem tons relativos
 * (decisão de produto da STORY-024).
 */
export function bodyParts(regions: readonly MuscleRegion[]): ExtendedBodyPart[] {
  return regions.map((region) => ({ slug: SLUG_BY_REGION[region], intensity: 1 }));
}
