using Steady.Domain.Coaching;

namespace Steady.Domain.Tests;

public sealed class WorkoutExecutionTests
{
    private static readonly Guid SheetId = Guid.NewGuid();
    private static readonly Guid ExerciseId = Guid.NewGuid();
    private static readonly DateOnly Date = new(2026, 8, 24);

    private static ExerciseExecution Executed(decimal load = 60.50m, string? note = null) =>
        ExerciseExecution.Executed(ExerciseId, "Agachamento livre", 4, 6, load, note);

    [Fact]
    public void Execucao_preserva_carga_com_duas_casas_e_nota_normalizada()
    {
        var exercise = Executed(60.50m, "  Ajustar posição dos pés  ");

        Assert.Equal(60.50m, exercise.LoadKg);
        Assert.Equal("Ajustar posição dos pés", exercise.Note);
        Assert.False(exercise.Skipped);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(1000)]
    [InlineData(10.123)]
    public void Carga_invalida_e_recusada(decimal load)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Executed(load));
    }

    [Fact]
    public void Nota_com_201_caracteres_e_recusada()
    {
        Assert.Throws<ArgumentException>(() => Executed(note: new string('A', 201)));
    }

    [Fact]
    public void Exercicio_pulado_nao_tem_carga_mas_preserva_nota()
    {
        var exercise = ExerciseExecution.SkippedExercise(
            ExerciseId, "Agachamento livre", 4, 6, "Equipamento ocupado");

        Assert.True(exercise.Skipped);
        Assert.Null(exercise.LoadKg);
        Assert.Equal("Equipamento ocupado", exercise.Note);
    }

    [Fact]
    public void Execucao_e_um_agregado_atomico_com_todos_os_exercicios()
    {
        var skippedId = Guid.NewGuid();

        var execution = StrengthWorkoutExecution.Create(
            SheetId,
            WorkoutType.Lower,
            Date,
            [
                Executed(),
                ExerciseExecution.SkippedExercise(skippedId, "Leg press", 4, 10, null)
            ]);

        Assert.Equal(SheetId, execution.TrainingSheetId);
        Assert.Equal(2, execution.Exercises.Count);
        Assert.Contains(execution.Exercises, exercise => exercise.ExerciseId == skippedId && exercise.Skipped);
    }

    [Fact]
    public void Execucao_nao_aceita_exercicio_repetido()
    {
        Assert.Throws<ArgumentException>(() => StrengthWorkoutExecution.Create(
            SheetId, WorkoutType.Lower, Date, [Executed(), Executed()]));
    }

    [Fact]
    public void Corrida_nao_e_execucao_de_musculacao()
    {
        Assert.Throws<ArgumentException>(() => StrengthWorkoutExecution.Create(
            SheetId, WorkoutType.Run, Date, [Executed()]));
    }
}

