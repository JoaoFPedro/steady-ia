using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface IWorkoutReviewRepository
{
    Task<WorkoutReviewEntity?> GetLatestAsync(Guid corredorId, CancellationToken cancellationToken);
    Task<WorkoutReviewEntity?> GetByExecutionAsync(
        Guid corredorId, Guid executionId, CancellationToken cancellationToken);
    Task<WorkoutReviewEntity?> GetForPersonalAsync(
        Guid personalId, Guid corredorId, Guid executionId, CancellationToken cancellationToken);
    Task<IReadOnlyList<WorkoutReviewEntity>> GetByCorredorAsync(
        Guid corredorId, CancellationToken cancellationToken);
    Task<bool> MarkUnderstoodAsync(Guid corredorId, Guid reviewId, CancellationToken cancellationToken);
    Task<bool> MarkContestedAsync(Guid corredorId, Guid reviewId, CancellationToken cancellationToken);
}
