using Steady.Api.Auth;
using Steady.Api.Common;
using Steady.Api.Contracts;
using Steady.Domain.Training;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class RunningSessionEndpoints
{
    public static RouteGroupBuilder MapRunningSessionEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/running-sessions", async (
            RunningSessionRequest request,
            IRunningSessionRepository repository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            if (!DomainFactory.TryCreate(() => RunningSession.Create(
                    request.Date,
                    request.DistanceKm,
                    request.DurationMinutes,
                    request.AveragePaceMinPerKm,
                    request.PerceivedEffort),
                out var session, out var error))
                return error!;

            var entity = await repository.AddAsync(currentCorredor.Id, session!, cancellationToken);

            var response = new RunningSessionResponse(
                entity.Id,
                entity.Date,
                entity.DistanceKm,
                entity.DurationMinutes,
                entity.AveragePaceMinPerKm,
                entity.PerceivedEffort);

            return Results.Created($"/api/training-sessions/{entity.Id}", response);
        });

        return group;
    }
}
