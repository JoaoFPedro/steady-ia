namespace Steady.Infrastructure.Persistence;

public sealed class PainLogEntity
{
    public Guid Id { get; set; }
    public Guid CorredorId { get; set; }
    public DateOnly Date { get; set; }
    public required string Region { get; set; }
}
