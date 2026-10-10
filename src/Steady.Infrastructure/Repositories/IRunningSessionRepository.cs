using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IRunningSessionRepository
{
    Task<SaveResult<RunningSessionEntity>> AddAsync(
        Guid corredorId,
        RunningSession session,
        Guid idempotencyKey,
        bool painReportedAtCompletion,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<RunningSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken);

    Task<RunningSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken);
}
