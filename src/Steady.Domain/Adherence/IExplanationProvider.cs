namespace Steady.Domain.Adherence;

public sealed record ExplanationFact(
    string Field,
    double? PrescribedMin,
    double? PrescribedMax,
    double? Executed,
    double? Difference,
    FieldAdherenceStatus Status);

/// <summary>
/// Lista positiva do que pode sair do servidor (ADR-016). Não contém ids,
/// nome, e-mail, região da dor ou texto livre do corredor/personal.
/// </summary>
public sealed record ExplanationContext(
    string Modality,
    IReadOnlyList<ExplanationFact> Facts,
    AuthorizedAction Action,
    bool PainReported);

public interface IExplanationProvider
{
    Task<StructuredExplanation?> ExplainAsync(
        ExplanationContext context, CancellationToken cancellationToken);
}
