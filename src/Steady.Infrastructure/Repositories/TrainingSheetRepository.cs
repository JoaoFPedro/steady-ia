using Microsoft.EntityFrameworkCore;
using Steady.Domain.Adherence;
using Steady.Domain.Coaching;
using Steady.Domain.Training;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class TrainingSheetRepository(
    SteadyDbContext dbContext,
    ICoachingLinkRepository linkRepository) : ITrainingSheetRepository
{
    public async Task<TrainingSheetEntity> PublishAsync(
        Guid personalId,
        Guid corredorId,
        TrainingSheet sheet,
        CancellationToken cancellationToken)
    {
        if (!await linkRepository.HasActiveAsync(personalId, corredorId, cancellationToken))
            throw new UnauthorizedAccessException("O vínculo ativo é obrigatório.");

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var current = await dbContext.TrainingSheets
            .Where(item => item.CorredorId == corredorId && item.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var active in current)
            active.IsActive = false;

        var entity = new TrainingSheetEntity
        {
            Id = sheet.Id,
            PersonalId = personalId,
            CorredorId = corredorId,
            DefinitionJson = TrainingSheetDocuments.Serialize(sheet),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.TrainingSheets.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return entity;
    }

    public async Task<ActiveTrainingSheet?> GetActiveAsync(
        Guid corredorId, CancellationToken cancellationToken)
    {
        var entity = await dbContext.TrainingSheets.FirstOrDefaultAsync(
            item => item.CorredorId == corredorId && item.IsActive,
            cancellationToken);

        if (entity is null)
            return null;

        var sheet = TrainingSheetDocuments.DeserializeSheet(entity.Id, entity.DefinitionJson);
        var executions = await dbContext.StrengthWorkoutExecutions
            .Where(item => item.CorredorId == corredorId && item.TrainingSheetId == entity.Id)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        var suggestions = new Dictionary<Guid, decimal?>();
        foreach (var execution in executions)
        {
            foreach (var exercise in TrainingSheetDocuments.DeserializeExecution(execution.DetailsJson))
                suggestions.TryAdd(exercise.ExerciseId, exercise.Skipped ? null : exercise.LoadKg);
        }

        return new ActiveTrainingSheet(entity, sheet, suggestions);
    }

    public Task<TrainingSheetEntity?> GetByIdForRunnerAsync(
        Guid sheetId, Guid corredorId, CancellationToken cancellationToken) =>
        dbContext.TrainingSheets.FirstOrDefaultAsync(
            item => item.Id == sheetId && item.CorredorId == corredorId,
            cancellationToken);

    public async Task<SaveResult<StrengthWorkoutExecutionEntity>> AddExecutionAsync(
        Guid corredorId,
        StrengthWorkoutExecution execution,
        Guid idempotencyKey,
        bool painReportedAtCompletion,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.StrengthWorkoutExecutions.FirstOrDefaultAsync(
            item => item.CorredorId == corredorId && item.IdempotencyKey == idempotencyKey,
            cancellationToken);

        if (existing is not null)
            return new SaveResult<StrengthWorkoutExecutionEntity>(existing, Created: false);

        var entity = new StrengthWorkoutExecutionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            TrainingSheetId = execution.TrainingSheetId,
            WorkoutType = execution.WorkoutType,
            Date = execution.Date.ToString("yyyy-MM-dd"),
            DetailsJson = TrainingSheetDocuments.Serialize(execution),
            IdempotencyKey = idempotencyKey,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.StrengthWorkoutExecutions.Add(entity);
        AddReviewOutbox(
            corredorId, entity.Id, WorkoutExecutionKind.Strength, idempotencyKey,
            execution.Date, painReportedAtCompletion, execution.TrainingSheetId);
        AddCompletionPain(corredorId, execution.Date, idempotencyKey, painReportedAtCompletion);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new SaveResult<StrengthWorkoutExecutionEntity>(entity, Created: true);
    }

    public async Task<CombinedWorkoutSaveResult> AddCombinedExecutionAsync(
        Guid corredorId,
        StrengthWorkoutExecution strength,
        RunningSession running,
        Guid idempotencyKey,
        bool painReportedAtCompletion,
        CancellationToken cancellationToken)
    {
        var existingStrength = await dbContext.StrengthWorkoutExecutions.FirstOrDefaultAsync(
            item => item.CorredorId == corredorId && item.IdempotencyKey == idempotencyKey,
            cancellationToken);
        var existingRunning = await dbContext.RunningSessions.FirstOrDefaultAsync(
            item => item.CorredorId == corredorId && item.IdempotencyKey == idempotencyKey,
            cancellationToken);

        if (existingStrength is not null && existingRunning is not null)
            return new CombinedWorkoutSaveResult(existingStrength, existingRunning, Created: false);

        if (existingStrength is not null || existingRunning is not null)
            throw new InvalidOperationException("Registro combinado parcialmente persistido.");

        var strengthEntity = new StrengthWorkoutExecutionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            TrainingSheetId = strength.TrainingSheetId,
            WorkoutType = strength.WorkoutType,
            Date = strength.Date.ToString("yyyy-MM-dd"),
            DetailsJson = TrainingSheetDocuments.Serialize(strength),
            IdempotencyKey = idempotencyKey,
            CreatedAt = DateTime.UtcNow
        };
        var runningEntity = new RunningSessionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            IdempotencyKey = idempotencyKey,
            Date = running.Date,
            DistanceKm = running.DistanceKm,
            DurationMinutes = running.DurationMinutes,
            AveragePaceMinPerKm = running.AveragePaceMinPerKm,
            PerceivedEffort = running.PerceivedEffort
        };

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        dbContext.StrengthWorkoutExecutions.Add(strengthEntity);
        dbContext.RunningSessions.Add(runningEntity);
        AddReviewOutbox(
            corredorId, strengthEntity.Id, WorkoutExecutionKind.Combined, idempotencyKey,
            strength.Date, painReportedAtCompletion, strength.TrainingSheetId);
        AddCompletionPain(corredorId, strength.Date, idempotencyKey, painReportedAtCompletion);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new CombinedWorkoutSaveResult(strengthEntity, runningEntity, Created: true);
    }

    public async Task<IReadOnlyList<StrengthWorkoutExecutionEntity>> GetHistoryAsync(
        Guid personalId, Guid corredorId, CancellationToken cancellationToken)
    {
        if (!await linkRepository.HasActiveAsync(personalId, corredorId, cancellationToken))
            return [];

        return await dbContext.StrengthWorkoutExecutions
            .Where(item => item.CorredorId == corredorId)
            .OrderByDescending(item => item.Date)
            .ThenByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StrengthWorkoutExecutionEntity>> GetExecutionsForRunnerAsync(
        Guid corredorId, CancellationToken cancellationToken) =>
        // Filtro por CorredorId na query, nunca em memória (ADR-002).
        await dbContext.StrengthWorkoutExecutions
            .Where(item => item.CorredorId == corredorId)
            .OrderByDescending(item => item.Date)
            .ThenByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

    private void AddReviewOutbox(
        Guid corredorId,
        Guid executionId,
        WorkoutExecutionKind kind,
        Guid idempotencyKey,
        DateOnly executionDate,
        bool painReportedAtCompletion,
        Guid trainingSheetId) =>
        dbContext.ReviewOutbox.Add(new ReviewOutboxEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            ExecutionId = executionId,
            TrainingSheetId = trainingSheetId,
            ExecutionKind = kind,
            IdempotencyKey = idempotencyKey,
            ExecutionDate = executionDate,
            PainReportedAtCompletion = painReportedAtCompletion,
            Status = ReviewOutboxStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });

    private void AddCompletionPain(
        Guid corredorId, DateOnly date, Guid idempotencyKey, bool painReportedAtCompletion)
    {
        if (!painReportedAtCompletion) return;
        dbContext.PainLogs.Add(new PainLogEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredorId,
            Date = date,
            Region = "Informada no encerramento",
            IdempotencyKey = idempotencyKey
        });
    }
}
