using Microsoft.AspNetCore.Mvc;
using Steady.Api.Auth;
using Steady.Api.Contracts;
using Steady.Api.Logging;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class CoachingLinkEndpoints
{
    private const string PersonalRole = "Personal";

    public static RouteGroupBuilder MapCoachingLinkEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/account", (CurrentCorredor current) =>
            Results.Ok(new CurrentAccountResponse(current.Id, current.Roles)));

        group.MapGet("/coaching/runners/search", async (
            [FromQuery] string email,
            ICorredorRepository accounts,
            ICoachingLinkRepository links,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            if (!current.HasRole(PersonalRole))
                return Results.StatusCode(StatusCodes.Status403Forbidden);

            var normalized = email.Trim();
            if (normalized.Length == 0)
                return Results.BadRequest(new { error = "Informe o e-mail do corredor." });

            var corredor = await accounts.FindRunnerByEmailAsync(normalized, cancellationToken);
            if (corredor is null)
                return Results.NotFound(new { error = "Corredor não encontrado" });

            var available = !await links.RunnerHasActiveAsync(corredor.Id, cancellationToken);
            return Results.Ok(new RunnerSearchResponse(corredor.Id, corredor.Email!, available, corredor.Name));
        });

        group.MapPost("/coaching/links", async (
            CreateCoachingLinkBody body,
            ICorredorRepository accounts,
            ICoachingLinkRepository links,
            CurrentCorredor current,
            ILogger<CoachingAuditLog> audit,
            CancellationToken cancellationToken) =>
        {
            if (!current.HasRole(PersonalRole))
                return Results.StatusCode(StatusCodes.Status403Forbidden);

            if (await links.RunnerHasActiveAsync(body.CorredorId, cancellationToken))
                return Results.Conflict(new { error = "Corredor indisponível para novo vínculo." });

            var corredor = await accounts.GetByIdAsync(body.CorredorId, cancellationToken);
            if (corredor is null || !corredor.Roles.Contains("Corredor"))
                return Results.NotFound(new { error = "Corredor não encontrado" });

            try
            {
                var saved = await links.RequestAsync(current.Id, body.CorredorId, cancellationToken);
                audit.LogInformation(
                    "coaching.link_requested link_id={LinkId} personal_id={PersonalId} corredor_id={CorredorId} created={Created}",
                    saved.Entity.Id, current.Id, body.CorredorId, saved.Created);
                var response = Respond(saved.Entity);
                return saved.Created
                    ? Results.Created($"/api/coaching/links/{saved.Entity.Id}", response)
                    : Results.Ok(response);
            }
            catch (ArgumentException error)
            {
                return Results.BadRequest(new { error = error.Message });
            }
        });

        group.MapGet("/coaching/links/pending", async (
            ICoachingLinkRepository links,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            var pending = await links.GetPendingAsync(current.Id, cancellationToken);
            return Results.Ok(pending.Select(Respond).ToArray());
        });

        group.MapGet("/coaching/link/active", async (
            ICoachingLinkRepository links,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            var active = await links.GetActiveForRunnerAsync(current.Id, cancellationToken);
            return active is null ? Results.NotFound() : Results.Ok(Respond(active));
        });

        group.MapPost("/coaching/links/{linkId:guid}/accept", async (
            Guid linkId,
            ICoachingLinkRepository links,
            CurrentCorredor current,
            ILogger<CoachingAuditLog> audit,
            CancellationToken cancellationToken) =>
        {
            var result = await links.AcceptAsync(linkId, current.Id, cancellationToken);
            if (result == AcceptLinkResult.Accepted)
                audit.LogInformation(
                    "coaching.link_accepted link_id={LinkId} corredor_id={CorredorId}",
                    linkId, current.Id);
            return result switch
            {
                AcceptLinkResult.Accepted => Results.Ok(),
                AcceptLinkResult.AlreadyLinked => Results.Conflict(new { error = "O corredor já possui vínculo ativo." }),
                _ => Results.NotFound()
            };
        });

        group.MapDelete("/coaching/links/{linkId:guid}", async (
            Guid linkId,
            ICoachingLinkRepository links,
            CurrentCorredor current,
            ILogger<CoachingAuditLog> audit,
            CancellationToken cancellationToken) =>
        {
            var ended = await links.EndAsync(linkId, current.Id, cancellationToken);
            if (ended)
                audit.LogInformation(
                    "coaching.link_ended link_id={LinkId} actor_id={ActorId}",
                    linkId, current.Id);
            return ended ? Results.NoContent() : Results.NotFound();
        });

        group.MapGet("/coaching/runners", async (
            ICoachingLinkRepository links,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            if (!current.HasRole(PersonalRole))
                return Results.StatusCode(StatusCodes.Status403Forbidden);

            var runners = await links.GetLinkedRunnersAsync(current.Id, cancellationToken);
            return Results.Ok(runners.Select(item =>
                new LinkedRunnerResponse(item.LinkId, item.CorredorId, item.Email!, item.Name)).ToArray());
        });

        return group;
    }

    private static CoachingLinkResponse Respond(Infrastructure.Persistence.CoachingLinkEntity link) => new(
        link.Id,
        link.PersonalId,
        link.CorredorId,
        link.Status.ToString().ToLowerInvariant(),
        link.RequestedAt);
}
