using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IRunningSessionRepository
{
    Task<RunningSessionEntity> AddAsync(Guid corredorId, RunningSession session, CancellationToken cancellationToken);

    Task<IReadOnlyList<RunningSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken);

    Task<RunningSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken);
}
