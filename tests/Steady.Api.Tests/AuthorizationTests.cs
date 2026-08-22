using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class AuthorizationTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task AcessoADadoDeOutroCorredor_Retorna404()
    {
        var owner = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var createResponse = await owner.PostRegistroAsync("/api/running-sessions", new RunningSessionRequest(
            DateOnly.FromDateTime(DateTime.UtcNow), DistanceKm: 5, DurationMinutes: 25, AveragePaceMinPerKm: 5.0, PerceivedEffort: 5));
        var created = await createResponse.Content.ReadFromJsonAsync<RunningSessionResponse>();

        var intruder = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var response = await intruder.GetAsync($"/api/training-sessions/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PlanejamentoDeOutroCorredor_Retorna404()
    {
        var prazo = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(1).ToString("yyyy-MM-dd");
        var owner = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var chave = Guid.NewGuid();
        await owner.PostWithKeyAsync("/api/plan-requests", new PlanRequestBody(
            "42.2", prazo, true, 21, 4, null, null, null, null, null, null, null), chave);

        var intruder = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var response = await intruder.GetAsync($"/api/plan-requests/{chave}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ListaDePlanejamentos_NaoVazaDeOutroCorredor()
    {
        var prazo = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(1).ToString("yyyy-MM-dd");
        var owner = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        await owner.PostRegistroAsync("/api/plan-requests", new PlanRequestBody(
            "42.2", prazo, true, 21, 4, null, null, null, null, null, null, null));

        var intruder = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var lista = await intruder.GetFromJsonAsync<List<PlanRequestResponse>>("/api/plan-requests");

        lista!.Should().BeEmpty();
    }
}
