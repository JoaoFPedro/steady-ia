using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Steady.Domain.Adherence;
using Steady.Domain.Coaching;
using Steady.Domain.Planning;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class ReviewOutboxProcessor(
    SteadyDbContext dbContext,
    IExplanationProvider explanationProvider)
{
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);

    public async Task<bool> ProcessNextAsync(CancellationToken cancellationToken)
    {
        var item = await AcquireAsync(cancellationToken);
        if (item is null) return false;

        try
        {
            await ProcessAsync(item, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            await RecalculateCoherenceAsync(item.CorredorId, cancellationToken);
            item.Status = ReviewOutboxStatus.Completed;
            item.CompletedAt = DateTime.UtcNow;
            item.LeaseUntil = null;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            item.Status = ReviewOutboxStatus.Pending;
            item.LeaseUntil = null;
            item.NextAttemptAt = DateTime.UtcNow.AddSeconds(Math.Min(60, Math.Pow(2, item.Attempts)));
            await dbContext.SaveChangesAsync(cancellationToken);
            throw;
        }

        return true;
    }

    private async Task<ReviewOutboxEntity?> AcquireAsync(CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var item = await dbContext.ReviewOutbox
            .FromSqlInterpolated($"""
                SELECT * FROM review_outbox
                WHERE (status = 'Pending' AND (next_attempt_at IS NULL OR next_attempt_at <= {now}))
                   OR (status = 'Processing' AND lease_until < {now})
                ORDER BY created_at
                FOR UPDATE SKIP LOCKED
                LIMIT 1
                """)
            .SingleOrDefaultAsync(cancellationToken);
        if (item is null)
        {
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        item.Status = ReviewOutboxStatus.Processing;
        item.Attempts++;
        item.LeaseUntil = now.Add(LeaseDuration);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return item;
    }

    private async Task ProcessAsync(ReviewOutboxEntity item, CancellationToken cancellationToken)
    {
        var exists = await dbContext.WorkoutReviews.AnyAsync(
            review => review.ExecutionKind == item.ExecutionKind && review.ExecutionId == item.ExecutionId,
            cancellationToken);
        if (exists) return;

        var policyEntity = await dbContext.AdherencePolicyVersions.SingleOrDefaultAsync(
            policy => policy.IsCurrent, cancellationToken)
            ?? throw new InvalidOperationException("Nenhuma política de aderência vigente (ADR-015).");
        var policy = AdherencePolicyVersion.Create(
            policyEntity.Version,
            policyEntity.RunningDistancePercent,
            policyEntity.RunningDurationPercent,
            policyEntity.PerceivedEffortPoints,
            policyEntity.SetsAbsolute,
            policyEntity.RepetitionsPercent,
            policyEntity.LoadPercent);

        var comparison = item.ExecutionKind switch
        {
            WorkoutExecutionKind.Running => await CompareRunningAsync(item, policy, cancellationToken),
            WorkoutExecutionKind.Strength => await CompareStrengthAsync(item, policy, cancellationToken),
            WorkoutExecutionKind.Combined => await CompareCombinedAsync(item, policy, cancellationToken),
            _ => throw new InvalidOperationException("Tipo de execução desconhecido.")
        };

        if (comparison.Status == WorkoutAdherenceStatus.Adherent) return;

        var action = SafetyPolicy.Authorize(
            comparison.Status,
            comparison.Facts.Any(fact => fact.Status != FieldAdherenceStatus.NotComparable),
            item.PainReportedAtCompletion,
            comparison.PrescribedLoad,
            comparison.ExecutedLoad,
            overloadAlreadyDetected: false);
        var explanationStatus = action is null ? ExplanationStatus.Unavailable : ExplanationStatus.Pending;
        string? explanationJson = null;

        if (action is not null)
        {
            try
            {
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(15));
                var generated = await explanationProvider.ExplainAsync(
                    new ExplanationContext(comparison.Modality, comparison.Facts, action.Value,
                        item.PainReportedAtCompletion), timeout.Token);
                if (generated is not null)
                {
                    var review = WorkoutReview.Create(
                        Guid.NewGuid(), item.ExecutionId, item.ExecutionKind, item.ExecutionDate,
                        comparison.Status, action, policy.Version, comparison.PlanVersion,
                        item.TrainingSheetId, comparison.SnapshotJson, DateTime.UtcNow);
                    var allowedNumbers = comparison.Facts
                        .SelectMany(fact => new[]
                            { fact.PrescribedMin, fact.PrescribedMax, fact.Executed, fact.Difference })
                        .Where(number => number is not null)
                        .Select(number => number!.Value)
                        .ToArray();
                    var validation = review.TrySetExplanation(generated, allowedNumbers);
                    if (validation.Accepted)
                    {
                        explanationStatus = ExplanationStatus.Available;
                        explanationJson = JsonSerializer.Serialize(generated);
                    }
                    else
                    {
                        explanationStatus = ExplanationStatus.Unavailable;
                    }
                }
                else
                {
                    explanationStatus = ExplanationStatus.Unavailable;
                }
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                explanationStatus = ExplanationStatus.Unavailable;
            }
            catch
            {
                explanationStatus = ExplanationStatus.Unavailable;
            }
        }

        dbContext.WorkoutReviews.Add(new WorkoutReviewEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = item.CorredorId,
            ExecutionId = item.ExecutionId,
            ExecutionKind = item.ExecutionKind,
            ExecutionDate = item.ExecutionDate,
            Status = comparison.Status,
            Action = action,
            PolicyVersion = policy.Version,
            PlanVersion = comparison.PlanVersion,
            TrainingSheetId = item.TrainingSheetId,
            ComparisonJson = comparison.SnapshotJson,
            ExplanationStatus = explanationStatus,
            ExplanationJson = explanationJson,
            CoherenceStatus = CoherenceStatus.Unknown,
            CreatedAt = DateTime.UtcNow
        });
    }

    private async Task<ComparisonEnvelope> CompareRunningAsync(
        ReviewOutboxEntity item,
        AdherencePolicyVersion policy,
        CancellationToken cancellationToken)
    {
        var execution = await dbContext.RunningSessions.SingleAsync(
            run => run.Id == item.ExecutionId && run.CorredorId == item.CorredorId,
            cancellationToken);
        var sources = await ResolveRunningSourcesAsync(item, cancellationToken);
        if (sources.Conflict)
            return ComparisonEnvelope.Conflict("running", sources.PlanVersion);

        var result = WorkoutAdherenceComparer.CompareRunning(
            sources.Prescription ?? RunningAdherencePrescription.Create(null, null, null),
            new RunningAdherenceExecution(true, execution.DistanceKm, execution.DurationMinutes,
                execution.PerceivedEffort),
            policy);
        var facts = RunningFacts(result);
        var prescribedLoad = sources.Prescription?.DurationMinutes is { } duration &&
                             sources.Prescription.PerceivedEffort is { } effort
            ? (duration.Max ?? duration.Min) * (effort.Max ?? effort.Min)
            : (double?)null;
        return ComparisonEnvelope.Create(
            "running", result.Status, facts, prescribedLoad,
            execution.DurationMinutes * execution.PerceivedEffort, sources.PlanVersion);
    }

    private async Task<ComparisonEnvelope> CompareStrengthAsync(
        ReviewOutboxEntity item,
        AdherencePolicyVersion policy,
        CancellationToken cancellationToken)
    {
        var entity = await dbContext.StrengthWorkoutExecutions.SingleAsync(
            execution => execution.Id == item.ExecutionId && execution.CorredorId == item.CorredorId,
            cancellationToken);
        return await CompareStrengthEntityAsync(entity, policy, cancellationToken);
    }

    private async Task<ComparisonEnvelope> CompareCombinedAsync(
        ReviewOutboxEntity item,
        AdherencePolicyVersion policy,
        CancellationToken cancellationToken)
    {
        var strength = await dbContext.StrengthWorkoutExecutions.SingleAsync(
            execution => execution.Id == item.ExecutionId && execution.CorredorId == item.CorredorId,
            cancellationToken);
        var running = await dbContext.RunningSessions.SingleAsync(
            run => run.CorredorId == item.CorredorId && run.IdempotencyKey == item.IdempotencyKey,
            cancellationToken);
        var strengthResult = await CompareStrengthEntityAsync(strength, policy, cancellationToken);
        var runningItem = new ReviewOutboxEntity
        {
            CorredorId = item.CorredorId,
            ExecutionId = running.Id,
            ExecutionDate = item.ExecutionDate,
            TrainingSheetId = item.TrainingSheetId
        };
        var runningResult = await CompareRunningAsync(runningItem, policy, cancellationToken);
        var status = new[] { strengthResult.Status, runningResult.Status }.Contains(WorkoutAdherenceStatus.PrescriptionConflict)
            ? WorkoutAdherenceStatus.PrescriptionConflict
            : new[] { strengthResult.Status, runningResult.Status }.Contains(WorkoutAdherenceStatus.Divergent)
                ? WorkoutAdherenceStatus.Divergent
                : WorkoutAdherenceStatus.Adherent;
        return ComparisonEnvelope.Create(
            "combined", status, strengthResult.Facts.Concat(runningResult.Facts).ToArray(),
            Sum(strengthResult.PrescribedLoad, runningResult.PrescribedLoad),
            Sum(strengthResult.ExecutedLoad, runningResult.ExecutedLoad),
            runningResult.PlanVersion);
    }

    private async Task<ComparisonEnvelope> CompareStrengthEntityAsync(
        StrengthWorkoutExecutionEntity entity,
        AdherencePolicyVersion policy,
        CancellationToken cancellationToken)
    {
        var sheetEntity = await dbContext.TrainingSheets.SingleAsync(
            sheet => sheet.Id == entity.TrainingSheetId && sheet.CorredorId == entity.CorredorId,
            cancellationToken);
        var sheet = TrainingSheetDocuments.DeserializeSheet(sheetEntity.Id, sheetEntity.DefinitionJson);
        var prescribed = ((StrengthWorkout)sheet.Workout(entity.WorkoutType)).Exercises;
        var executed = TrainingSheetDocuments.DeserializeExecution(entity.DetailsJson);
        var history = await dbContext.StrengthWorkoutExecutions
            .Where(previous => previous.CorredorId == entity.CorredorId &&
                               previous.CreatedAt < entity.CreatedAt)
            .OrderBy(previous => previous.CreatedAt)
            .Select(previous => previous.DetailsJson)
            .ToListAsync(cancellationToken);
        var prior = history.SelectMany(TrainingSheetDocuments.DeserializeExecution).ToArray();
        var facts = new List<ExplanationFact>();
        double prescribedLoad = 0;
        double executedLoad = 0;
        var hasPrescribedLoad = false;
        var status = WorkoutAdherenceStatus.Adherent;

        for (var exerciseIndex = 0; exerciseIndex < prescribed.Count; exerciseIndex++)
        {
            var prescription = prescribed[exerciseIndex];
            var execution = executed.Single(item => item.ExerciseKey == prescription.ExerciseKey);
            var loads = prior.Where(item => item.ExerciseKey == prescription.ExerciseKey && !item.Skipped)
                .Select(item => item.LoadKg!.Value)
                .OrderBy(load => load)
                .ToArray();
            var median = Median(loads);
            var result = WorkoutAdherenceComparer.CompareStrengthExercise(
                StrengthExerciseAdherencePrescription.Create(
                    prescription.ExerciseKey, prescription.Name, prescription.Sets, prescription.Repetitions),
                execution.Skipped
                    ? StrengthExerciseAdherenceExecution.Skipped(
                        execution.ExerciseKey, execution.Name, execution.Sets, execution.Repetitions)
                    : StrengthExerciseAdherenceExecution.Executed(
                        execution.ExerciseKey, execution.Name, execution.Sets, execution.Repetitions,
                        execution.LoadKg!.Value),
                median,
                policy);
            if (result.Status == WorkoutAdherenceStatus.Divergent) status = WorkoutAdherenceStatus.Divergent;
            facts.AddRange(StrengthFacts(exerciseIndex, result));
            if (median is not null)
            {
                hasPrescribedLoad = true;
                prescribedLoad += (double)median.Value;
            }
            if (execution.LoadKg is not null) executedLoad += (double)execution.LoadKg.Value;
        }

        return ComparisonEnvelope.Create(
            "strength", status, facts,
            hasPrescribedLoad ? prescribedLoad : null,
            executedLoad,
            planVersion: null);
    }

    private async Task<RunningSources> ResolveRunningSourcesAsync(
        ReviewOutboxEntity item, CancellationToken cancellationToken)
    {
        var corredor = await dbContext.Corredores.SingleAsync(
            runner => runner.Id == item.CorredorId, cancellationToken);
        var planEntity = await dbContext.TrainingPlanVersions.SingleAsync(
            plan => plan.Id == corredor.TrainingPlanVersionId, cancellationToken);
        var plan = SteadyTrainingPlanDocuments.Deserialize(planEntity.Version, planEntity.DefinitionJson);
        var planRun = plan.WeekPlan[WeekIndex(item.ExecutionDate.DayOfWeek)].Run;
        var planPrescription = FromRun(planRun);

        RunningAdherencePrescription? sheetPrescription = null;
        if (item.TrainingSheetId is { } sheetId)
        {
            var sheetEntity = await dbContext.TrainingSheets.SingleOrDefaultAsync(
                sheet => sheet.Id == sheetId && sheet.CorredorId == item.CorredorId,
                cancellationToken);
            if (sheetEntity is not null)
            {
                var sheet = TrainingSheetDocuments.DeserializeSheet(sheetEntity.Id, sheetEntity.DefinitionJson);
                var run = (RunningWorkout)sheet.Workout(WorkoutType.Run);
                sheetPrescription = FromRun(item.ExecutionDate.DayOfWeek switch
                {
                    DayOfWeek.Tuesday => run.Tuesday,
                    DayOfWeek.Thursday => run.Thursday,
                    DayOfWeek.Saturday => run.Saturday,
                    _ => null
                });
            }
        }

        if (planPrescription is not null && sheetPrescription is not null)
        {
            var resolved = WorkoutAdherenceComparer.ResolveRunningPrescription(
                planPrescription, sheetPrescription);
            return new RunningSources(resolved.HasConflict, resolved.Prescription, planEntity.Version);
        }

        return new RunningSources(false, planPrescription ?? sheetPrescription, planEntity.Version);
    }

    private static RunningAdherencePrescription? FromRun(RunPrescription? run) => run is null
        ? null
        : RunningAdherencePrescription.Create(run.DistanceKm, run.DurationMinutes, run.PerceivedEffort);

    private static int WeekIndex(DayOfWeek day) => ((int)day + 6) % 7;

    private static IReadOnlyList<ExplanationFact> RunningFacts(RunningAdherenceResult result) =>
        [
            Fact("running.completion", result.Completion),
            Fact("running.distanceKm", result.Distance),
            Fact("running.durationMinutes", result.Duration),
            Fact("running.perceivedEffort", result.PerceivedEffort)
        ];

    private static IEnumerable<ExplanationFact> StrengthFacts(
        int exerciseIndex, StrengthExerciseAdherenceResult result) =>
        [
            Fact($"strength.exercise{exerciseIndex}.completion", result.Completion),
            Fact($"strength.exercise{exerciseIndex}.sets", result.Sets),
            Fact($"strength.exercise{exerciseIndex}.repetitions", result.Repetitions),
            Fact($"strength.exercise{exerciseIndex}.loadKg", result.Load)
        ];

    private static ExplanationFact Fact(string name, FieldComparison comparison) =>
        new(name, comparison.PrescribedMin, comparison.PrescribedMax,
            comparison.Executed, comparison.Difference, comparison.Status);

    private static decimal? Median(IReadOnlyList<decimal> values)
    {
        if (values.Count == 0) return null;
        var middle = values.Count / 2;
        return values.Count % 2 == 1 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    }

    private static double? Sum(double? left, double? right) =>
        left is null && right is null ? null : (left ?? 0) + (right ?? 0);

    private async Task RecalculateCoherenceAsync(Guid corredorId, CancellationToken cancellationToken)
    {
        var policyVersion = await dbContext.AdherencePolicyVersions
            .Where(policy => policy.IsCurrent)
            .Select(policy => policy.Version)
            .SingleAsync(cancellationToken);
        var reviews = await dbContext.WorkoutReviews
            .Where(review => review.CorredorId == corredorId && review.Action != null)
            .OrderBy(review => review.ExecutionDate)
            .ToListAsync(cancellationToken);
        var runs = await dbContext.RunningSessions
            .Where(run => run.CorredorId == corredorId)
            .Select(run => new ExecutionPoint(
                run.Id, WorkoutExecutionKind.Running, run.Date,
                run.DurationMinutes * run.PerceivedEffort))
            .ToListAsync(cancellationToken);
        var strengthEntities = await dbContext.StrengthWorkoutExecutions
            .Where(execution => execution.CorredorId == corredorId)
            .ToListAsync(cancellationToken);
        var strength = strengthEntities.Select(execution => new ExecutionPoint(
            execution.Id,
            WorkoutExecutionKind.Strength,
            DateOnly.Parse(execution.Date),
            (double)TrainingSheetDocuments.DeserializeExecution(execution.DetailsJson)
                .Where(item => !item.Skipped)
                .Sum(item => item.LoadKg ?? 0))).ToArray();
        var executions = runs.Concat(strength)
            .OrderBy(execution => execution.Date)
            .ThenBy(execution => execution.Id)
            .ToArray();

        foreach (var review in reviews)
        {
            var next = executions.FirstOrDefault(execution => execution.Date > review.ExecutionDate);
            if (next is null)
            {
                review.CoherenceStatus = CoherenceStatus.Unknown;
                review.NextExecutionId = null;
                review.CoherencePolicyVersion = null;
                review.CoherenceEvaluatedAt = null;
                continue;
            }

            var coherent = review.Action switch
            {
                AuthorizedAction.Maintain => !await dbContext.WorkoutReviews.AnyAsync(
                    candidate => candidate.CorredorId == corredorId &&
                                 candidate.ExecutionId == next.Id &&
                                 candidate.Status == WorkoutAdherenceStatus.Divergent,
                    cancellationToken),
                AuthorizedAction.ReduceLoad or AuthorizedAction.PrioritizeRecovery =>
                    next.Load < await ExecutionLoadAsync(review, cancellationToken),
                _ => false
            };
            review.CoherenceStatus = coherent ? CoherenceStatus.Coherent : CoherenceStatus.NotCoherent;
            review.NextExecutionId = next.Id;
            review.CoherencePolicyVersion = policyVersion;
            review.CoherenceEvaluatedAt = DateTime.UtcNow;
        }
    }

    private async Task<double> ExecutionLoadAsync(
        WorkoutReviewEntity review, CancellationToken cancellationToken)
    {
        if (review.ExecutionKind == WorkoutExecutionKind.Running)
        {
            var run = await dbContext.RunningSessions.SingleAsync(
                item => item.Id == review.ExecutionId, cancellationToken);
            return run.DurationMinutes * run.PerceivedEffort;
        }

        var strength = await dbContext.StrengthWorkoutExecutions.SingleAsync(
            item => item.Id == review.ExecutionId, cancellationToken);
        var strengthLoad = (double)TrainingSheetDocuments.DeserializeExecution(strength.DetailsJson)
            .Where(item => !item.Skipped)
            .Sum(item => item.LoadKg ?? 0);
        if (review.ExecutionKind != WorkoutExecutionKind.Combined) return strengthLoad;

        var outbox = await dbContext.ReviewOutbox.SingleAsync(
            item => item.ExecutionKind == WorkoutExecutionKind.Combined &&
                    item.ExecutionId == review.ExecutionId,
            cancellationToken);
        var runPart = await dbContext.RunningSessions.SingleAsync(
            item => item.CorredorId == review.CorredorId &&
                    item.IdempotencyKey == outbox.IdempotencyKey,
            cancellationToken);
        return strengthLoad + runPart.DurationMinutes * runPart.PerceivedEffort;
    }

    private sealed record ExecutionPoint(
        Guid Id, WorkoutExecutionKind Kind, DateOnly Date, double Load);

    private sealed record RunningSources(
        bool Conflict, RunningAdherencePrescription? Prescription, int PlanVersion);

    private sealed record ComparisonEnvelope(
        string Modality,
        WorkoutAdherenceStatus Status,
        IReadOnlyList<ExplanationFact> Facts,
        double? PrescribedLoad,
        double? ExecutedLoad,
        int? PlanVersion,
        string SnapshotJson)
    {
        public static ComparisonEnvelope Create(
            string modality,
            WorkoutAdherenceStatus status,
            IReadOnlyList<ExplanationFact> facts,
            double? prescribedLoad,
            double? executedLoad,
            int? planVersion) =>
            new(modality, status, facts, prescribedLoad, executedLoad, planVersion,
                JsonSerializer.Serialize(new { modality, status, facts }));

        public static ComparisonEnvelope Conflict(string modality, int? planVersion) =>
            Create(modality, WorkoutAdherenceStatus.PrescriptionConflict, [], null, null, planVersion);
    }
}
