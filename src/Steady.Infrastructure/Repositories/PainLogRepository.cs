using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class PainLogRepository(SteadyDbContext dbContext) : IPainLogRepository
{
    public async Task<PainLogEntity> AddAsync(Guid corredorId, PainLog painLog, CancellationToken cancellationToken)
    {
        var entity = new PainLogEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            Date = painLog.Date,
            Region = painLog.Region
        };

        dbContext.PainLogs.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return entity;
    }
}
