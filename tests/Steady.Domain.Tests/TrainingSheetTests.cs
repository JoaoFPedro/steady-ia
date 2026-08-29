using Steady.Domain.Coaching;

namespace Steady.Domain.Tests;

public sealed class TrainingSheetTests
{
    private static ExercisePrescription Exercise(
        string name = "Agachamento livre", int sets = 4, int repetitions = 6) =>
        ExercisePrescription.Create(Guid.NewGuid(), name, sets, repetitions);

    private static TrainingSheet ValidSheet() => TrainingSheet.Create(
        Guid.NewGuid(),
        StrengthWorkout.Create(WorkoutType.Push, [Exercise("Supino reto")]),
        StrengthWorkout.Create(WorkoutType.Pull, [Exercise("Remada curvada")]),
        StrengthWorkout.Create(WorkoutType.Lower, [Exercise()]),
        RunningWorkout.Create(
            RunPrescription.Create("Moderada com fartlek leve"),
            RunPrescription.Create("Intervalado ou tempo run"),
            RunPrescription.Create("Longão em ritmo confortável")));

    [Fact]
    public void Ficha_valida_contem_exatamente_os_quatro_tipos()
    {
        var ficha = ValidSheet();

        Assert.Equal(4, ficha.Workouts.Count);
        Assert.Equal(
            [WorkoutType.Push, WorkoutType.Pull, WorkoutType.Lower, WorkoutType.Run],
            ficha.Workouts.Select(workout => workout.Type));
    }

    [Theory]
    [InlineData("A")]
    [InlineData("")]
    public void Nome_curto_e_recusado(string name)
    {
        Assert.Throws<ArgumentException>(() => Exercise(name));
    }

    [Fact]
    public void Nome_com_101_caracteres_e_recusado()
    {
        Assert.Throws<ArgumentException>(() => Exercise(new string('A', 101)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(21)]
    public void Series_fora_de_1_a_20_sao_recusadas(int sets)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Exercise(sets: sets));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void Repeticoes_fora_de_1_a_100_sao_recusadas(int repetitions)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Exercise(repetitions: repetitions));
    }

    [Fact]
    public void Treino_de_corrida_guarda_as_tres_prescricoes_no_mesmo_tipo()
    {
        var corrida = RunningWorkout.Create(
            RunPrescription.Create("Moderada com fartlek leve"),
            RunPrescription.Create("Intervalado ou tempo run"),
            RunPrescription.Create("Longão em ritmo confortável"));

        Assert.Equal(WorkoutType.Run, corrida.Type);
        Assert.Equal("Moderada com fartlek leve", corrida.Tuesday.Description);
        Assert.Equal("Intervalado ou tempo run", corrida.Thursday.Description);
        Assert.Equal("Longão em ritmo confortável", corrida.Saturday.Description);
    }

    [Fact]
    public void Treino_de_corrida_exige_as_tres_prescricoes()
    {
        Assert.Throws<ArgumentNullException>(() =>
            RunningWorkout.Create(null!, RunPrescription.Create("quinta"), RunPrescription.Create("sábado")));
    }

    [Fact]
    public void Treino_de_forca_exige_ao_menos_um_exercicio()
    {
        Assert.Throws<ArgumentException>(() => StrengthWorkout.Create(WorkoutType.Push, []));
    }

    [Fact]
    public void Tipo_corrida_nao_pode_ser_criado_com_exercicios()
    {
        Assert.Throws<ArgumentException>(() => StrengthWorkout.Create(WorkoutType.Run, [Exercise()]));
    }

    [Fact]
    public void Ficha_localiza_exercicio_por_identificador_estavel()
    {
        var ficha = ValidSheet();
        var agachamento = ((StrengthWorkout)ficha.Workout(WorkoutType.Lower)).Exercises.Single();

        Assert.Same(agachamento, ficha.Exercise(WorkoutType.Lower, agachamento.Id));
    }
}
