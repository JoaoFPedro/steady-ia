using Steady.Api.Auth;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class TrainingPlanEndpoints
{
    public static RouteGroupBuilder MapTrainingPlanEndpoints(this RouteGroupBuilder group)
    {
        // Sem identificador de corredor na rota, de propósito: o único plano que
        // esta rota pode devolver é o do corredor autenticado (ADR-002) — não
        // existe parâmetro para pedir o de outro.
        group.MapGet("/planning/steady-plan", async (
            ITrainingPlanRepository plans,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            var plan = await plans.GetForRunnerAsync(current.Id, cancellationToken);
            return plan is null ? Results.NotFound() : Results.Ok(TrainingPlanMapping.Respond(plan));
        });

        return group;
    }
}
