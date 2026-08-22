using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Steady.Api.Auth;
using Steady.Api.Common;
using Steady.Api.Contracts;
using Steady.Domain.Planning;
using Steady.Infrastructure.Persistence;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class PlanRequestEndpoints
{
    private const string DateFormat = "yyyy-MM-dd";

    public static RouteGroupBuilder MapPlanRequestEndpoints(this RouteGroupBuilder group)
    {
        group.MapPost("/plan-requests", async (
            PlanRequestBody body,
            [FromHeader(Name = Idempotency.HeaderName)] Guid? idempotencyKey,
            IPlanRequestRepository repository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            if (idempotencyKey is null)
                return Idempotency.MissingKey();

            // Guard clauses na borda: a fila offline guarda payload que pode chegar
            // depois de uma atualização do app, então a API nunca confia no cliente
            // (spec STORY-010, regra 7).
            if (!PlanRequestWire.TryDistancia(body.RaceDistance, out var distancia))
                return Erro("Distância de prova desconhecida.");

            if (!DateOnly.TryParseExact(body.RaceDate, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dataDaProva))
                return Erro($"A data da prova deve estar no formato {DateFormat}.");

            if (!PlanRequestWire.TryEquipamento(body.EquipmentAccess, out var equipamento))
                return Erro("Acesso a equipamento desconhecido.");

            if (!PlanRequestWire.TryDores(body.RecurringPainAreas, out var dores))
                return Erro("Região de dor desconhecida.");

            if (!DomainFactory.TryCreate(() => PlanRequest.Create(
                    distancia,
                    dataDaProva,
                    body.RaceIsFirstTime,
                    body.LongestRecentRunKm,
                    body.TrainingDaysPerWeek,
                    body.CurrentWeeklyRunningDays,
                    body.ReferenceDistanceKm,
                    body.ReferenceDuration,
                    body.StrengthSessionMinutes,
                    equipamento,
                    dores,
                    body.PriorInjuries,
                    today: DateOnly.FromDateTime(DateTime.UtcNow)),
                out var pedido, out var error))
                return error!;

            var (entity, created) = await repository.AddAsync(
                currentCorredor.Id, pedido!, idempotencyKey.Value, cancellationToken);

            var response = Responder(entity);

            return created
                ? Results.Created($"/api/plan-requests/{entity.IdempotencyKey}", response)
                : Results.Ok(response);
        });

        group.MapGet("/plan-requests", async (
            IPlanRequestRepository repository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            var pedidos = await repository.GetByCorredorIdAsync(currentCorredor.Id, cancellationToken);

            return Results.Ok(pedidos.Select(Responder).ToArray());
        });

        // A chave de idempotência é a identidade estável do pedido — existe desde antes
        // de ele chegar ao servidor, e é por ela que o app navega (spec, regra 3).
        group.MapGet("/plan-requests/{idempotencyKey:guid}", async (
            Guid idempotencyKey,
            IPlanRequestRepository repository,
            CurrentCorredor currentCorredor,
            CancellationToken cancellationToken) =>
        {
            var pedido = await repository.GetByIdempotencyKeyAsync(
                currentCorredor.Id, idempotencyKey, cancellationToken);

            // 404 e não 403 em pedido de outro corredor: não revela que existe (A01).
            return pedido is null ? Results.NotFound() : Results.Ok(Responder(pedido));
        });

        return group;
    }

    private static IResult Erro(string mensagem) => Results.BadRequest(new { error = mensagem });

    private static PlanRequestResponse Responder(PlanRequestEntity entity) => new(
        entity.Id,
        entity.IdempotencyKey,
        PlanRequestWire.Escrever(entity.RaceDistance),
        entity.RaceDate,
        entity.RaceIsFirstTime,
        entity.LongestRecentRunKm,
        entity.TrainingDaysPerWeek,
        entity.CurrentWeeklyRunningDays,
        entity.ReferenceDistanceKm,
        entity.ReferenceDuration,
        entity.StrengthSessionMinutes,
        PlanRequestWire.Escrever(entity.EquipmentAccess),
        PlanRequestWire.Escrever(entity.RecurringPainAreas),
        entity.PriorInjuries,
        entity.CreatedAt);
}
