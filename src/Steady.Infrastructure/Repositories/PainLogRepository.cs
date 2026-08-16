using Microsoft.EntityFrameworkCore;
using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class PainLogRepository(SteadyDbContext dbContext) : IPainLogRepository
{
    public async Task<SaveResult<PainLogEntity>> AddAsync(
        Guid corredorId,
        PainLog painLog,
        Guid idempotencyKey,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.PainLogs
            .FindByIdempotencyKeyAsync(corredorId, idempotencyKey, cancellationToken);

        if (existing is not null)
            return new SaveResult<PainLogEntity>(existing, Created: false);

        var entity = new PainLogEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            IdempotencyKey = idempotencyKey,
            Date = painLog.Date,
            Region = painLog.Region
        };

        dbContext.PainLogs.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new SaveResult<PainLogEntity>(entity, Created: true);
    }
}
