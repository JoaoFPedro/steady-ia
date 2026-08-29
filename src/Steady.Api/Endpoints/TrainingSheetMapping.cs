using Steady.Api.Contracts;
using Steady.Domain.Coaching;
using Steady.Domain.Common;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

/// <summary>
/// Conversão pura entre o contrato de ficha (<see cref="Steady.Api.Contracts"/>) e o
/// domínio (<see cref="Steady.Domain.Coaching"/>). Extraído de
/// <see cref="TrainingSheetEndpoints"/> para manter roteamento e validação de negócio
/// separados de serialização de payload (FF-003).
/// </summary>
internal static class TrainingSheetMapping
{
    public static ExercisePrescription[] CreateExercises(IReadOnlyList<ExercisePrescriptionBody> bodies) =>
        bodies.Select(item => ExercisePrescription.Create(
            Guid.NewGuid(), item.Name, item.Sets, item.Repetitions)).ToArray();

    public static RunPrescription CreateRunPrescription(RunPrescriptionBody body) => RunPrescription.Create(
        body.Description,
        body.DistanceKm?.Min, body.DistanceKm?.Max,
        body.DurationMinutes?.Min, body.DurationMinutes?.Max,
        body.PerceivedEffort?.Min, body.PerceivedEffort?.Max);

    public static TrainingSheetResponse Respond(ActiveTrainingSheet active) => new(
        active.Entity.Id,
        active.Entity.CorredorId,
        active.Entity.CreatedAt,
        active.Sheet.Workouts.Select(workout => workout switch
        {
            StrengthWorkout strength => new WorkoutPrescriptionResponse(
                Write(strength.Type),
                strength.Exercises.Select(item => new ExercisePrescriptionResponse(
                    item.Id,
                    item.Name,
                    item.Sets,
                    item.Repetitions,
                    active.SuggestedLoads.GetValueOrDefault(item.Id))).ToArray(),
                null),
            RunningWorkout run => new WorkoutPrescriptionResponse(
                "run",
                [],
                new RunningPrescriptionsResponse(
                    Respond(run.Tuesday),
                    Respond(run.Thursday),
                    Respond(run.Saturday))),
            _ => throw new InvalidOperationException("Tipo de treino desconhecido.")
        }).ToArray());

    public static bool TryWorkoutType(string value, out WorkoutType type) =>
        Enum.TryParse(value switch
        {
            "push" => nameof(WorkoutType.Push),
            "pull" => nameof(WorkoutType.Pull),
            "lower" => nameof(WorkoutType.Lower),
            "run" => nameof(WorkoutType.Run),
            _ => value
        }, ignoreCase: true, out type);

    public static string Write(WorkoutType type) => type.ToString().ToLowerInvariant();

    private static RunPrescriptionResponse Respond(RunPrescription prescription) => new(
        prescription.Description,
        Respond(prescription.DistanceKm),
        Respond(prescription.DurationMinutes),
        Respond(prescription.PerceivedEffort));

    private static NumericRangeResponse? Respond(NumericRange<double>? range) =>
        range is { } value ? new NumericRangeResponse(value.Min, value.Max) : null;

    private static IntRangeResponse? Respond(NumericRange<int>? range) =>
        range is { } value ? new IntRangeResponse(value.Min, value.Max) : null;
}
