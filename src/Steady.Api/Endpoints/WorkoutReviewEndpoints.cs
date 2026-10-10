using Steady.Api.Auth;
using Steady.Api.Contracts;
using Steady.Infrastructure.Persistence;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Endpoints;

public static class WorkoutReviewEndpoints
{
    public static RouteGroupBuilder MapWorkoutReviewEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/workout-reviews/latest", async (
            IWorkoutReviewRepository reviews,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            var review = await reviews.GetLatestAsync(current.Id, cancellationToken);
            return review is null ? Results.NotFound() : Results.Ok(Respond(review));
        });

        group.MapGet("/workout-reviews/by-execution/{executionId:guid}", async (
            Guid executionId,
            IWorkoutReviewRepository reviews,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            var review = await reviews.GetByExecutionAsync(current.Id, executionId, cancellationToken);
            return review is null ? Results.NotFound() : Results.Ok(Respond(review));
        });

        group.MapPost("/workout-reviews/{reviewId:guid}/understood", async (
            Guid reviewId,
            IWorkoutReviewRepository reviews,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
            await reviews.MarkUnderstoodAsync(current.Id, reviewId, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound());

        group.MapPost("/workout-reviews/{reviewId:guid}/contest", async (
            Guid reviewId,
            IWorkoutReviewRepository reviews,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
            await reviews.MarkContestedAsync(current.Id, reviewId, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound());

        group.MapPost("/workout-reviews/{reviewId:guid}/retry", async (
            Guid reviewId,
            ReviewExplanationRetryService retry,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
            await retry.RetryAsync(current.Id, reviewId, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound());

        group.MapGet("/coaching/runners/{corredorId:guid}/reviews/{executionId:guid}", async (
            Guid corredorId,
            Guid executionId,
            IWorkoutReviewRepository reviews,
            CurrentCorredor current,
            CancellationToken cancellationToken) =>
        {
            if (!current.HasRole("Personal")) return Results.StatusCode(StatusCodes.Status403Forbidden);
            var review = await reviews.GetForPersonalAsync(
                current.Id, corredorId, executionId, cancellationToken);
            return review is null ? Results.NotFound() : Results.Ok(Respond(review));
        });

        return group;
    }

    internal static WorkoutReviewResponse Respond(WorkoutReviewEntity review) => new(
        review.Id,
        review.ExecutionId,
        review.ExecutionKind.ToString(),
        review.ExecutionDate,
        review.Status.ToString(),
        review.Action?.ToString(),
        review.PolicyVersion,
        review.PlanVersion,
        review.TrainingSheetId,
        review.ComparisonJson,
        review.ExplanationStatus.ToString(),
        review.ExplanationJson,
        review.UnderstoodAt,
        review.Contested,
        review.CoherenceStatus.ToString(),
        review.NextExecutionId,
        review.CoherencePolicyVersion,
        review.CoherenceEvaluatedAt,
        review.CreatedAt);
}
