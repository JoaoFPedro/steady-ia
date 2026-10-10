using Steady.Domain.Adherence;

namespace Steady.Infrastructure.Persistence;

public enum ReviewOutboxStatus { Pending, Processing, Completed }

public sealed class ReviewOutboxEntity
{
    public Guid Id { get; set; }
    public Guid CorredorId { get; set; }
    public Guid ExecutionId { get; set; }
    public Guid? TrainingSheetId { get; set; }
    public WorkoutExecutionKind ExecutionKind { get; set; }
    public Guid IdempotencyKey { get; set; }
    public DateOnly ExecutionDate { get; set; }
    public bool PainReportedAtCompletion { get; set; }
    public ReviewOutboxStatus Status { get; set; }
    public int Attempts { get; set; }
    public DateTime? LeaseUntil { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
