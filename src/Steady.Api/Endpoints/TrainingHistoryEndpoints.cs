using Steady.Api.Auth;
using Steady.Api.Contracts;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class TrainingHistoryEndpoints
{
    public static RouteGroupBuilder MapTrainingHistoryEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/training-sessions", async (
            IRunningSessionRepository runningRepository,
            IStrengthSessionRepository strengthRepository,
            ITrainingSheetRepository sheetRepository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            var runningEntities = await runningRepository.GetByCorredorIdAsync(currentCorredor.Id, cancellationToken);
            var strengthEntities = await strengthRepository.GetByCorredorIdAsync(currentCorredor.Id, cancellationToken);
            // A musculação feita pela ficha do personal vive em outra tabela
            // (`StrengthWorkoutExecution`, ADR-009) e não aparecia aqui: o
            // corredor não a via no histórico e o dia do plano nunca fechava.
            var executionEntities = await sheetRepository.GetExecutionsForRunnerAsync(
                currentCorredor.Id, cancellationToken);

            var sessions = runningEntities
                .Select(e => new TrainingSessionResponse(
                    e.Id, "Corrida", e.Date, e.DurationMinutes,
                    e.DistanceKm, e.AveragePaceMinPerKm, e.PerceivedEffort, null, null))
                .Concat(strengthEntities.Select(e => new TrainingSessionResponse(
                    e.Id, "Musculacao", e.Date, e.DurationMinutes,
                    null, null, null, e.MuscleGroup.ToString(), e.Intensity.ToString())))
                .Concat(executionEntities.Select(e => new TrainingSessionResponse(
                    e.Id, "Musculacao", DateOnly.ParseExact(e.Date, "yyyy-MM-dd"),
                    null, null, null, null, null, null,
                    e.WorkoutType.ToString().ToLowerInvariant())))
                .OrderByDescending(s => s.Date)
                .ToList();

            return Results.Ok(sessions);
        });

        group.MapGet("/training-sessions/{id:guid}", async (
            Guid id,
            IRunningSessionRepository runningRepository,
            IStrengthSessionRepository strengthRepository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            var running = await runningRepository.GetByIdAsync(currentCorredor.Id, id, cancellationToken);
            if (running is not null)
                return Results.Ok(new TrainingSessionResponse(
                    running.Id, "Corrida", running.Date, running.DurationMinutes,
                    running.DistanceKm, running.AveragePaceMinPerKm, running.PerceivedEffort, null, null));

            var strength = await strengthRepository.GetByIdAsync(currentCorredor.Id, id, cancellationToken);
            if (strength is not null)
                return Results.Ok(new TrainingSessionResponse(
                    strength.Id, "Musculacao", strength.Date, strength.DurationMinutes,
                    null, null, null, strength.MuscleGroup.ToString(), strength.Intensity.ToString()));

            return Results.NotFound();
        });

        return group;
    }
}
