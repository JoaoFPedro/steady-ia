using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Domain.Training;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class TrainingHistoryEndpointTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task SemHistorico_RetornaListaVazia()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var sessions = await client.GetFromJsonAsync<List<TrainingSessionResponse>>("/api/training-sessions");

        sessions.Should().NotBeNull();
        sessions.Should().BeEmpty();
    }

    [Fact]
    public async Task ComSessoesPersistidas_RetornaApenasSessoesDoCorredorAutenticado()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var clientA = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        await clientA.PostRegistroAsync("/api/running-sessions", new RunningSessionRequest(
            today, DistanceKm: 5, DurationMinutes: 30, AveragePaceMinPerKm: 6.0, PerceivedEffort: 4));
        await clientA.PostRegistroAsync("/api/strength-sessions", new StrengthSessionRequest(
            today, MuscleGroup.Ombro, Intensity.Leve, DurationMinutes: 20));

        var clientB = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        await clientB.PostRegistroAsync("/api/running-sessions", new RunningSessionRequest(
            today, DistanceKm: 20, DurationMinutes: 120, AveragePaceMinPerKm: 6.0, PerceivedEffort: 7));

        var sessions = await clientA.GetFromJsonAsync<List<TrainingSessionResponse>>("/api/training-sessions");

        sessions.Should().NotBeNull();
        sessions.Should().HaveCount(2);
        sessions!.Should().OnlyContain(s => s.DistanceKm != 20);
    }
    [Fact]
    public async Task Historico_RetornaMomentoOriginalDoRegistro_ParaDesempatarCorridas()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var date = new DateOnly(2026, 10, 10);
        var registeredAt = "2026-10-10T12:34:56Z";
        var response = await client.PostRegistroAsync("/api/running-sessions", new
        {
            Date = date, DistanceKm = 5, DurationMinutes = 30,
            AveragePaceMinPerKm = 6, PerceivedEffort = 4, RegisteredAt = registeredAt
        });
        response.EnsureSuccessStatusCode();

        var sessions = await client.GetFromJsonAsync<JsonElement>("/api/training-sessions");
        sessions.GetArrayLength().Should().Be(1);
        sessions[0].GetProperty("registeredAt").GetDateTimeOffset()
            .Should().Be(DateTimeOffset.Parse(registeredAt));
    }

    [Fact]
    public async Task Historico_RetornaMomentoOriginalDoRegistro_DaMusculacao()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var registeredAt = "2026-10-10T18:00:00Z";
        var response = await client.PostRegistroAsync("/api/strength-sessions", new
        {
            Date = new DateOnly(2026, 10, 10), MuscleGroup = MuscleGroup.PeitoTriceps, Intensity = Intensity.Moderado,
            DurationMinutes = 40, RegisteredAt = registeredAt
        });
        response.EnsureSuccessStatusCode();

        var sessions = await client.GetFromJsonAsync<JsonElement>("/api/training-sessions");
        sessions[0].GetProperty("registeredAt").GetDateTimeOffset()
            .Should().Be(DateTimeOffset.Parse(registeredAt));
    }

    [Fact]
    public async Task Historico_SemMomentoInformado_DevolveNulo_SemInventarHorario()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var response = await client.PostRegistroAsync("/api/strength-sessions", new
        {
            Date = new DateOnly(2026, 10, 10), MuscleGroup = MuscleGroup.PeitoTriceps, Intensity = Intensity.Moderado,
            DurationMinutes = 40
        });
        response.EnsureSuccessStatusCode();

        var sessions = await client.GetFromJsonAsync<JsonElement>("/api/training-sessions");
        sessions[0].GetProperty("registeredAt").ValueKind.Should().Be(JsonValueKind.Null);
    }
}
