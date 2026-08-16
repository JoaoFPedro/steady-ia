using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IPainLogRepository
{
    Task<SaveResult<PainLogEntity>> AddAsync(
        Guid corredorId,
        PainLog painLog,
        Guid idempotencyKey,
        CancellationToken cancellationToken);
}
