using Microsoft.EntityFrameworkCore;
using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class StrengthSessionRepository(SteadyDbContext dbContext) : IStrengthSessionRepository
{
    public async Task<StrengthSessionEntity> AddAsync(Guid corredorId, StrengthSession session, CancellationToken cancellationToken)
    {
        var entity = new StrengthSessionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            Date = session.Date,
            MuscleGroup = session.MuscleGroup,
            Intensity = session.Intensity,
            DurationMinutes = session.DurationMinutes
        };

        dbContext.StrengthSessions.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return entity;
    }

    public async Task<IReadOnlyList<StrengthSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken) =>
        await dbContext.StrengthSessions
            .Where(s => s.CorredorId == corredorId)
            .ToListAsync(cancellationToken);

    public async Task<StrengthSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken) =>
        await dbContext.StrengthSessions
            .FirstOrDefaultAsync(s => s.CorredorId == corredorId && s.Id == sessionId, cancellationToken);
}
