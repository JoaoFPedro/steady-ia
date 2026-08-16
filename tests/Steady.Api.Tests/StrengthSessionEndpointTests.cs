using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Domain.Training;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class StrengthSessionEndpointTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task RegistrarSessaoDeMusculacao_Valida_PersisteERetornaCriada()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var request = new StrengthSessionRequest(
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            MuscleGroup: MuscleGroup.PernaPosterior,
            Intensity: Intensity.Moderado,
            DurationMinutes: 40);

        var response = await client.PostAsJsonAsync("/api/strength-sessions", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<StrengthSessionResponse>();
        created.Should().NotBeNull();
        created!.Id.Should().NotBeEmpty();
        created.MuscleGroup.Should().Be(MuscleGroup.PernaPosterior);
        created.Intensity.Should().Be(Intensity.Moderado);
    }
}
