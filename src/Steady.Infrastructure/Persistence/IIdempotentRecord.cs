using Microsoft.EntityFrameworkCore;

namespace Steady.Infrastructure.Persistence;

/// <summary>Registro criado pelo corredor que carrega a chave de idempotência do ADR-003.</summary>
public interface IIdempotentRecord
{
    Guid CorredorId { get; set; }
    Guid IdempotencyKey { get; set; }
}

public static class IdempotentRecordQueries
{
    /// <summary>
    /// Busca um registro já gravado com esta chave. O filtro por <paramref name="corredorId"/> é
    /// parte da invariante: a chave é escopada por corredor (ADR-003), então a de um corredor nunca
    /// alcança nem revela o registro de outro (A01, ADR-002).
    /// </summary>
    public static Task<TEntity?> FindByIdempotencyKeyAsync<TEntity>(
        this DbSet<TEntity> records,
        Guid corredorId,
        Guid idempotencyKey,
        CancellationToken cancellationToken)
        where TEntity : class, IIdempotentRecord =>
        records.FirstOrDefaultAsync(
            record => record.CorredorId == corredorId && record.IdempotencyKey == idempotencyKey,
            cancellationToken);
}
