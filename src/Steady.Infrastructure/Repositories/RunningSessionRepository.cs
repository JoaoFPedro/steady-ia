using Microsoft.EntityFrameworkCore;
using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class RunningSessionRepository(SteadyDbContext dbContext) : IRunningSessionRepository
{
    public async Task<RunningSessionEntity> AddAsync(Guid corredorId, RunningSession session, CancellationToken cancellationToken)
    {
        var entity = new RunningSessionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            Date = session.Date,
            DistanceKm = session.DistanceKm,
            DurationMinutes = session.DurationMinutes,
            AveragePaceMinPerKm = session.AveragePaceMinPerKm,
            PerceivedEffort = session.PerceivedEffort
        };

        dbContext.RunningSessions.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return entity;
    }

    public async Task<IReadOnlyList<RunningSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken) =>
        await dbContext.RunningSessions
            .Where(s => s.CorredorId == corredorId)
            .ToListAsync(cancellationToken);

    public async Task<RunningSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken) =>
        await dbContext.RunningSessions
            .FirstOrDefaultAsync(s => s.CorredorId == corredorId && s.Id == sessionId, cancellationToken);
}
