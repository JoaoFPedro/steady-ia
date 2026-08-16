namespace Steady.Domain.Overload;

public sealed class OverloadAssessment
{
    public bool HasRisk { get; }
    public string? Suggestion { get; }

    private OverloadAssessment(bool hasRisk, string? suggestion)
    {
        HasRisk = hasRisk;
        Suggestion = suggestion;
    }

    public static OverloadAssessment NoRisk() => new(false, null);

    public static OverloadAssessment Risk(string suggestion) => new(true, suggestion);
}
