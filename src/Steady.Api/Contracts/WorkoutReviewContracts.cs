namespace Steady.Api.Contracts;

public sealed record WorkoutReviewResponse(
    Guid Id,
    Guid ExecutionId,
    string ExecutionKind,
    DateOnly ExecutionDate,
    string Status,
    string? Action,
    int PolicyVersion,
    int? PlanVersion,
    Guid? TrainingSheetId,
    string ComparisonJson,
    string ExplanationStatus,
    string? ExplanationJson,
    DateTime? UnderstoodAt,
    bool Contested,
    string CoherenceStatus,
    Guid? NextExecutionId,
    int? CoherencePolicyVersion,
    DateTime? CoherenceEvaluatedAt,
    DateTime CreatedAt);
