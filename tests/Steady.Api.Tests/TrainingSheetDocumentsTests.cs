using Steady.Domain.Coaching;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Tests;

public sealed class TrainingSheetDocumentsTests
{
    [Fact]
    public void Documento_novo_preserva_as_tres_corridas_no_mesmo_workout()
    {
        var sheet = Sheet();

        var restored = TrainingSheetDocuments.DeserializeSheet(
            sheet.Id, TrainingSheetDocuments.Serialize(sheet));
        var run = Assert.IsType<RunningWorkout>(restored.Workout(WorkoutType.Run));

        Assert.Equal("Corrida de terça", run.Tuesday.Description);
        Assert.Equal("Corrida de quinta", run.Thursday.Description);
        Assert.Equal("Corrida de sábado", run.Saturday.Description);
    }

    [Fact]
    public void Documento_novo_preserva_os_campos_numericos_opcionais()
    {
        var sheet = TrainingSheet.Create(
            Guid.NewGuid(),
            Strength(WorkoutType.Push, "Supino reto"),
            Strength(WorkoutType.Pull, "Remada curvada"),
            Strength(WorkoutType.Lower, "Agachamento livre"),
            RunningWorkout.Create(
                RunPrescription.Create("Moderada", distanceKmMin: 8, distanceKmMax: 10),
                RunPrescription.Create("Qualidade", perceivedEffortMin: 7, perceivedEffortMax: 8),
                RunPrescription.Create("Longão", distanceKmMin: 21)));

        var restored = TrainingSheetDocuments.DeserializeSheet(
            sheet.Id, TrainingSheetDocuments.Serialize(sheet));
        var run = Assert.IsType<RunningWorkout>(restored.Workout(WorkoutType.Run));

        Assert.Equal(8, run.Tuesday.DistanceKm!.Value.Min);
        Assert.Equal(10, run.Tuesday.DistanceKm!.Value.Max);
        Assert.Null(run.Tuesday.DurationMinutes);
        Assert.Equal(7, run.Thursday.PerceivedEffort!.Value.Min);
        Assert.Equal(21, run.Saturday.DistanceKm!.Value.Min);
        Assert.Null(run.Saturday.DistanceKm!.Value.Max);
    }

    [Fact]
    public void Documento_legado_com_tres_descricoes_fica_sem_campos_numericos()
    {
        var exerciseId = Guid.NewGuid();
        var legacy = $$"""
            {
              "push":[{"id":"{{exerciseId}}","name":"Supino reto","sets":3,"repetitions":10}],
              "pull":[{"id":"{{Guid.NewGuid()}}","name":"Remada curvada","sets":3,"repetitions":10}],
              "lower":[{"id":"{{Guid.NewGuid()}}","name":"Agachamento livre","sets":4,"repetitions":6}],
              "tuesdayRunDescription":"Corrida de terça",
              "thursdayRunDescription":"Corrida de quinta",
              "saturdayRunDescription":"Corrida de sábado"
            }
            """;

        var restored = TrainingSheetDocuments.DeserializeSheet(Guid.NewGuid(), legacy);
        var run = Assert.IsType<RunningWorkout>(restored.Workout(WorkoutType.Run));

        Assert.Equal("Corrida de terça", run.Tuesday.Description);
        Assert.Null(run.Tuesday.DistanceKm);
        Assert.Null(run.Tuesday.DurationMinutes);
        Assert.Null(run.Tuesday.PerceivedEffort);
    }

    [Fact]
    public void Documento_legado_com_descricao_unica_aplica_aos_tres_dias()
    {
        var legacy = $$"""
            {
              "push":[{"id":"{{Guid.NewGuid()}}","name":"Supino reto","sets":3,"repetitions":10}],
              "pull":[{"id":"{{Guid.NewGuid()}}","name":"Remada curvada","sets":3,"repetitions":10}],
              "lower":[{"id":"{{Guid.NewGuid()}}","name":"Agachamento livre","sets":4,"repetitions":6}],
              "runDescription":"Descrição legada"
            }
            """;

        var restored = TrainingSheetDocuments.DeserializeSheet(Guid.NewGuid(), legacy);
        var run = Assert.IsType<RunningWorkout>(restored.Workout(WorkoutType.Run));

        Assert.Equal("Descrição legada", run.Tuesday.Description);
        Assert.Equal("Descrição legada", run.Thursday.Description);
        Assert.Equal("Descrição legada", run.Saturday.Description);
        Assert.Null(run.Thursday.DistanceKm);
    }

    // STORY-017 — tempo e observação opcionais no exercício.

