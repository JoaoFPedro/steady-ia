namespace Steady.Infrastructure.Persistence;

public sealed class CorredorEntity
{
    public Guid Id { get; set; }
    public required string GoogleSub { get; set; }
    public DateTime CreatedAt { get; set; }
}
