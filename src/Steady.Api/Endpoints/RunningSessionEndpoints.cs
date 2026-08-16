using Microsoft.AspNetCore.Mvc;
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
            [FromHeader(Name = Idempotency.HeaderName)] Guid? idempotencyKey,
            IRunningSessionRepository repository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            if (idempotencyKey is null)
                return Idempotency.MissingKey();

            if (!DomainFactory.TryCreate(() => RunningSession.Create(
                    request.Date,
                    request.DistanceKm,
                    request.DurationMinutes,
                    request.AveragePaceMinPerKm,
                    request.PerceivedEffort),
                out var session, out var error))
                return error!;

            var (entity, created) = await repository.AddAsync(
                currentCorredor.Id, session!, idempotencyKey.Value, cancellationToken);

            var response = new RunningSessionResponse(
                entity.Id,
                entity.Date,
                entity.DistanceKm,
                entity.DurationMinutes,
                entity.AveragePaceMinPerKm,
                entity.PerceivedEffort);

            return created
                ? Results.Created($"/api/training-sessions/{entity.Id}", response)
                : Results.Ok(response);
        });

        return group;
    }
}
