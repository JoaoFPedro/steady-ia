using Steady.Api.Auth;
using Steady.Api.Contracts;
using Steady.Domain.Overload;
using Steady.Domain.Training;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class OverloadAssessmentEndpoints
{
    public static RouteGroupBuilder MapOverloadAssessmentEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/overload-assessment", async (
            IRunningSessionRepository runningRepository,
            IStrengthSessionRepository strengthRepository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            var runningEntities = await runningRepository.GetByCorredorIdAsync(currentCorredor.Id, cancellationToken);
            var strengthEntities = await strengthRepository.GetByCorredorIdAsync(currentCorredor.Id, cancellationToken);

            var runningSessions = runningEntities
                .Select(e => RunningSession.Create(e.Date, e.DistanceKm, e.DurationMinutes, e.AveragePaceMinPerKm, e.PerceivedEffort))
                .ToList();

            var strengthSessions = strengthEntities
                .Select(e => StrengthSession.Create(e.Date, e.MuscleGroup, e.Intensity, e.DurationMinutes))
                .ToList();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var assessment = OverloadDetectionService.Evaluate(runningSessions, strengthSessions, today);

            return Results.Ok(new OverloadAssessmentResponse(
                assessment.HasRisk, assessment.Suggestion, assessment.HasSufficientHistory));
        });

        return group;
    }
}
