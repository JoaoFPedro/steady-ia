import { muscleRegions, MUSCLE_REGION_LABELS } from '../muscleRegions';

/**
 * Cenários da spec (specs/STORY-025/spec.bdd.md), "Cenários — mapa muscular".
 * A tabela é a do ADR-021: fechada, sem inferência.
 */
describe('Regiões musculares destacadas no detalhe da musculação', () => {
  const avulsa = (muscleGroup: string) => ({ muscleGroup, workoutType: null });
  const ficha = (workoutType: string, skipped: boolean[]) => ({
    muscleGroup: null,
    workoutType,
    exercises: skipped.map((value) => ({ skipped: value })),
  });

  it('destaca o grupo da musculação avulsa', () => {
    expect(muscleRegions(avulsa('PeitoTriceps'))).toEqual(['peitoral', 'triceps', 'ombro']);
    expect(muscleRegions(avulsa('Ombro'))).toEqual(['ombro']);
    expect(muscleRegions(avulsa('BicepsCostas'))).toEqual(['biceps', 'dorsal', 'trapezio']);
    expect(muscleRegions(avulsa('PernaFrontal'))).toEqual(['quadriceps']);
    expect(muscleRegions(avulsa('PernaPosterior'))).toEqual(['posterior', 'gluteo']);
  });

  it('destaca pelo tipo do treino da ficha', () => {
    expect(muscleRegions(ficha('push', [false]))).toEqual(['peitoral', 'triceps', 'ombro']);
    expect(muscleRegions(ficha('pull', [true, false]))).toEqual(['biceps', 'dorsal', 'trapezio']);
    expect(muscleRegions(ficha('lower', [false]))).toEqual([
      'quadriceps', 'posterior', 'gluteo', 'panturrilha',
    ]);
  });

  it('não destaca quando todos os exercícios da ficha foram pulados', () => {
    expect(muscleRegions(ficha('pull', [true, true]))).toEqual([]);
  });

  it('não presume execução quando a ficha chega sem exercícios', () => {
    expect(muscleRegions({ muscleGroup: null, workoutType: 'push' })).toEqual([]);
    expect(muscleRegions(ficha('push', []))).toEqual([]);
  });

  it('não inventa destaque para valor fora da tabela', () => {
    expect(muscleRegions(avulsa('Abdomen'))).toEqual([]);
    expect(muscleRegions(ficha('core', [false]))).toEqual([]);
    expect(muscleRegions({ muscleGroup: null, workoutType: null })).toEqual([]);
  });

  it('toda região tem nome em texto para o leitor de tela', () => {
    const todas = [
      ...muscleRegions(avulsa('PeitoTriceps')),
      ...muscleRegions(avulsa('BicepsCostas')),
      ...muscleRegions(ficha('lower', [false])),
    ];
    for (const regiao of todas) expect(MUSCLE_REGION_LABELS[regiao]).toMatch(/\S/);
  });
});
