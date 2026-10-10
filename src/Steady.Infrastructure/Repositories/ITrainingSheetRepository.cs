using Steady.Domain.Coaching;
using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed record ActiveTrainingSheet(
    TrainingSheetEntity Entity,
    TrainingSheet Sheet,
    IReadOnlyDictionary<Guid, decimal?> SuggestedLoads);
public sealed record CombinedWorkoutSaveResult(
    StrengthWorkoutExecutionEntity Strength,
    RunningSessionEntity Running,
    bool Created);

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
        bool painReportedAtCompletion,
        CancellationToken cancellationToken);
    Task<CombinedWorkoutSaveResult> AddCombinedExecutionAsync(
        Guid corredorId,
        StrengthWorkoutExecution strength,
        RunningSession running,
        Guid idempotencyKey,
        bool painReportedAtCompletion,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<StrengthWorkoutExecutionEntity>> GetHistoryAsync(
        Guid personalId, Guid corredorId, CancellationToken cancellationToken);
    /// <summary>
    /// As execuções do próprio corredor. Diferente de <see cref="GetHistoryAsync"/>,
    /// que é a leitura do personal e exige vínculo: aqui o dono é quem pergunta.
    /// </summary>
    Task<IReadOnlyList<StrengthWorkoutExecutionEntity>> GetExecutionsForRunnerAsync(
        Guid corredorId, CancellationToken cancellationToken);
}
