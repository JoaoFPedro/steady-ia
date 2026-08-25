using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Steady.Api.Auth;
using Steady.Api.Common;
using Steady.Api.Contracts;
using Steady.Api.Logging;
using Steady.Domain.Coaching;
using Steady.Infrastructure.Persistence;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class TrainingSheetEndpoints
{
    private const string PersonalRole = "Personal";
    private const string DateFormat = "yyyy-MM-dd";

    public static RouteGroupBuilder MapTrainingSheetEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/coaching/runners/{corredorId:guid}/training-sheets", async (
            Guid corredorId,
            PublishTrainingSheetBody body,
            ITrainingSheetRepository sheets,
            CurrentCorredor current,
            ILogger<CoachingAuditLog> audit,
            CancellationToken cancellationToken) =>
        {
            if (!current.HasRole(PersonalRole))
                return Results.StatusCode(StatusCodes.Status403Forbidden);

            if (!TryCreateSheet(body, out var sheet, out var error))
                return error!;

            try
            {
                var entity = await sheets.PublishAsync(
                    current.Id, corredorId, sheet!, cancellationToken);
                audit.LogInformation(
                    "coaching.sheet_published sheet_id={SheetId} personal_id={PersonalId} corredor_id={CorredorId}",
                    entity.Id, current.Id, corredorId);
                var active = await sheets.GetActiveAsync(corredorId, cancellationToken);
                return Results.Created(
                    $"/api/coaching/training-sheets/{entity.Id}", Respond(active!));
            }
            catch (UnauthorizedAccessException)
            {
                return Results.NotFound();
            }
        });

        group.MapGet("/coaching/training-sheet/active", async (
            ITrainingSheetRepository sheets,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            var active = await sheets.GetActiveAsync(current.Id, cancellationToken);
            return active is null ? Results.NotFound() : Results.Ok(Respond(active));
        });

        group.MapPost("/coaching/strength-executions", async (
            StrengthWorkoutExecutionBody body,
            [FromHeader(Name = Idempotency.HeaderName)] Guid? idempotencyKey,
            ITrainingSheetRepository sheets,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            if (idempotencyKey is null)
                return Idempotency.MissingKey();

            if (!TryWorkoutType(body.WorkoutType, out var workoutType) || workoutType == WorkoutType.Run)
                return Error("Tipo de treino de musculação desconhecido.");

            if (!DateOnly.TryParseExact(
                    body.Date, DateFormat, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var date))
                return Error($"A data deve estar no formato {DateFormat}.");

            var sheetEntity = await sheets.GetByIdForRunnerAsync(
                body.TrainingSheetId, current.Id, cancellationToken);
            if (sheetEntity is null)
                return Results.NotFound();

            var sheet = TrainingSheetDocuments.DeserializeSheet(sheetEntity.Id, sheetEntity.DefinitionJson);
            var prescribed = ((StrengthWorkout)sheet.Workout(workoutType)).Exercises;
            if (!TryCreateExecution(body, prescribed, workoutType, date, out var execution, out var validationError))
                return validationError!;

            var saved = await sheets.AddExecutionAsync(
                current.Id, execution!, idempotencyKey.Value, cancellationToken);
            var response = Respond(saved.Entity);
            return saved.Created
                ? Results.Created($"/api/coaching/strength-executions/{saved.Entity.Id}", response)
                : Results.Ok(response);
        });

        group.MapGet("/coaching/runners/{corredorId:guid}/history", async (
            Guid corredorId,
            ICoachingLinkRepository links,
            ITrainingSheetRepository sheets,
            IRunningSessionRepository runs,
            CurrentCorredor current,
            ILogger<CoachingAuditLog> audit,
            CancellationToken cancellationToken) =>
        {
            if (!current.HasRole(PersonalRole))
                return Results.StatusCode(StatusCodes.Status403Forbidden);

            if (!await links.HasActiveAsync(current.Id, corredorId, cancellationToken))
                return Results.NotFound();

            var strength = await sheets.GetHistoryAsync(current.Id, corredorId, cancellationToken);
            var running = await runs.GetByCorredorIdAsync(corredorId, cancellationToken);
            audit.LogInformation(
                "coaching.history_viewed personal_id={PersonalId} corredor_id={CorredorId}",
                current.Id, corredorId);

            return Results.Ok(new CoachingHistoryResponse(
                strength.Select(Respond).ToArray(),
                running.OrderByDescending(item => item.Date).Select(item => new RunningHistoryResponse(
                    item.Id,
                    item.Date,
                    item.DistanceKm,
                    item.DurationMinutes,
                    item.AveragePaceMinPerKm,
                    item.PerceivedEffort)).ToArray()));
        });

        return group;
    }

    private static bool TryCreateSheet(
        PublishTrainingSheetBody body,
        out TrainingSheet? sheet,
        out IResult? error)
    {
        sheet = null;
        if (body.Push is null || body.Pull is null || body.Lower is null || body.RunDescription is null)
        {
            error = Error("A ficha exige Empurrada, Puxada, Inferiores e Corrida.");
            return false;
        }

        if (!DomainFactory.TryCreate(() => TrainingSheet.Create(
                Guid.NewGuid(),
                StrengthWorkout.Create(WorkoutType.Push, CreateExercises(body.Push)),
                StrengthWorkout.Create(WorkoutType.Pull, CreateExercises(body.Pull)),
                StrengthWorkout.Create(WorkoutType.Lower, CreateExercises(body.Lower)),
                RunningWorkout.Create(body.RunDescription)),
            out sheet, out error))
            return false;

        return true;
    }

    private static ExercisePrescription[] CreateExercises(IReadOnlyList<ExercisePrescriptionBody> bodies) =>
        bodies.Select(item => ExercisePrescription.Create(
            Guid.NewGuid(), item.Name, item.Sets, item.Repetitions)).ToArray();

    private static bool TryCreateExecution(
        StrengthWorkoutExecutionBody body,
        IReadOnlyList<ExercisePrescription> prescribed,
        WorkoutType workoutType,
        DateOnly date,
        out StrengthWorkoutExecution? execution,
        out IResult? error)
    {
        execution = null;
        var bodies = body.Exercises ?? [];
        if (bodies.Count != prescribed.Count ||
            bodies.Select(item => item.ExerciseId).Distinct().Count() != prescribed.Count ||
            prescribed.Any(item => bodies.All(bodyItem => bodyItem.ExerciseId != item.Id)))
        {
            error = Error("A execução deve informar todos os exercícios prescritos uma única vez.");
            return false;
        }

        return DomainFactory.TryCreate(() => StrengthWorkoutExecution.Create(
                body.TrainingSheetId,
                workoutType,
                date,
                prescribed.Select(item =>
                {
                    var input = bodies.Single(bodyItem => bodyItem.ExerciseId == item.Id);
                    return input.Skipped
                        ? ExerciseExecution.SkippedExercise(
                            item.Id, item.Name, item.Sets, item.Repetitions, input.Note)
                        : ExerciseExecution.Executed(
                            item.Id, item.Name, item.Sets, item.Repetitions,
                            input.LoadKg ?? 0, input.Note);
                }).ToArray()),
            out execution, out error);
    }

    private static TrainingSheetResponse Respond(ActiveTrainingSheet active) => new(
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
            RunningWorkout run => new WorkoutPrescriptionResponse("run", [], run.Description),
            _ => throw new InvalidOperationException("Tipo de treino desconhecido.")
        }).ToArray());

    private static StrengthWorkoutExecutionResponse Respond(StrengthWorkoutExecutionEntity entity) => new(
        entity.Id,
        entity.TrainingSheetId,
        Write(entity.WorkoutType),
        entity.Date,
        TrainingSheetDocuments.DeserializeExecution(entity.DetailsJson)
            .Select(item => new ExerciseExecutionResponse(
                item.ExerciseId,
                item.Name,
                item.Sets,
                item.Repetitions,
                item.LoadKg,
                item.Note,
                item.Skipped)).ToArray(),
        entity.CreatedAt);

    private static bool TryWorkoutType(string value, out WorkoutType type) =>
        Enum.TryParse(value switch
        {
            "push" => nameof(WorkoutType.Push),
            "pull" => nameof(WorkoutType.Pull),
            "lower" => nameof(WorkoutType.Lower),
            "run" => nameof(WorkoutType.Run),
            _ => value
        }, ignoreCase: true, out type);

    private static string Write(WorkoutType type) => type.ToString().ToLowerInvariant();
    private static IResult Error(string message) => Results.BadRequest(new { error = message });
}
