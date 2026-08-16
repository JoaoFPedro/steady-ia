namespace Steady.Infrastructure.Persistence;

public sealed class RunningSessionEntity
{
    public Guid Id { get; set; }
    public Guid CorredorId { get; set; }
    public DateOnly Date { get; set; }
    public double DistanceKm { get; set; }
    public int DurationMinutes { get; set; }
    public double AveragePaceMinPerKm { get; set; }
    public int PerceivedEffort { get; set; }
}
