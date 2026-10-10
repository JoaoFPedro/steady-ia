using Microsoft.EntityFrameworkCore;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class WorkoutReviewRepository(
    SteadyDbContext dbContext,
    ICoachingLinkRepository links) : IWorkoutReviewRepository
{
    public Task<WorkoutReviewEntity?> GetLatestAsync(Guid corredorId, CancellationToken cancellationToken) =>
        dbContext.WorkoutReviews
            .Where(review => review.CorredorId == corredorId)
            .OrderByDescending(review => review.ExecutionDate)
            .ThenByDescending(review => review.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<WorkoutReviewEntity?> GetByExecutionAsync(
        Guid corredorId, Guid executionId, CancellationToken cancellationToken) =>
        dbContext.WorkoutReviews.FirstOrDefaultAsync(
            review => review.CorredorId == corredorId && review.ExecutionId == executionId,
            cancellationToken);

    public async Task<WorkoutReviewEntity?> GetForPersonalAsync(
        Guid personalId, Guid corredorId, Guid executionId, CancellationToken cancellationToken)
    {
        if (!await links.HasActiveAsync(personalId, corredorId, cancellationToken)) return null;
        return await GetByExecutionAsync(corredorId, executionId, cancellationToken);
    }

    public async Task<IReadOnlyList<WorkoutReviewEntity>> GetByCorredorAsync(
        Guid corredorId, CancellationToken cancellationToken) =>
        await dbContext.WorkoutReviews
            .Where(review => review.CorredorId == corredorId)
            .OrderByDescending(review => review.ExecutionDate)
            .ThenByDescending(review => review.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<bool> MarkUnderstoodAsync(
        Guid corredorId, Guid reviewId, CancellationToken cancellationToken) =>
        UpdateAsync(corredorId, reviewId, review => review.UnderstoodAt ??= DateTime.UtcNow, cancellationToken);

    public Task<bool> MarkContestedAsync(
        Guid corredorId, Guid reviewId, CancellationToken cancellationToken) =>
        UpdateAsync(corredorId, reviewId, review => review.Contested = true, cancellationToken);

    private async Task<bool> UpdateAsync(
        Guid corredorId,
        Guid reviewId,
        Action<WorkoutReviewEntity> update,
        CancellationToken cancellationToken)
    {
        var review = await dbContext.WorkoutReviews.FirstOrDefaultAsync(
            item => item.Id == reviewId && item.CorredorId == corredorId, cancellationToken);
        if (review is null) return false;
        update(review);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
