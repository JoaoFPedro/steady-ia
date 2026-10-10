namespace Steady.Infrastructure.Persistence;

public sealed class AdherencePolicyVersionEntity
{
    public Guid Id { get; set; }
    public int Version { get; set; }
    public decimal RunningDistancePercent { get; set; }
    public decimal RunningDurationPercent { get; set; }
    public int PerceivedEffortPoints { get; set; }
    public int SetsAbsolute { get; set; }
    public decimal RepetitionsPercent { get; set; }
    public decimal LoadPercent { get; set; }
    public bool IsCurrent { get; set; }
    public DateTime CreatedAt { get; set; }
}
