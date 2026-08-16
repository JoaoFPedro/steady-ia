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
        var createResponse = await owner.PostAsJsonAsync("/api/running-sessions", new RunningSessionRequest(
            DateOnly.FromDateTime(DateTime.UtcNow), DistanceKm: 5, DurationMinutes: 25, AveragePaceMinPerKm: 5.0, PerceivedEffort: 5));
        var created = await createResponse.Content.ReadFromJsonAsync<RunningSessionResponse>();

        var intruder = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var response = await intruder.GetAsync($"/api/training-sessions/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
