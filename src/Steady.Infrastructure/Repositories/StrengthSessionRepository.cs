using Microsoft.EntityFrameworkCore;
using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class StrengthSessionRepository(SteadyDbContext dbContext) : IStrengthSessionRepository
{
    public async Task<SaveResult<StrengthSessionEntity>> AddAsync(
        Guid corredorId,
        StrengthSession session,
        Guid idempotencyKey,
        bool painReported,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.StrengthSessions
            .FindByIdempotencyKeyAsync(corredorId, idempotencyKey, cancellationToken);

        if (existing is not null)
            return new SaveResult<StrengthSessionEntity>(existing, Created: false);

        var entity = new StrengthSessionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            IdempotencyKey = idempotencyKey,
            Date = session.Date,
            MuscleGroup = session.MuscleGroup,
            Intensity = session.Intensity,
            DurationMinutes = session.DurationMinutes
        };

        dbContext.StrengthSessions.Add(entity);
        if (painReported)
        {
            dbContext.PainLogs.Add(new PainLogEntity
            {
                Id = Guid.NewGuid(),
                CorredorId = corredorId,
                IdempotencyKey = idempotencyKey,
                Date = session.Date,
                Region = "Informada no encerramento"
            });
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        return new SaveResult<StrengthSessionEntity>(entity, Created: true);
    }

    public async Task<IReadOnlyList<StrengthSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken) =>
        await dbContext.StrengthSessions
            .Where(s => s.CorredorId == corredorId)
            .ToListAsync(cancellationToken);

    public async Task<StrengthSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken) =>
        await dbContext.StrengthSessions
            .FirstOrDefaultAsync(s => s.CorredorId == corredorId && s.Id == sessionId, cancellationToken);
}
