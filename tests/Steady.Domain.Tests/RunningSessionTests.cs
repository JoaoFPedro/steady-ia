using System;
using Steady.Domain.Training;
using Xunit;

namespace Steady.Domain.Tests;

public class RunningSessionTests
{
    [Fact]
    public void Corredor_registra_sessao_de_corrida_valida()
    {
        var date = new DateOnly(2026, 8, 3);

        var session = RunningSession.Create(
            date: date,
            distanceKm: 10.0,
            durationMinutes: 55,
            averagePaceMinPerKm: 5.5,
            perceivedEffort: 6);

        Assert.Equal(date, session.Date);
        Assert.Equal(10.0, session.DistanceKm);
        Assert.Equal(55, session.DurationMinutes);
        Assert.Equal(5.5, session.AveragePaceMinPerKm);
        Assert.Equal(6, session.PerceivedEffort);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Rejeita_distancia_zero_ou_negativa(double distanciaInvalida)
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            RunningSession.Create(
                date: new DateOnly(2026, 8, 3),
                distanceKm: distanciaInvalida,
                durationMinutes: 30,
                averagePaceMinPerKm: 5.0,
                perceivedEffort: 5));

        Assert.Contains("distância deve ser maior que zero", exception.Message);
    }

    [Fact]
    public void Rejeita_duracao_zero_ou_negativa()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            RunningSession.Create(
                date: new DateOnly(2026, 8, 3),
                distanceKm: 10,
                durationMinutes: 0,
                averagePaceMinPerKm: 5.0,
                perceivedEffort: 5));

        Assert.Contains("duração deve ser maior que zero", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public void Rejeita_percepcao_de_esforco_fora_da_escala_1_a_10(int esforcoInvalido)
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            RunningSession.Create(
                date: new DateOnly(2026, 8, 3),
                distanceKm: 10,
                durationMinutes: 30,
                averagePaceMinPerKm: 5.0,
                perceivedEffort: esforcoInvalido));

        Assert.Contains("percepção de esforço deve estar entre 1 e 10", exception.Message);
    }
}
