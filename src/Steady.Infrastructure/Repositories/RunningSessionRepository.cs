using Microsoft.EntityFrameworkCore;
using Steady.Domain.Adherence;
using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class RunningSessionRepository(SteadyDbContext dbContext) : IRunningSessionRepository
{
    public async Task<SaveResult<RunningSessionEntity>> AddAsync(
        Guid corredorId,
        RunningSession session,
        Guid idempotencyKey,
        bool painReportedAtCompletion,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.RunningSessions
            .FindByIdempotencyKeyAsync(corredorId, idempotencyKey, cancellationToken);

        if (existing is not null)
            return new SaveResult<RunningSessionEntity>(existing, Created: false);

        var entity = new RunningSessionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            IdempotencyKey = idempotencyKey,
            Date = session.Date,
            DistanceKm = session.DistanceKm,
            DurationMinutes = session.DurationMinutes,
            AveragePaceMinPerKm = session.AveragePaceMinPerKm,
            PerceivedEffort = session.PerceivedEffort
        };

        dbContext.RunningSessions.Add(entity);
        var activeSheetId = await dbContext.TrainingSheets
            .Where(sheet => sheet.CorredorId == corredorId && sheet.IsActive)
            .Select(sheet => (Guid?)sheet.Id)
            .SingleOrDefaultAsync(cancellationToken);
        dbContext.ReviewOutbox.Add(new ReviewOutboxEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            ExecutionId = entity.Id,
            TrainingSheetId = activeSheetId,
            ExecutionKind = WorkoutExecutionKind.Running,
            IdempotencyKey = idempotencyKey,
            ExecutionDate = session.Date,
            PainReportedAtCompletion = painReportedAtCompletion,
            Status = ReviewOutboxStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });
        if (painReportedAtCompletion)
        {
            dbContext.PainLogs.Add(new PainLogEntity
            {
                Id = Guid.NewGuid(),
                CorredorId = corredorId,
                Date = session.Date,
                Region = "Informada no encerramento",
                IdempotencyKey = idempotencyKey
            });
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        return new SaveResult<RunningSessionEntity>(entity, Created: true);
    }

    public async Task<IReadOnlyList<RunningSessionEntity>> GetByCorredorIdAsync(Guid corredorId, CancellationToken cancellationToken) =>
        await dbContext.RunningSessions
            .Where(s => s.CorredorId == corredorId)
            .ToListAsync(cancellationToken);

    public async Task<RunningSessionEntity?> GetByIdAsync(Guid corredorId, Guid sessionId, CancellationToken cancellationToken) =>
        await dbContext.RunningSessions
            .FirstOrDefaultAsync(s => s.CorredorId == corredorId && s.Id == sessionId, cancellationToken);
}