    [Fact]
    public void Documento_preserva_tempo_e_observacao_do_exercicio()
    {
        var sheet = TrainingSheet.Create(
            Guid.NewGuid(),
            StrengthWorkout.Create(WorkoutType.Push, [ExercisePrescription.Create(
                Guid.NewGuid(), "Prancha", 3, 1, durationSeconds: 40, observation: "não travar o cotovelo")]),
            Strength(WorkoutType.Pull, "Remada curvada"),
            Strength(WorkoutType.Lower, "Agachamento livre"),
            RunningWorkout.Create(
                RunPrescription.Create("Corrida de terça"),
                RunPrescription.Create("Corrida de quinta"),
                RunPrescription.Create("Corrida de sábado")));

        var restored = TrainingSheetDocuments.DeserializeSheet(
            sheet.Id, TrainingSheetDocuments.Serialize(sheet));
        var exercise = Assert.IsType<StrengthWorkout>(restored.Workout(WorkoutType.Push)).Exercises.Single();

        Assert.Equal(40, exercise.DurationSeconds);
        Assert.Equal("não travar o cotovelo", exercise.Observation);
    }

    [Fact]
    public void Exercicio_sem_tempo_nem_observacao_nao_persiste_zero_nem_vazio()
    {
        var sheet = Sheet();

        var json = TrainingSheetDocuments.Serialize(sheet);
        var restored = TrainingSheetDocuments.DeserializeSheet(sheet.Id, json);
        var exercise = Assert.IsType<StrengthWorkout>(restored.Workout(WorkoutType.Push)).Exercises.Single();

        Assert.Null(exercise.DurationSeconds);
        Assert.Null(exercise.Observation);
        Assert.DoesNotContain("\"durationSeconds\":0", json);
        Assert.DoesNotContain("\"observation\":\"\"", json);
    }

    [Fact]
    public void Ficha_legada_sem_os_campos_novos_continua_legivel()
    {
        var id = Guid.NewGuid();
        var legacy = $$"""
            {"push":[{"id":"{{Guid.NewGuid()}}","name":"Supino reto","sets":3,"repetitions":10}],
             "pull":[{"id":"{{Guid.NewGuid()}}","name":"Remada curvada","sets":3,"repetitions":10}],
             "lower":[{"id":"{{Guid.NewGuid()}}","name":"Agachamento livre","sets":3,"repetitions":10}],
             "runDescription":"Corrida do dia"}
            """;

        var restored = TrainingSheetDocuments.DeserializeSheet(id, legacy);
        var exercise = Assert.IsType<StrengthWorkout>(restored.Workout(WorkoutType.Push)).Exercises.Single();

        Assert.Null(exercise.DurationSeconds);
        Assert.Null(exercise.Observation);
        Assert.Equal(exercise.Id, exercise.ExerciseKey);
    }

    [Fact]
    public void Documento_preserva_identidade_historica_e_snapshot_de_tempo()
    {
        var exerciseId = Guid.NewGuid();
        var exerciseKey = Guid.NewGuid();
        var sheet = TrainingSheet.Create(
            Guid.NewGuid(),
            StrengthWorkout.Create(WorkoutType.Push, [ExercisePrescription.Create(
                exerciseId, "Prancha", 3, 1, durationSeconds: 40, exerciseKey: exerciseKey)]),
            Strength(WorkoutType.Pull, "Remada"),
            Strength(WorkoutType.Lower, "Agachamento"),
            RunningWorkout.Create(
                RunPrescription.Create("Terça"),
                RunPrescription.Create("Quinta"),
                RunPrescription.Create("Sábado")));
        var execution = StrengthWorkoutExecution.Create(
            sheet.Id,
            WorkoutType.Push,
            new DateOnly(2026, 8, 30),
            [ExerciseExecution.Executed(
                exerciseId, "Prancha", 3, 1, 20, null, exerciseKey, durationSeconds: 40)]);

        var restoredSheet = TrainingSheetDocuments.DeserializeSheet(
            sheet.Id, TrainingSheetDocuments.Serialize(sheet));
        var restoredExecution = TrainingSheetDocuments.DeserializeExecution(
            TrainingSheetDocuments.Serialize(execution)).Single();

        Assert.Equal(exerciseKey,
            Assert.IsType<StrengthWorkout>(restoredSheet.Workout(WorkoutType.Push)).Exercises.Single().ExerciseKey);
        Assert.Equal(exerciseKey, restoredExecution.ExerciseKey);
        Assert.Equal(40, restoredExecution.DurationSeconds);
    }

    private static StrengthWorkout Strength(WorkoutType type, string name) =>
        StrengthWorkout.Create(type, [ExercisePrescription.Create(Guid.NewGuid(), name, 3, 10)]);

    private static TrainingSheet Sheet() => TrainingSheet.Create(
        Guid.NewGuid(),
        Strength(WorkoutType.Push, "Supino reto"),
        Strength(WorkoutType.Pull, "Remada curvada"),
        Strength(WorkoutType.Lower, "Agachamento livre"),
        RunningWorkout.Create(
            RunPrescription.Create("Corrida de terça"),
            RunPrescription.Create("Corrida de quinta"),
            RunPrescription.Create("Corrida de sábado")));
}
