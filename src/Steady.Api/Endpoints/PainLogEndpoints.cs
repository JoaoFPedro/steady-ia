using Microsoft.AspNetCore.Mvc;
using Steady.Api.Auth;
using Steady.Api.Common;
using Steady.Api.Contracts;
using Steady.Domain.Training;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class PainLogEndpoints
{
    public static RouteGroupBuilder MapPainLogEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/pain-logs", async (
            PainLogRequest request,
            [FromHeader(Name = Idempotency.HeaderName)] Guid? idempotencyKey,
            IPainLogRepository repository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            if (idempotencyKey is null)
                return Idempotency.MissingKey();

            if (!DomainFactory.TryCreate(() => PainLog.Create(request.Date, request.Region), out var painLog, out var error))
                return error!;

            var (entity, created) = await repository.AddAsync(
                currentCorredor.Id, painLog!, idempotencyKey.Value, cancellationToken);

            var response = new PainLogResponse(entity.Id, entity.Date, entity.Region);

            return created
                ? Results.Created($"/api/pain-logs/{entity.Id}", response)
                : Results.Ok(response);
        });

        return group;
    }
}
