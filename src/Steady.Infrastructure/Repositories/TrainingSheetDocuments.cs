using System.Text.Json;
using Steady.Domain.Coaching;

namespace Steady.Infrastructure.Repositories;

public static class TrainingSheetDocuments
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private sealed record ExerciseDocument(Guid Id, string Name, int Sets, int Repetitions);
    private sealed record SheetDocument(
        IReadOnlyList<ExerciseDocument> Push,
        IReadOnlyList<ExerciseDocument> Pull,
        IReadOnlyList<ExerciseDocument> Lower,
        string RunDescription);
    private sealed record ExerciseExecutionDocument(
        Guid ExerciseId,
        string Name,
        int Sets,
        int Repetitions,
        decimal? LoadKg,
        string? Note,
        bool Skipped);

    public static string Serialize(TrainingSheet sheet)
    {
        static IReadOnlyList<ExerciseDocument> Exercises(WorkoutPrescription workout) =>
            ((StrengthWorkout)workout).Exercises
                .Select(item => new ExerciseDocument(item.Id, item.Name, item.Sets, item.Repetitions))
                .ToArray();

        var document = new SheetDocument(
            Exercises(sheet.Workout(WorkoutType.Push)),
            Exercises(sheet.Workout(WorkoutType.Pull)),
            Exercises(sheet.Workout(WorkoutType.Lower)),
            ((RunningWorkout)sheet.Workout(WorkoutType.Run)).Description);

        return JsonSerializer.Serialize(document, JsonOptions);
    }

    public static TrainingSheet DeserializeSheet(Guid id, string json)
    {
        var document = JsonSerializer.Deserialize<SheetDocument>(json, JsonOptions)
            ?? throw new InvalidOperationException("Documento de ficha inválido.");

        static StrengthWorkout Strength(WorkoutType type, IReadOnlyList<ExerciseDocument> exercises) =>
            StrengthWorkout.Create(type, exercises
                .Select(item => ExercisePrescription.Create(item.Id, item.Name, item.Sets, item.Repetitions))
                .ToArray());

        return TrainingSheet.Create(
            id,
            Strength(WorkoutType.Push, document.Push),
            Strength(WorkoutType.Pull, document.Pull),
            Strength(WorkoutType.Lower, document.Lower),
            RunningWorkout.Create(document.RunDescription));
    }

    public static string Serialize(StrengthWorkoutExecution execution) =>
        JsonSerializer.Serialize(
            execution.Exercises.Select(item => new ExerciseExecutionDocument(
                item.ExerciseId,
                item.Name,
                item.Sets,
                item.Repetitions,
                item.LoadKg,
                item.Note,
                item.Skipped)).ToArray(),
            JsonOptions);

    public static IReadOnlyList<ExerciseExecution> DeserializeExecution(string json)
    {
        var documents = JsonSerializer.Deserialize<ExerciseExecutionDocument[]>(json, JsonOptions)
            ?? throw new InvalidOperationException("Documento de execução inválido.");

        return documents.Select(item => item.Skipped
            ? ExerciseExecution.SkippedExercise(
                item.ExerciseId, item.Name, item.Sets, item.Repetitions, item.Note)
            : ExerciseExecution.Executed(
                item.ExerciseId, item.Name, item.Sets, item.Repetitions,
                item.LoadKg ?? throw new InvalidOperationException("Execução sem carga."), item.Note))
            .ToArray();
    }
}

