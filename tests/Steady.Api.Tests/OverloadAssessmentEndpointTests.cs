using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Domain.Training;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class OverloadAssessmentEndpointTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task SemHistorico_RetornaSemRisco()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var assessment = await client.GetFromJsonAsync<OverloadAssessmentResponse>("/api/overload-assessment");

        assessment.Should().NotBeNull();
        assessment!.HasRisk.Should().BeFalse();
        assessment.Suggestion.Should().BeNull();
    }

    // ADR-004: o app precisa distinguir "reunindo dados" de "sem risco" sem
    // conhecer o limiar de 14 dias do ADR-001 — a regra não atravessa a fronteira.
    [Fact]
    public async Task SemHistorico_SinalizaHistoricoInsuficiente()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var assessment = await client.GetFromJsonAsync<OverloadAssessmentResponse>("/api/overload-assessment");

        assessment!.HasSufficientHistory.Should().BeFalse();
    }

    [Fact]
    public async Task ComHistoricoRecente_SinalizaHistoricoInsuficiente()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await client.PostRegistroAsync("/api/running-sessions", new RunningSessionRequest(
            today.AddDays(-3), DistanceKm: 8, DurationMinutes: 45, AveragePaceMinPerKm: 5.6, PerceivedEffort: 5));

        var assessment = await client.GetFromJsonAsync<OverloadAssessmentResponse>("/api/overload-assessment");

        assessment!.HasSufficientHistory.Should().BeFalse();
    }

    [Fact]
    public async Task ComMaisDe14DiasDeHistorico_SinalizaHistoricoSuficiente()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        await client.PostRegistroAsync("/api/running-sessions", new RunningSessionRequest(
            today.AddDays(-20), DistanceKm: 8, DurationMinutes: 45, AveragePaceMinPerKm: 5.6, PerceivedEffort: 5));

        var assessment = await client.GetFromJsonAsync<OverloadAssessmentResponse>("/api/overload-assessment");

        assessment!.HasSufficientHistory.Should().BeTrue();
        assessment.HasRisk.Should().BeFalse();
    }

    [Fact]
    public async Task ComPadraoDeSobrecarga_CalculaAPartirDoHistoricoPersistidoERetornaRisco()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Carga de corrida da janela anterior (dias -13 a -7): 60min * esforço 5 = 300
        await client.PostRegistroAsync("/api/running-sessions", new RunningSessionRequest(
            today.AddDays(-13), DistanceKm: 8, DurationMinutes: 60, AveragePaceMinPerKm: 6.0, PerceivedEffort: 5));

        // Carga de corrida da janela recente (dias -6 a 0): 90min * esforço 8 = 720 (>= 110% de 300)
        await client.PostRegistroAsync("/api/running-sessions", new RunningSessionRequest(
            today, DistanceKm: 15, DurationMinutes: 90, AveragePaceMinPerKm: 5.5, PerceivedEffort: 8));

        // Musculação de perna pesada na janela recente
        await client.PostRegistroAsync("/api/strength-sessions", new StrengthSessionRequest(
            today.AddDays(-2), MuscleGroup.PernaFrontal, Intensity.Pesado, DurationMinutes: 45));

        var assessment = await client.GetFromJsonAsync<OverloadAssessmentResponse>("/api/overload-assessment");

        assessment.Should().NotBeNull();
        assessment!.HasRisk.Should().BeTrue();
        assessment.Suggestion.Should().NotBeNullOrWhiteSpace();
    }
}
