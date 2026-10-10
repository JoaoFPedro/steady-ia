using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Domain.Training;
using Microsoft.Extensions.DependencyInjection;
using Steady.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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

        var response = await client.PostRegistroAsync("/api/strength-sessions", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await response.Content.ReadFromJsonAsync<StrengthSessionResponse>();
        created.Should().NotBeNull();
        created!.Id.Should().NotBeEmpty();
        created.MuscleGroup.Should().Be(MuscleGroup.PernaPosterior);
        created.Intensity.Should().Be(Intensity.Moderado);
    }

    [Fact]
    public async Task RegistrarSessaoComDor_PersisteDorNaMesmaOperacao()
    {
        var sub = $"sub-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredor(sub);
        var request = new StrengthSessionRequest(
            Date: new DateOnly(2026, 8, 30),
            MuscleGroup: MuscleGroup.PernaPosterior,
            Intensity: Intensity.Moderado,
            DurationMinutes: 40,
            PainReported: true);

        var response = await client.PostRegistroAsync("/api/strength-sessions", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        (await db.PainLogs.AnyAsync(p => p.Date == request.Date && p.Region == "Informada no encerramento"))
            .Should().BeTrue();
    }
}
