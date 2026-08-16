using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Domain.Training;

namespace Steady.Api.Tests;

/// <summary>
/// Contrato de idempotência da sincronização offline — ADR-003.
/// Cenário da spec: "Reenvio do mesmo registro não cria duplicata" (specs/STORY-003/spec.bdd.md).
/// </summary>
[Collection(ApiTestCollection.Name)]
public sealed class IdempotencyTests(CustomWebApplicationFactory factory)
{
    private static RunningSessionRequest NovaCorrida() => new(
        Date: DateOnly.FromDateTime(DateTime.UtcNow),
        DistanceKm: 8,
        DurationMinutes: 40,
        AveragePaceMinPerKm: 5.0,
        PerceivedEffort: 5);

    [Fact]
    public async Task ReenvioDeCorridaComMesmaChave_NaoCriaDuplicata()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var chave = Guid.NewGuid();
        var corrida = NovaCorrida();

        var primeiraTentativa = await client.PostWithKeyAsync("/api/running-sessions", corrida, chave);
        var reenvio = await client.PostWithKeyAsync("/api/running-sessions", corrida, chave);

        primeiraTentativa.StatusCode.Should().Be(HttpStatusCode.Created);
        reenvio.StatusCode.Should().Be(HttpStatusCode.OK, "o reenvio devolve o registro existente, não cria outro");

        var criada = await primeiraTentativa.Content.ReadFromJsonAsync<RunningSessionResponse>();
        var devolvida = await reenvio.Content.ReadFromJsonAsync<RunningSessionResponse>();
        devolvida!.Id.Should().Be(criada!.Id);

        var historico = await client.GetFromJsonAsync<List<TrainingSessionResponse>>("/api/training-sessions");
        historico.Should().ContainSingle("carga de corrida duplicada geraria alerta de sobrecarga falso (ADR-001)");
    }

    [Fact]
    public async Task ReenvioDeMusculacaoComMesmaChave_NaoCriaDuplicata()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var chave = Guid.NewGuid();
        var musculacao = new StrengthSessionRequest(
            Date: DateOnly.FromDateTime(DateTime.UtcNow),
            MuscleGroup: MuscleGroup.PernaFrontal,
            Intensity: Intensity.Pesado,
            DurationMinutes: 50);

        var primeiraTentativa = await client.PostWithKeyAsync("/api/strength-sessions", musculacao, chave);
        var reenvio = await client.PostWithKeyAsync("/api/strength-sessions", musculacao, chave);

        primeiraTentativa.StatusCode.Should().Be(HttpStatusCode.Created);
        reenvio.StatusCode.Should().Be(HttpStatusCode.OK);

        var historico = await client.GetFromJsonAsync<List<TrainingSessionResponse>>("/api/training-sessions");
        historico.Should().ContainSingle();
    }

    [Fact]
    public async Task ReenvioDeDorComMesmaChave_NaoCriaDuplicata()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var chave = Guid.NewGuid();
        var dor = new PainLogRequest(DateOnly.FromDateTime(DateTime.UtcNow), Region: "Canela");

        var primeiraTentativa = await client.PostWithKeyAsync("/api/pain-logs", dor, chave);
        var reenvio = await client.PostWithKeyAsync("/api/pain-logs", dor, chave);

        primeiraTentativa.StatusCode.Should().Be(HttpStatusCode.Created);
        reenvio.StatusCode.Should().Be(HttpStatusCode.OK);

        var criada = await primeiraTentativa.Content.ReadFromJsonAsync<PainLogResponse>();
        var devolvida = await reenvio.Content.ReadFromJsonAsync<PainLogResponse>();
        devolvida!.Id.Should().Be(criada!.Id);
    }

    [Fact]
    public async Task RegistroSemChaveDeIdempotencia_Retorna400()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostAsJsonAsync("/api/running-sessions", NovaCorrida());

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest,
            "a garantia não pode depender da disciplina do cliente (ADR-003)");
    }

    [Fact]
    public async Task MesmaChaveDeCorredoresDiferentes_CriaUmRegistroParaCada()
    {
        var chaveCompartilhada = Guid.NewGuid();
        var corrida = NovaCorrida();

        var primeiroCorredor = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var segundoCorredor = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var respostaPrimeiro = await primeiroCorredor.PostWithKeyAsync("/api/running-sessions", corrida, chaveCompartilhada);
        var respostaSegundo = await segundoCorredor.PostWithKeyAsync("/api/running-sessions", corrida, chaveCompartilhada);

        respostaPrimeiro.StatusCode.Should().Be(HttpStatusCode.Created);
        respostaSegundo.StatusCode.Should().Be(HttpStatusCode.Created,
            "a chave é escopada por corredor — a de um nunca bloqueia a do outro");

        var doPrimeiro = await respostaPrimeiro.Content.ReadFromJsonAsync<RunningSessionResponse>();
        var doSegundo = await respostaSegundo.Content.ReadFromJsonAsync<RunningSessionResponse>();
        doSegundo!.Id.Should().NotBe(doPrimeiro!.Id);
    }

    [Fact]
    public async Task TreinosIdenticosComChavesDiferentes_SaoAmbosPersistidos()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var corrida = NovaCorrida();

        await client.PostWithKeyAsync("/api/running-sessions", corrida, Guid.NewGuid());
        await client.PostWithKeyAsync("/api/running-sessions", corrida, Guid.NewGuid());

        var historico = await client.GetFromJsonAsync<List<TrainingSessionResponse>>("/api/training-sessions");
        historico.Should().HaveCount(2,
            "dois treinos genuinamente iguais no mesmo dia são plausíveis — descartar o segundo subestimaria a carga real");
    }
}
