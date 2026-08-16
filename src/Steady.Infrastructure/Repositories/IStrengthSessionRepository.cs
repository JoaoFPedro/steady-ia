using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IStrengthSessionRepository
{
    Task<StrengthSessionEntity> AddAsync(Guid corredorId, StrengthSession session, CancellationToken cancellationToken);

    Task<IReadOnlyList<StrengthSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken);

    Task<StrengthSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken);
}
