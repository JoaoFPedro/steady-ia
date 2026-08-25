using Steady.Domain.Coaching;

namespace Steady.Infrastructure.Persistence;

public sealed class StrengthWorkoutExecutionEntity : IIdempotentRecord
{
    public Guid Id { get; set; }
    public Guid CorredorId { get; set; }
    public Guid TrainingSheetId { get; set; }
    public WorkoutType WorkoutType { get; set; }
    public required string Date { get; set; }
    public required string DetailsJson { get; set; }
    public Guid IdempotencyKey { get; set; }
    public DateTime CreatedAt { get; set; }
}

