using Microsoft.EntityFrameworkCore;
using Steady.Domain.Planning;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class PlanRequestRepository(SteadyDbContext dbContext) : IPlanRequestRepository
{
    public async Task<SaveResult<PlanRequestEntity>> AddAsync(
        Guid corredorId,
        PlanRequest request,
        Guid idempotencyKey,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.PlanRequests
            .FindByIdempotencyKeyAsync(corredorId, idempotencyKey, cancellationToken);

        if (existing is not null)
            return new SaveResult<PlanRequestEntity>(existing, Created: false);

        var entity = new PlanRequestEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            IdempotencyKey = idempotencyKey,
            CreatedAt = DateTime.UtcNow,
            RaceDistance = request.RaceDistance,
            RaceDate = request.RaceDate.ToString("yyyy-MM-dd"),
            RaceIsFirstTime = request.RaceIsFirstTime,
            LongestRecentRunKm = request.LongestRecentRunKm,
            TrainingDaysPerWeek = request.TrainingDaysPerWeek,
            CurrentWeeklyRunningDays = request.CurrentWeeklyRunningDays,
            ReferenceDistanceKm = request.ReferenceDistanceKm,
            ReferenceDuration = request.ReferenceDuration,
            StrengthSessionMinutes = request.StrengthSessionMinutes,
            EquipmentAccess = request.EquipmentAccess,
            RecurringPainAreas = request.RecurringPainAreas,
            PriorInjuries = request.PriorInjuries
        };

        dbContext.PlanRequests.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new SaveResult<PlanRequestEntity>(entity, Created: true);
    }

    public async Task<IReadOnlyList<PlanRequestEntity>> GetByCorredorIdAsync(
        Guid corredorId, CancellationToken cancellationToken) =>
        await dbContext.PlanRequests
            .Where(p => p.CorredorId == corredorId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<PlanRequestEntity?> GetByIdempotencyKeyAsync(
        Guid corredorId, Guid idempotencyKey, CancellationToken cancellationToken) =>
        dbContext.PlanRequests
            .FindByIdempotencyKeyAsync(corredorId, idempotencyKey, cancellationToken);
}
