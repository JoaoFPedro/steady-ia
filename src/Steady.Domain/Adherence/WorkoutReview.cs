using System.Globalization;
using System.Text.RegularExpressions;

namespace Steady.Domain.Adherence;

public enum WorkoutExecutionKind { Running, Strength, Combined }
public enum ExplanationStatus { Pending, Available, Unavailable }
public enum CoherenceStatus { Unknown, Coherent, NotCoherent }
public enum ExplanationRejectionReason { None, ActionMismatch, UnsafeClaim, UnknownNumber }

public sealed record StructuredExplanation(
    IReadOnlyList<string> Divergences,
    IReadOnlyList<string> PossibleImpacts,
    AuthorizedAction Action,
    string? PainObservation);

public sealed record ExplanationValidationResult(bool Accepted, ExplanationRejectionReason Reason)
{
    public static ExplanationValidationResult Success() => new(true, ExplanationRejectionReason.None);
    public static ExplanationValidationResult Rejected(ExplanationRejectionReason reason) => new(false, reason);
}

public sealed record CoherenceEvaluation(
    CoherenceStatus Status,
    Guid? NextExecutionId,
    int? PolicyVersion,
    DateTime? EvaluatedAt);

public sealed class WorkoutReview
{
    private static readonly Regex NumberPattern = new(@"(?<![\p{L}\d])[+-]?\d+(?:[.,]\d+)?", RegexOptions.Compiled);
    private static readonly string[] UnsafeTerms =
        ["lesão", "lesao", "tendinite", "diagnóstico", "diagnostico", "causou", "causa da dor"];

    public Guid Id { get; }
    public Guid ExecutionId { get; }
    public WorkoutExecutionKind ExecutionKind { get; }
    public DateOnly ExecutionDate { get; }
    public WorkoutAdherenceStatus Status { get; }
    public AuthorizedAction? Action { get; }
    public int PolicyVersion { get; }
    public int? PlanVersion { get; }
    public Guid? TrainingSheetId { get; }
    public string ComparisonJson { get; }
    public ExplanationStatus ExplanationStatus { get; private set; }
    public StructuredExplanation? Explanation { get; private set; }
    public DateTime? UnderstoodAt { get; private set; }
    public bool Contested { get; private set; }
    public CoherenceEvaluation Coherence { get; private set; }
    public DateTime CreatedAt { get; }

    private WorkoutReview(
        Guid id,
        Guid executionId,
        WorkoutExecutionKind executionKind,
        DateOnly executionDate,
        WorkoutAdherenceStatus status,
        AuthorizedAction? action,
        int policyVersion,
        int? planVersion,
        Guid? trainingSheetId,
        string comparisonJson,
        DateTime createdAt)
    {
        Id = id;
        ExecutionId = executionId;
        ExecutionKind = executionKind;
        ExecutionDate = executionDate;
        Status = status;
        Action = action;
        PolicyVersion = policyVersion;
        PlanVersion = planVersion;
        TrainingSheetId = trainingSheetId;
        ComparisonJson = comparisonJson;
        CreatedAt = createdAt;
        ExplanationStatus = action is null ? ExplanationStatus.Unavailable : ExplanationStatus.Pending;
        Coherence = new CoherenceEvaluation(CoherenceStatus.Unknown, null, null, null);
    }

    public static WorkoutReview Create(
        Guid id,
        Guid executionId,
        WorkoutExecutionKind executionKind,
        DateOnly executionDate,
        WorkoutAdherenceStatus status,
        AuthorizedAction? action,
        int policyVersion,
        int? planVersion,
        Guid? trainingSheetId,
        string comparisonJson,
        DateTime createdAt)
    {
        if (id == Guid.Empty) throw new ArgumentException("O id da revisão é obrigatório.", nameof(id));
        if (executionId == Guid.Empty) throw new ArgumentException("A execução é obrigatória.", nameof(executionId));
        if (policyVersion <= 0) throw new ArgumentOutOfRangeException(nameof(policyVersion));
        if (string.IsNullOrWhiteSpace(comparisonJson))
            throw new ArgumentException("O snapshot da comparação é obrigatório.", nameof(comparisonJson));

        return new WorkoutReview(id, executionId, executionKind, executionDate, status, action,
            policyVersion, planVersion, trainingSheetId, comparisonJson, createdAt);
    }

    public void MarkUnderstood(DateTime understoodAt)
    {
        if (UnderstoodAt is null) UnderstoodAt = understoodAt;
    }

    public void MarkContested() => Contested = true;

    public void UpdateCoherence(
        CoherenceStatus status, Guid nextExecutionId, int policyVersion, DateTime evaluatedAt)
    {
        if (nextExecutionId == Guid.Empty) throw new ArgumentException("A próxima execução é obrigatória.");
        if (policyVersion <= 0) throw new ArgumentOutOfRangeException(nameof(policyVersion));
        Coherence = new CoherenceEvaluation(status, nextExecutionId, policyVersion, evaluatedAt);
    }

    public ExplanationValidationResult TrySetExplanation(
        StructuredExplanation explanation, IReadOnlyCollection<double> allowedNumbers)
    {
        if (Action is null || explanation.Action != Action)
            return Reject(ExplanationRejectionReason.ActionMismatch);

        var text = string.Join(' ', explanation.Divergences
            .Concat(explanation.PossibleImpacts)
            .Append(explanation.PainObservation ?? string.Empty));
        if (UnsafeTerms.Any(term => text.Contains(term, StringComparison.OrdinalIgnoreCase)))
            return Reject(ExplanationRejectionReason.UnsafeClaim);

        var unknownNumber = NumberPattern.Matches(text)
            .Select(match => double.TryParse(
                match.Value.Replace(',', '.'), NumberStyles.Float, CultureInfo.InvariantCulture, out var number)
                ? number
                : (double?)null)
            .Where(number => number is not null)
            .Any(number => !allowedNumbers.Any(allowed => Math.Abs(allowed - number!.Value) < 0.000001));
        if (unknownNumber) return Reject(ExplanationRejectionReason.UnknownNumber);

        Explanation = explanation;
        ExplanationStatus = ExplanationStatus.Available;
        return ExplanationValidationResult.Success();
    }

    public void MarkExplanationUnavailable()
    {
        Explanation = null;
        ExplanationStatus = ExplanationStatus.Unavailable;
    }

    private ExplanationValidationResult Reject(ExplanationRejectionReason reason)
    {
        MarkExplanationUnavailable();
        return ExplanationValidationResult.Rejected(reason);
    }
}
