using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IStrengthSessionRepository
{
    Task<SaveResult<StrengthSessionEntity>> AddAsync(
        Guid corredorId,
        StrengthSession session,
        Guid idempotencyKey,
        bool painReported,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<StrengthSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken);

    Task<StrengthSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken);
}
