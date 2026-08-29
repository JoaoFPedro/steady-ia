using System.Text.Json;
using Steady.Domain.Coaching;
using Steady.Domain.Common;

namespace Steady.Infrastructure.Repositories;

public static class TrainingSheetDocuments
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// `DurationSeconds` e `Observation` chegaram na STORY-017 e são opcionais:
    /// ficha publicada antes disso os lê como ausentes, sem migration (ADR-012).
    /// </summary>
    private sealed record ExerciseDocument(
        Guid Id,
        string Name,
        int Sets,
        int Repetitions,
        int? DurationSeconds = null,
        string? Observation = null);

    /// <summary>Espelha <see cref="NumericRange{T}"/>. Ausente no JSON = campo não prescrito.</summary>
    private sealed record NumericRangeDocument<T>(T Min, T? Max) where T : struct;

    private sealed record RunPrescriptionDocument(
        string Description,
        NumericRangeDocument<double>? DistanceKm,
        NumericRangeDocument<int>? DurationMinutes,
        NumericRangeDocument<int>? PerceivedEffort);

    private sealed record SheetDocument(
        IReadOnlyList<ExerciseDocument> Push,
        IReadOnlyList<ExerciseDocument> Pull,
        IReadOnlyList<ExerciseDocument> Lower,
        RunPrescriptionDocument? TuesdayRun = null,
        RunPrescriptionDocument? ThursdayRun = null,
        RunPrescriptionDocument? SaturdayRun = null,
        /// <summary>Ficha publicada pela STORY-013, antes dos campos numéricos (ADR-012).</summary>
        string? TuesdayRunDescription = null,
        string? ThursdayRunDescription = null,
        string? SaturdayRunDescription = null,
        /// <summary>Ficha publicada antes da STORY-013 (ADR-010), com uma única descrição.</summary>
        string? RunDescription = null);
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
                .Select(item => new ExerciseDocument(
                    item.Id, item.Name, item.Sets, item.Repetitions,
                    item.DurationSeconds, item.Observation))
                .ToArray();

        var run = (RunningWorkout)sheet.Workout(WorkoutType.Run);
        var document = new SheetDocument(
            Exercises(sheet.Workout(WorkoutType.Push)),
            Exercises(sheet.Workout(WorkoutType.Pull)),
            Exercises(sheet.Workout(WorkoutType.Lower)),
            ToDocument(run.Tuesday),
            ToDocument(run.Thursday),
            ToDocument(run.Saturday));

        return JsonSerializer.Serialize(document, JsonOptions);
    }

    public static TrainingSheet DeserializeSheet(Guid id, string json)
    {
        var document = JsonSerializer.Deserialize<SheetDocument>(json, JsonOptions)
            ?? throw new InvalidOperationException("Documento de ficha inválido.");

        static StrengthWorkout Strength(WorkoutType type, IReadOnlyList<ExerciseDocument> exercises) =>
            StrengthWorkout.Create(type, exercises
                .Select(item => ExercisePrescription.Create(
                    item.Id, item.Name, item.Sets, item.Repetitions,
                    item.DurationSeconds, item.Observation))
                .ToArray());

        return TrainingSheet.Create(
            id,
            Strength(WorkoutType.Push, document.Push),
            Strength(WorkoutType.Pull, document.Pull),
            Strength(WorkoutType.Lower, document.Lower),
            RunningWorkout.Create(
                FromDocument(document.TuesdayRun, document.TuesdayRunDescription, document.RunDescription),
                FromDocument(document.ThursdayRun, document.ThursdayRunDescription, document.RunDescription),
                FromDocument(document.SaturdayRun, document.SaturdayRunDescription, document.RunDescription)));
    }

    private static RunPrescriptionDocument ToDocument(RunPrescription prescription) => new(
        prescription.Description,
        ToDocument(prescription.DistanceKm),
        ToDocument(prescription.DurationMinutes),
        ToDocument(prescription.PerceivedEffort));

    private static NumericRangeDocument<T>? ToDocument<T>(NumericRange<T>? range)
        where T : struct, IComparable<T> =>
        range is { } value ? new NumericRangeDocument<T>(value.Min, value.Max) : null;

    /// <summary>
    /// Prioriza o formato novo (com campos numéricos). Sem ele, cai para os
    /// formatos legados da ADR-010/STORY-013 — que só carregam descrição
    /// (ADR-012).
    /// </summary>
    private static RunPrescription FromDocument(
        RunPrescriptionDocument? current, string? legacyDayDescription, string? legacySingleDescription)
    {
        if (current is not null)
            return RunPrescription.Create(
                current.Description,
                current.DistanceKm?.Min, current.DistanceKm?.Max,
                current.DurationMinutes?.Min, current.DurationMinutes?.Max,
                current.PerceivedEffort?.Min, current.PerceivedEffort?.Max);

        return RunPrescription.Create(legacyDayDescription ?? legacySingleDescription ?? string.Empty);
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
