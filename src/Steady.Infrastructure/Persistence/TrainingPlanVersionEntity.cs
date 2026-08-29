namespace Steady.Infrastructure.Persistence;

/// <summary>
/// Versão imutável do plano do Steady (ADR-013). Só uma linha por vez tem
/// <see cref="IsCurrent"/> verdadeiro — é a que corredores novos recebem.
/// Publicar uma versão nova nunca reescreve esta linha nem realoca quem já
/// aponta para ela.
/// </summary>
public sealed class TrainingPlanVersionEntity
{
    public Guid Id { get; set; }
    public int Version { get; set; }
    public required string DefinitionJson { get; set; }
    public bool IsCurrent { get; set; }
    public DateTime CreatedAt { get; set; }
}
