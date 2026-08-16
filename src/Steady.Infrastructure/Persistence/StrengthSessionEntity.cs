using Steady.Domain.Training;

namespace Steady.Infrastructure.Persistence;

public sealed class StrengthSessionEntity
{
    public Guid Id { get; set; }
    public Guid CorredorId { get; set; }
    public DateOnly Date { get; set; }
    public MuscleGroup MuscleGroup { get; set; }
    public Intensity Intensity { get; set; }
    public int DurationMinutes { get; set; }
}
