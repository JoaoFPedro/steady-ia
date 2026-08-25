namespace Steady.Infrastructure.Persistence;

public sealed class TrainingSheetEntity
{
    public Guid Id { get; set; }
    public Guid PersonalId { get; set; }
    public Guid CorredorId { get; set; }
    public required string DefinitionJson { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

