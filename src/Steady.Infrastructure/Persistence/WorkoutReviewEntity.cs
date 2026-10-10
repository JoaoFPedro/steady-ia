using Steady.Domain.Adherence;

namespace Steady.Infrastructure.Persistence;

public sealed class WorkoutReviewEntity
{
    public Guid Id { get; set; }
    public Guid CorredorId { get; set; }
    public Guid ExecutionId { get; set; }
    public WorkoutExecutionKind ExecutionKind { get; set; }
    public DateOnly ExecutionDate { get; set; }
    public WorkoutAdherenceStatus Status { get; set; }
    public AuthorizedAction? Action { get; set; }
    public int PolicyVersion { get; set; }
    public int? PlanVersion { get; set; }
    public Guid? TrainingSheetId { get; set; }
    public required string ComparisonJson { get; set; }
    public ExplanationStatus ExplanationStatus { get; set; }
    public string? ExplanationJson { get; set; }
    public DateTime? UnderstoodAt { get; set; }
    public bool Contested { get; set; }
    public CoherenceStatus CoherenceStatus { get; set; }
    public Guid? NextExecutionId { get; set; }
    public int? CoherencePolicyVersion { get; set; }
    public DateTime? CoherenceEvaluatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
