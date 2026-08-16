using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class RunningSessionEndpointTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task RegistrarSessaoDeCorrida_Valida_PersisteERetornaCriada()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var request = new RunningSessionRequest(
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            DistanceKm: 10.5,
            DurationMinutes: 55,
            AveragePaceMinPerKm: 5.2,
            PerceivedEffort: 6);

        var response = await client.PostRegistroAsync("/api/running-sessions", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<RunningSessionResponse>();
        created.Should().NotBeNull();
        created!.Id.Should().NotBeEmpty();
        created.DistanceKm.Should().Be(request.DistanceKm);
        created.PerceivedEffort.Should().Be(request.PerceivedEffort);
    }

    [Fact]
    public async Task RegistrarSessaoDeCorrida_DistanciaInvalida_Retorna400()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var request = new RunningSessionRequest(
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            DistanceKm: 0,
            DurationMinutes: 30,
            AveragePaceMinPerKm: 5.0,
            PerceivedEffort: 5);

        var response = await client.PostRegistroAsync("/api/running-sessions", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
