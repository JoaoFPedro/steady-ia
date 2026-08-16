using System;
using System.Collections.Generic;
using System.Linq;
using Steady.Domain.Training;

namespace Steady.Domain.Overload;

/// <summary>
/// Regra fundamentada em ADR-001 (docs/adr/ADR-001-regra-sobrecarga-combinada.md):
/// ACWR (Gabbett, 2016) + session-RPE (Foster, 2001) + regra dos 10%.
/// </summary>
public static class OverloadDetectionService
{
    private const double OverloadThreshold = 1.10;
    private const int MinimumHistoryDays = 14;
    private const string SuggestionMessage =
        "Você teve um treino pesado de perna e sua carga de corrida aumentou nos últimos 7 dias. " +
        "Considere reduzir a distância ou o ritmo da próxima corrida, ou aliviar a intensidade do próximo treino de perna, para não sobrecarregar.";

    public static OverloadAssessment Evaluate(
        IReadOnlyCollection<RunningSession> runningSessions,
        IReadOnlyCollection<StrengthSession> strengthSessions,
        DateOnly today)
    {
        if (!HasSufficientHistory(runningSessions, strengthSessions, today))
            return OverloadAssessment.NoRisk();

        var recentWindow = (Start: today.AddDays(-6), End: today);
        var previousWindow = (Start: today.AddDays(-13), End: today.AddDays(-7));

        var hasHeavyLegSession = strengthSessions.Any(session =>
            IsWithin(session.Date, recentWindow) &&
            IsLeg(session.MuscleGroup) &&
            session.Intensity == Intensity.Pesado);

        var recentRunningLoad = SumLoad(runningSessions, recentWindow);
        var previousRunningLoad = SumLoad(runningSessions, previousWindow);

        var isOverloaded = hasHeavyLegSession
            && previousRunningLoad > 0
            && recentRunningLoad >= previousRunningLoad * OverloadThreshold;

        return isOverloaded
            ? OverloadAssessment.Risk(SuggestionMessage)
            : OverloadAssessment.NoRisk();
    }

    private static bool HasSufficientHistory(
        IReadOnlyCollection<RunningSession> runningSessions,
        IReadOnlyCollection<StrengthSession> strengthSessions,
        DateOnly today)
    {
        var earliestDate = runningSessions.Select(s => s.Date)
            .Concat(strengthSessions.Select(s => s.Date))
            .Cast<DateOnly?>()
            .Min();

        if (earliestDate is null)
            return false;

        var historySpanDays = today.DayNumber - earliestDate.Value.DayNumber + 1;
        return historySpanDays >= MinimumHistoryDays;
    }

    private static bool IsLeg(MuscleGroup muscleGroup) =>
        muscleGroup is MuscleGroup.PernaFrontal or MuscleGroup.PernaPosterior;

    private static bool IsWithin(DateOnly date, (DateOnly Start, DateOnly End) window) =>
        date >= window.Start && date <= window.End;

    private static double SumLoad(IReadOnlyCollection<RunningSession> sessions, (DateOnly Start, DateOnly End) window) =>
        sessions.Where(s => IsWithin(s.Date, window)).Sum(s => s.Load);
}
