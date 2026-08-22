using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class PlanRequestEndpointTests(CustomWebApplicationFactory factory)
{
    private static string ProvaFutura => DateOnly.FromDateTime(DateTime.UtcNow).AddYears(1).ToString("yyyy-MM-dd");

    private static PlanRequestBody Body(
        string raceDistance = "42.2",
        string? raceDate = null,
        bool raceIsFirstTime = true,
        double longestRecentRunKm = 21,
        int trainingDaysPerWeek = 4,
        int? currentWeeklyRunningDays = null,
        double? referenceDistanceKm = null,
        string? referenceDuration = null,
        int? strengthSessionMinutes = null,
        string? equipmentAccess = null,
        IReadOnlyList<string>? recurringPainAreas = null,
        string? priorInjuries = null) =>
        new(raceDistance, raceDate ?? ProvaFutura, raceIsFirstTime, longestRecentRunKm, trainingDaysPerWeek,
            currentWeeklyRunningDays, referenceDistanceKm, referenceDuration, strengthSessionMinutes,
            equipmentAccess, recurringPainAreas, priorInjuries);

    // --- happy path ---------------------------------------------------------------

    [Fact]
    public async Task CriarPedido_Valido_PersisteERetornaCriado()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(
            referenceDistanceKm: 21.1,
            referenceDuration: "01:52:00",
            strengthSessionMinutes: 50,
            equipmentAccess: "academia_completa",
            recurringPainAreas: ["canela"],
            priorInjuries: "Fascite plantar em 2024."));

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var criado = await response.Content.ReadFromJsonAsync<PlanRequestResponse>();
        criado.Should().NotBeNull();
        criado!.RaceDistance.Should().Be("42.2");
        criado.RaceDate.Should().Be(ProvaFutura);
        criado.RaceIsFirstTime.Should().BeTrue();
        criado.LongestRecentRunKm.Should().Be(21);
        criado.TrainingDaysPerWeek.Should().Be(4);
        criado.ReferenceDuration.Should().Be("01:52:00");
        criado.EquipmentAccess.Should().Be("academia_completa");
        criado.RecurringPainAreas.Should().BeEquivalentTo(["canela"]);
        criado.PriorInjuries.Should().Be("Fascite plantar em 2024.");
    }

    [Fact]
    public async Task CriarPedido_MesmaChave_NaoDuplica()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var chave = Guid.NewGuid();

        var primeira = await client.PostWithKeyAsync("/api/plan-requests", Body(), chave);
        var segunda = await client.PostWithKeyAsync("/api/plan-requests", Body(), chave);

        primeira.StatusCode.Should().Be(HttpStatusCode.Created);
        segunda.StatusCode.Should().Be(HttpStatusCode.OK);

        var lista = await client.GetFromJsonAsync<List<PlanRequestResponse>>("/api/plan-requests");
        lista!.Should().HaveCount(1);
    }

    [Fact]
    public async Task ListarPedidos_DevolveMaisRecentePrimeiro()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        await client.PostRegistroAsync("/api/plan-requests", Body(raceDistance: "21.1"));
        await client.PostRegistroAsync("/api/plan-requests", Body(raceDistance: "42.2"));

        var lista = await client.GetFromJsonAsync<List<PlanRequestResponse>>("/api/plan-requests");

        lista!.Should().HaveCount(2);
        lista[0].RaceDistance.Should().Be("42.2");
        lista[1].RaceDistance.Should().Be("21.1");
    }

    [Fact]
    public async Task BuscarPedidoPelaChave_DevolveAquelePedido()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var chave = Guid.NewGuid();
        await client.PostWithKeyAsync("/api/plan-requests", Body(raceDistance: "10"), chave);

        var pedido = await client.GetFromJsonAsync<PlanRequestResponse>($"/api/plan-requests/{chave}");

        pedido!.RaceDistance.Should().Be("10");
        pedido.IdempotencyKey.Should().Be(chave);
    }

    [Fact]
    public async Task SegundoPedido_NaoAlteraOPrimeiro()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var chavePrimeiro = Guid.NewGuid();
        await client.PostWithKeyAsync("/api/plan-requests", Body(raceDistance: "21.1", longestRecentRunKm: 15), chavePrimeiro);
        await client.PostRegistroAsync("/api/plan-requests", Body(raceDistance: "42.2", longestRecentRunKm: 30));

        var primeiro = await client.GetFromJsonAsync<PlanRequestResponse>($"/api/plan-requests/{chavePrimeiro}");

        primeiro!.RaceDistance.Should().Be("21.1");
        primeiro.LongestRecentRunKm.Should().Be(15);
    }

    // --- edge cases ---------------------------------------------------------------

    [Fact]
    public async Task CriarPedido_SemOpcionais_PersisteComNulos()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body());
        var criado = await response.Content.ReadFromJsonAsync<PlanRequestResponse>();

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        criado!.CurrentWeeklyRunningDays.Should().BeNull();
        criado.ReferenceDistanceKm.Should().BeNull();
        criado.ReferenceDuration.Should().BeNull();
        criado.StrengthSessionMinutes.Should().BeNull();
        criado.EquipmentAccess.Should().BeNull();
        criado.PriorInjuries.Should().BeNull();
        criado.RecurringPainAreas.Should().BeEmpty();
    }

    [Fact]
    public async Task CriarPedido_DorNenhuma_ViraListaVazia()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(recurringPainAreas: ["nenhuma"]));
        var criado = await response.Content.ReadFromJsonAsync<PlanRequestResponse>();

        criado!.RecurringPainAreas.Should().BeEmpty();
    }

    [Fact]
    public async Task ListarPedidos_SemNenhum_DevolveVazio()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var lista = await client.GetFromJsonAsync<List<PlanRequestResponse>>("/api/plan-requests");

        lista!.Should().BeEmpty();
    }

    // --- error cases --------------------------------------------------------------

    [Theory]
    [InlineData("17/05/2027")]
    [InlineData("2027-13-01")]
    [InlineData("2027-02-31")]
    [InlineData("")]
    public async Task CriarPedido_DataMalFormada_Retorna400(string data)
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(raceDate: data));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CriarPedido_DataNoPassado_Retorna400()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var ontem = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1).ToString("yyyy-MM-dd");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(raceDate: ontem));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("50")]
    [InlineData("meia")]
    public async Task CriarPedido_DistanciaDesconhecida_Retorna400(string distancia)
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(raceDistance: distancia));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CriarPedido_EquipamentoDesconhecido_Retorna400()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(equipmentAccess: "esteira"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CriarPedido_NenhumaCombinadaComDor_Retorna400()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(recurringPainAreas: ["nenhuma", "joelho"]));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CriarPedido_DiasDeTreinoForaDaFaixa_Retorna400()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostRegistroAsync("/api/plan-requests", Body(trainingDaysPerWeek: 7));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CriarPedido_SemChaveDeIdempotencia_Retorna400()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.PostAsJsonAsync("/api/plan-requests", Body());

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task BuscarPedidoInexistente_Retorna404()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await client.GetAsync($"/api/plan-requests/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
