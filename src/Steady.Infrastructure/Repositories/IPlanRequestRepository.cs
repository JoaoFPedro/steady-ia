using Steady.Domain.Planning;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IPlanRequestRepository
{
    /// <summary>Grava o pedido. Reenvio com a mesma chave devolve o já gravado (ADR-003).</summary>
    Task<SaveResult<PlanRequestEntity>> AddAsync(
        Guid corredorId, PlanRequest request, Guid idempotencyKey, CancellationToken cancellationToken);

    /// <summary>Pedidos do corredor, mais recente primeiro.</summary>
    Task<IReadOnlyList<PlanRequestEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken);

    /// <summary>
    /// Busca pela chave de idempotência, que é a identidade estável do pedido desde
    /// antes de ele chegar ao servidor (spec STORY-010, regra 3). Filtra por corredor
    /// na query: pedido de outro nunca é alcançado (ADR-002).
    /// </summary>
    Task<PlanRequestEntity?> GetByIdempotencyKeyAsync(
        Guid corredorId, Guid idempotencyKey, CancellationToken cancellationToken);
}
