import { bodyParts } from '../bodyParts';
import { MUSCLE_REGION_LABELS, type MuscleRegion } from '../muscleRegions';

/**
 * Ponte entre as regiões do Steady e os slugs da biblioteca de mapa corporal
 * (ADR-021). Intensidade fixa em 1: o mapa só diz "trabalhado", sem níveis.
 */
describe('regiões do Steady → partes do corpo', () => {
  it('traduz cada região para o slug da biblioteca', () => {
    const regions: MuscleRegion[] = [
      'peitoral', 'triceps', 'ombro', 'biceps', 'dorsal', 'trapezio',
      'quadriceps', 'posterior', 'gluteo', 'panturrilha',
    ];

    expect(bodyParts(regions).map((part) => part.slug)).toEqual([
      'chest', 'triceps', 'deltoids', 'biceps', 'upper-back', 'trapezius',
      'quadriceps', 'hamstring', 'gluteal', 'calves',
    ]);
  });

  it('não dá nível de intensidade: todas as partes valem 1', () => {
    expect(bodyParts(['peitoral', 'triceps']).every((part) => part.intensity === 1)).toBe(true);
  });

  it('sem regiões, sem partes', () => {
    expect(bodyParts([])).toEqual([]);
  });

  it('toda região com nome em texto tem slug', () => {
    for (const region of Object.keys(MUSCLE_REGION_LABELS) as MuscleRegion[]) {
      expect(bodyParts([region])).toHaveLength(1);
    }
  });
});
