using Steady.Api.Auth;
using Steady.Api.Common;
using Steady.Api.Contracts;
using Steady.Domain.Training;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class StrengthSessionEndpoints
{
    public static RouteGroupBuilder MapStrengthSessionEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/strength-sessions", async (
            StrengthSessionRequest request,
            IStrengthSessionRepository repository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            if (!DomainFactory.TryCreate(() => StrengthSession.Create(
                    request.Date,
                    request.MuscleGroup,
                    request.Intensity,
                    request.DurationMinutes),
                out var session, out var error))
                return error!;

            var entity = await repository.AddAsync(currentCorredor.Id, session!, cancellationToken);

            var response = new StrengthSessionResponse(
                entity.Id,
                entity.Date,
                entity.MuscleGroup,
                entity.Intensity,
                entity.DurationMinutes);

            return Results.Created($"/api/training-sessions/{entity.Id}", response);
        });

        return group;
    }
}
