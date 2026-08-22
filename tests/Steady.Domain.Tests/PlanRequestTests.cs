using System;
using System.Collections.Generic;
using Steady.Domain.Planning;
using Xunit;

namespace Steady.Domain.Tests;

public class PlanRequestTests
{
    private static readonly DateOnly Hoje = new(2026, 8, 22);
    private static readonly DateOnly ProvaFutura = new(2027, 5, 17);

    private static PlanRequest Valido(
        DateOnly? raceDate = null,
        double longestRecentRunKm = 21,
        int trainingDaysPerWeek = 4,
        int? currentWeeklyRunningDays = null,
        double? referenceDistanceKm = null,
        string? referenceDuration = null,
        int? strengthSessionMinutes = null,
        EquipmentAccess? equipmentAccess = null,
        IReadOnlyList<PainArea>? recurringPainAreas = null,
        string? priorInjuries = null) =>
        PlanRequest.Create(
            raceDistance: RaceDistance.Marathon,
            raceDate: raceDate ?? ProvaFutura,
            raceIsFirstTime: true,
            longestRecentRunKm: longestRecentRunKm,
            trainingDaysPerWeek: trainingDaysPerWeek,
            currentWeeklyRunningDays: currentWeeklyRunningDays,
            referenceDistanceKm: referenceDistanceKm,
            referenceDuration: referenceDuration,
            strengthSessionMinutes: strengthSessionMinutes,
            equipmentAccess: equipmentAccess,
            recurringPainAreas: recurringPainAreas,
            priorInjuries: priorInjuries,
            today: Hoje);

    [Fact]
    public void Corredor_monta_pedido_com_os_campos_minimos()
    {
        var pedido = Valido();

        Assert.Equal(RaceDistance.Marathon, pedido.RaceDistance);
        Assert.Equal(ProvaFutura, pedido.RaceDate);
        Assert.True(pedido.RaceIsFirstTime);
        Assert.Equal(21, pedido.LongestRecentRunKm);
        Assert.Equal(4, pedido.TrainingDaysPerWeek);
    }

    [Fact]
    public void Opcionais_omitidos_ficam_nulos()
    {
        var pedido = Valido();

        Assert.Null(pedido.CurrentWeeklyRunningDays);
        Assert.Null(pedido.ReferenceDistanceKm);
        Assert.Null(pedido.ReferenceDuration);
        Assert.Null(pedido.StrengthSessionMinutes);
        Assert.Null(pedido.EquipmentAccess);
        Assert.Null(pedido.PriorInjuries);
        Assert.Empty(pedido.RecurringPainAreas);
    }

    // --- data da prova (spec.bdd.md STORY-010, regra 6) ---------------------------

    [Fact]
    public void Prova_no_passado_e_recusada()
    {
        var erro = Assert.ThrowsAny<ArgumentException>(() => Valido(raceDate: Hoje.AddDays(-1)));

        Assert.Contains("futura", erro.Message);
    }

    [Fact]
    public void Prova_hoje_e_recusada()
    {
        // O plano é contado de trás para frente a partir da prova: hoje daria zero semanas.
        var erro = Assert.ThrowsAny<ArgumentException>(() => Valido(raceDate: Hoje));

        Assert.Contains("futura", erro.Message);
    }

    [Fact]
    public void Prova_amanha_e_aceita()
    {
        Assert.Equal(Hoje.AddDays(1), Valido(raceDate: Hoje.AddDays(1)).RaceDate);
    }

    // --- obrigatórios -------------------------------------------------------------

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Maior_corrida_recente_nao_positiva_e_recusada(double km)
    {
        Assert.ThrowsAny<ArgumentException>(() => Valido(longestRecentRunKm: km));
    }

    [Theory]
    [InlineData(2)]
    [InlineData(7)]
    public void Dias_de_treino_fora_da_faixa_sao_recusados(int dias)
    {
        Assert.ThrowsAny<ArgumentException>(() => Valido(trainingDaysPerWeek: dias));
    }

    [Theory]
    [InlineData(3)]
    [InlineData(6)]
    public void Dias_de_treino_nos_limites_sao_aceitos(int dias)
    {
        Assert.Equal(dias, Valido(trainingDaysPerWeek: dias).TrainingDaysPerWeek);
    }

    // --- opcionais, quando informados ---------------------------------------------

    [Theory]
    [InlineData(-1)]
    [InlineData(8)]
    public void Corridas_por_semana_fora_da_faixa_sao_recusadas(int dias)
    {
        Assert.ThrowsAny<ArgumentException>(() => Valido(currentWeeklyRunningDays: dias));
    }

    [Fact]
    public void Distancia_de_referencia_nao_positiva_e_recusada()
    {
        Assert.ThrowsAny<ArgumentException>(() => Valido(referenceDistanceKm: 0));
    }

    [Theory]
    [InlineData(19)]
    [InlineData(91)]
    public void Minutos_de_forca_fora_da_faixa_sao_recusados(int minutos)
    {
        Assert.ThrowsAny<ArgumentException>(() => Valido(strengthSessionMinutes: minutos));
    }

    [Theory]
    [InlineData("1:52:00")]
    [InlineData("01:52")]
    [InlineData("uma hora e meia")]
    [InlineData("99:99:99")]
    public void Duracao_de_referencia_mal_formada_e_recusada(string duracao)
    {
        Assert.ThrowsAny<ArgumentException>(() => Valido(referenceDuration: duracao));
    }

    [Fact]
    public void Duracao_de_referencia_valida_e_aceita()
    {
        Assert.Equal("01:52:00", Valido(referenceDuration: "01:52:00").ReferenceDuration);
    }

    // --- normalização --------------------------------------------------------------

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Lesoes_anteriores_em_branco_viram_nulo(string texto)
    {
        Assert.Null(Valido(priorInjuries: texto).PriorInjuries);
    }

    [Fact]
    public void Lesoes_anteriores_perdem_espaco_em_volta()
    {
        Assert.Equal(
            "Fascite plantar em 2024.",
            Valido(priorInjuries: "  Fascite plantar em 2024.  ").PriorInjuries);
    }

    [Fact]
    public void Dores_repetidas_nao_duplicam()
    {
        var pedido = Valido(recurringPainAreas: [PainArea.Canela, PainArea.Canela, PainArea.Joelho]);

        Assert.Equal([PainArea.Canela, PainArea.Joelho], pedido.RecurringPainAreas);
    }

    [Fact]
    public void Nenhuma_combinada_com_dor_real_e_recusada()
    {
        // "Nenhuma" é a ausência das demais; junto com uma dor real seria contradição.
        Assert.ThrowsAny<ArgumentException>(
            () => Valido(recurringPainAreas: [PainArea.Nenhuma, PainArea.Joelho]));
    }

    [Fact]
    public void Somente_nenhuma_vira_lista_vazia()
    {
        Assert.Empty(Valido(recurringPainAreas: [PainArea.Nenhuma]).RecurringPainAreas);
    }
}
