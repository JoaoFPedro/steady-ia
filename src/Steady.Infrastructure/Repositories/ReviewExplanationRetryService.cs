using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Steady.Domain.Adherence;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class ReviewExplanationRetryService(
    SteadyDbContext dbContext,
    IExplanationProvider provider,
    ILogger<ReviewExplanationRetryService> logger)
{
    public async Task<bool> RetryAsync(Guid corredorId, Guid reviewId, CancellationToken cancellationToken)
    {
        var entity = await dbContext.WorkoutReviews.SingleOrDefaultAsync(
            review => review.Id == reviewId && review.CorredorId == corredorId, cancellationToken);
        if (entity is null) return false;
        if (entity.Action is null) return true;

        var snapshot = JsonSerializer.Deserialize<ReviewSnapshot>(
            entity.ComparisonJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("Snapshot da revisão inválido.");

        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(15));
            var explanation = await provider.ExplainAsync(
                new ExplanationContext(snapshot.Modality, snapshot.Facts, entity.Action.Value,
                    entity.Action == AuthorizedAction.PrioritizeRecovery), timeout.Token);
            if (explanation is null)
            {
                entity.ExplanationStatus = ExplanationStatus.Unavailable;
                await dbContext.SaveChangesAsync(cancellationToken);
                return true;
            }

            var review = WorkoutReview.Create(
                entity.Id, entity.ExecutionId, entity.ExecutionKind, entity.ExecutionDate,
                entity.Status, entity.Action, entity.PolicyVersion, entity.PlanVersion,
                entity.TrainingSheetId, entity.ComparisonJson, entity.CreatedAt);
            var allowedNumbers = snapshot.Facts
                .SelectMany(fact => new[] { fact.PrescribedMin, fact.PrescribedMax, fact.Executed, fact.Difference })
                .Where(number => number is not null).Select(number => number!.Value).ToArray();
            var validation = review.TrySetExplanation(explanation, allowedNumbers);
            if (validation.Accepted)
            {
                entity.ExplanationJson = JsonSerializer.Serialize(explanation);
                entity.ExplanationStatus = ExplanationStatus.Available;
            }
            else
            {
                entity.ExplanationJson = null;
                entity.ExplanationStatus = ExplanationStatus.Unavailable;
                logger.LogWarning(
                    "review.explanation_rejected review_id={ReviewId} policy_version={PolicyVersion} reason={Reason}",
                    entity.Id, entity.PolicyVersion, validation.Reason);
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            entity.ExplanationStatus = ExplanationStatus.Unavailable;
        }
        catch (Exception exception)
        {
            entity.ExplanationStatus = ExplanationStatus.Unavailable;
            logger.LogWarning(exception,
                "review.explanation_failed review_id={ReviewId} policy_version={PolicyVersion}",
                entity.Id, entity.PolicyVersion);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private sealed record ReviewSnapshot(
        string Modality, WorkoutAdherenceStatus Status, IReadOnlyList<ExplanationFact> Facts);
}
