using Steady.Domain.Coaching;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed record ActiveTrainingSheet(
    TrainingSheetEntity Entity,
    TrainingSheet Sheet,
    IReadOnlyDictionary<Guid, decimal?> SuggestedLoads);

public interface ITrainingSheetRepository
{
    Task<TrainingSheetEntity> PublishAsync(
        Guid personalId, Guid corredorId, TrainingSheet sheet, CancellationToken cancellationToken);
    Task<ActiveTrainingSheet?> GetActiveAsync(Guid corredorId, CancellationToken cancellationToken);
    Task<TrainingSheetEntity?> GetByIdForRunnerAsync(
        Guid sheetId, Guid corredorId, CancellationToken cancellationToken);
    Task<SaveResult<StrengthWorkoutExecutionEntity>> AddExecutionAsync(
        Guid corredorId,
        StrengthWorkoutExecution execution,
        Guid idempotencyKey,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<StrengthWorkoutExecutionEntity>> GetHistoryAsync(
        Guid personalId, Guid corredorId, CancellationToken cancellationToken);
}

