import { workoutDetailView } from '../workoutDetailView';
import type { ExerciseDetail, TrainingSessionDetail } from '../../api/queryApi';

/**
 * Cenários "exercícios e séries" e "cabeçalho" da spec (specs/STORY-025).
 * O modelo de apresentação é puro: a tela só desenha o que ele devolve.
 */

const base: TrainingSessionDetail = {
  id: 's1', kind: 'strength', date: '2026-10-30', registeredAt: null, durationMinutes: null,
  distanceKm: null, perceivedEffort: null, muscleGroup: null, intensity: null, workoutType: null, exercises: null,
};

const exercise = (overrides: Partial<ExerciseDetail> = {}): ExerciseDetail => ({
  name: 'Supino reto', sets: 3, repetitions: 10, loadKg: 20, note: null, skipped: false, durationSeconds: null,
  ...overrides,
});

const ficha = (exercises: ExerciseDetail[]): TrainingSessionDetail => ({ ...base, workoutType: 'push', exercises });

describe('lista de exercícios e séries', () => {
  it('lista uma linha por série com repetições e carga', () => {
    const view = workoutDetailView(ficha([exercise()]));

    expect(view.exercises).toEqual([expect.objectContaining({
      name: 'Supino reto',
      skipped: false,
      sets: ['1 · 10 reps · 20 kg', '2 · 10 reps · 20 kg', '3 · 10 reps · 20 kg'],
    })]);
  });

  it('usa vírgula decimal na carga', () => {
    const view = workoutDetailView(ficha([exercise({ sets: 1, loadKg: 60.5 })]));

    expect(view.exercises![0].sets).toEqual(['1 · 10 reps · 60,5 kg']);
  });

  it('marca o exercício pulado e não lista séries nem carga', () => {
    const view = workoutDetailView(ficha([exercise({ skipped: true, loadKg: null })]));

    expect(view.exercises![0]).toEqual(expect.objectContaining({ skipped: true, sets: [] }));
  });

  it('mostra a duração em vez de repetições no exercício por tempo', () => {
    const view = workoutDetailView(ficha([exercise({ name: 'Prancha', sets: 2, repetitions: 1, durationSeconds: 45, loadKg: 5 })]));

    expect(view.exercises![0].sets).toEqual(['1 · 45 s · 5 kg', '2 · 45 s · 5 kg']);
  });

  it('omite a carga quando ela não existe', () => {
    const view = workoutDetailView(ficha([exercise({ sets: 1, loadKg: null })]));

    expect(view.exercises![0].sets).toEqual(['1 · 10 reps']);
  });

  it('mostra a nota do exercício', () => {
    const view = workoutDetailView(ficha([exercise({ note: 'Banco inclinado' })]));

    expect(view.exercises![0].note).toBe('Banco inclinado');
  });

  it('avulsa não inventa séries: sem lista e com aviso', () => {
    const view = workoutDetailView({ ...base, muscleGroup: 'Ombro', durationMinutes: 20 });

    expect(view.exercises).toBeNull();
    expect(view.exercisesNotice).toBe('Este registro não detalha exercícios.');
  });
});

describe('cabeçalho', () => {
  it('ficha sem duração mostra exercícios e séries, e nunca duração', () => {
    const view = workoutDetailView(ficha([exercise(), exercise({ name: 'Crucifixo', sets: 4 })]));

    expect(view.metrics).toEqual([
      { label: 'Exercícios', value: '2' },
      { label: 'Séries', value: '7' },
    ]);
    expect(view.metrics.map((metric) => metric.label)).not.toContain('Duração');
  });

  it('exercício pulado não conta nas séries e aparece como "x de y"', () => {
    const view = workoutDetailView(ficha([exercise(), exercise({ skipped: true, loadKg: null })]));

    expect(view.metrics).toEqual([
      { label: 'Exercícios', value: '1 de 2' },
      { label: 'Séries', value: '3' },
    ]);
  });

  it('avulsa mostra grupo, intensidade e duração', () => {
    const view = workoutDetailView({ ...base, muscleGroup: 'PeitoTriceps', intensity: 'Moderado', durationMinutes: 50 });

    expect(view.metrics).toEqual([
      { label: 'Grupo muscular', value: 'Peito e tríceps' },
      { label: 'Intensidade', value: 'Moderado' },
      { label: 'Duração', value: '50 min' },
    ]);
  });

  it('título e data', () => {
    expect(workoutDetailView(ficha([exercise()]))).toEqual(expect.objectContaining({
      title: 'Musculação', subtitle: 'Empurrada', date: '30/10/2026', pending: false,
    }));
    expect(workoutDetailView({ ...base, muscleGroup: 'Ombro' }).subtitle).toBe('Ombro');
    expect(workoutDetailView({ ...base, pending: true }).pending).toBe(true);
  });
});

describe('mapa muscular na apresentação', () => {
  it('traz as regiões e seus nomes em texto', () => {
    const view = workoutDetailView({ ...base, muscleGroup: 'BicepsCostas' });

    expect(view.regions).toEqual(['biceps', 'dorsal', 'trapezio']);
    expect(view.regionLabels).toEqual(['Bíceps', 'Dorsal', 'Trapézio']);
    expect(view.mapNotice).toBeNull();
  });

  it('avisa quando não há músculo trabalhado', () => {
    const todosPulados = workoutDetailView(ficha([exercise({ skipped: true, loadKg: null })]));

    expect(todosPulados.regions).toEqual([]);
    expect(todosPulados.mapNotice).toBe('Nenhum músculo trabalhado neste registro.');
    expect(workoutDetailView({ ...base, muscleGroup: 'Abdomen' }).mapNotice)
      .toBe('Nenhum músculo trabalhado neste registro.');
  });
});
