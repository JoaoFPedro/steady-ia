using System;
using System.Collections.Generic;
using Steady.Domain.Overload;
using Steady.Domain.Training;
using Xunit;

namespace Steady.Domain.Tests;

public class OverloadDetectionTests
{
    private static readonly DateOnly Today = new(2026, 8, 10);

    [Fact]
    public void Sugere_ajuste_quando_perna_pesada_coincide_com_aumento_de_carga_de_corrida()
    {
        var runningSessions = new List<RunningSession>
        {
            RunningSession.Create(new DateOnly(2026, 7, 20), distanceKm: 5, durationMinutes: 25, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 1), distanceKm: 6, durationMinutes: 30, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 9), distanceKm: 8, durationMinutes: 40, averagePaceMinPerKm: 5.0, perceivedEffort: 8),
        };

        var strengthSessions = new List<StrengthSession>
        {
            StrengthSession.Create(new DateOnly(2026, 8, 5), MuscleGroup.PernaPosterior, Intensity.Pesado, durationMinutes: 50),
        };

        var assessment = OverloadDetectionService.Evaluate(runningSessions, strengthSessions, Today);

        Assert.True(assessment.HasRisk);
        Assert.False(string.IsNullOrWhiteSpace(assessment.Suggestion));
    }

    [Fact]
    public void Nao_gera_alerta_quando_historico_tem_menos_de_14_dias()
    {
        var runningSessions = new List<RunningSession>
        {
            RunningSession.Create(new DateOnly(2026, 8, 1), distanceKm: 6, durationMinutes: 30, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 9), distanceKm: 8, durationMinutes: 40, averagePaceMinPerKm: 5.0, perceivedEffort: 8),
        };

        var strengthSessions = new List<StrengthSession>
        {
            StrengthSession.Create(new DateOnly(2026, 8, 5), MuscleGroup.PernaPosterior, Intensity.Pesado, durationMinutes: 50),
        };

        var assessment = OverloadDetectionService.Evaluate(runningSessions, strengthSessions, Today);

        Assert.False(assessment.HasRisk);
        Assert.Null(assessment.Suggestion);
    }

    [Fact]
    public void Nao_sugere_ajuste_quando_perna_e_leve_ou_moderada_mesmo_com_aumento_de_carga_de_corrida()
    {
        var runningSessions = new List<RunningSession>
        {
            RunningSession.Create(new DateOnly(2026, 7, 20), distanceKm: 5, durationMinutes: 25, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 1), distanceKm: 6, durationMinutes: 30, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 9), distanceKm: 8, durationMinutes: 40, averagePaceMinPerKm: 5.0, perceivedEffort: 8),
        };

        var strengthSessions = new List<StrengthSession>
        {
            StrengthSession.Create(new DateOnly(2026, 8, 5), MuscleGroup.PernaFrontal, Intensity.Moderado, durationMinutes: 50),
        };

        var assessment = OverloadDetectionService.Evaluate(runningSessions, strengthSessions, Today);

        Assert.False(assessment.HasRisk);
        Assert.Null(assessment.Suggestion);
    }

    [Fact]
    public void Nao_sugere_ajuste_quando_carga_de_corrida_nao_aumenta_mesmo_com_perna_pesada()
    {
        var runningSessions = new List<RunningSession>
        {
            RunningSession.Create(new DateOnly(2026, 7, 20), distanceKm: 5, durationMinutes: 25, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 1), distanceKm: 8, durationMinutes: 40, averagePaceMinPerKm: 5.0, perceivedEffort: 8),
            RunningSession.Create(new DateOnly(2026, 8, 9), distanceKm: 8, durationMinutes: 40, averagePaceMinPerKm: 5.0, perceivedEffort: 8),
        };

        var strengthSessions = new List<StrengthSession>
        {
            StrengthSession.Create(new DateOnly(2026, 8, 5), MuscleGroup.PernaPosterior, Intensity.Pesado, durationMinutes: 50),
        };

        var assessment = OverloadDetectionService.Evaluate(runningSessions, strengthSessions, Today);

        Assert.False(assessment.HasRisk);
        Assert.Null(assessment.Suggestion);
    }

    [Fact]
    public void Sugestao_de_ajuste_nao_impede_registro_de_nova_sessao()
    {
        var runningSessions = new List<RunningSession>
        {
            RunningSession.Create(new DateOnly(2026, 7, 20), distanceKm: 5, durationMinutes: 25, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 1), distanceKm: 6, durationMinutes: 30, averagePaceMinPerKm: 5.0, perceivedEffort: 5),
            RunningSession.Create(new DateOnly(2026, 8, 9), distanceKm: 8, durationMinutes: 40, averagePaceMinPerKm: 5.0, perceivedEffort: 8),
        };

        var strengthSessions = new List<StrengthSession>
        {
            StrengthSession.Create(new DateOnly(2026, 8, 5), MuscleGroup.PernaPosterior, Intensity.Pesado, durationMinutes: 50),
        };

        var assessment = OverloadDetectionService.Evaluate(runningSessions, strengthSessions, Today);
        Assert.True(assessment.HasRisk);

        var exception = Record.Exception(() =>
            RunningSession.Create(Today, distanceKm: 10, durationMinutes: 50, averagePaceMinPerKm: 5.0, perceivedEffort: 7));

        Assert.Null(exception);
    }
}
