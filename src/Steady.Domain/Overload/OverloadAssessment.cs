namespace Steady.Domain.Overload;

public sealed class OverloadAssessment
{
    public bool HasRisk { get; }
    public string? Suggestion { get; }

    /// <summary>
    /// <c>false</c> quando o histórico não cobre os 14 dias que o ADR-001 exige para
    /// avaliar a regra. Distingue "ainda reunindo dados" de "avaliei e não há risco" —
    /// os dois chegariam como <see cref="HasRisk"/> falso a quem lê (ADR-004).
    /// </summary>
    public bool HasSufficientHistory { get; }

    private OverloadAssessment(bool hasRisk, string? suggestion, bool hasSufficientHistory)
    {
        HasRisk = hasRisk;
        Suggestion = suggestion;
        HasSufficientHistory = hasSufficientHistory;
    }

    /// <summary>Histórico curto demais para a regra do ADR-001 ser avaliada.</summary>
    public static OverloadAssessment InsufficientHistory() => new(false, null, false);

    public static OverloadAssessment NoRisk() => new(false, null, true);

    public static OverloadAssessment Risk(string suggestion) => new(true, suggestion, true);
}
