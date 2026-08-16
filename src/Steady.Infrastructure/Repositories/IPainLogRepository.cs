using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IPainLogRepository
{
    Task<PainLogEntity> AddAsync(Guid corredorId, PainLog painLog, CancellationToken cancellationToken);
}
