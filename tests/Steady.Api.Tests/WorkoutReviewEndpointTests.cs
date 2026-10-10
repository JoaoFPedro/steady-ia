using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Domain.Adherence;
using Steady.Infrastructure.Persistence;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class WorkoutReviewEndpointTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task Corredor_ve_mais_recente_e_confirma_entendi()
    {
        var (client, review) = await ReviewAsync();

        var latest = await client.GetFromJsonAsync<WorkoutReviewResponse>("/api/workout-reviews/latest");
        var understood = await client.PostAsync($"/api/workout-reviews/{review.Id}/understood", null);

        Assert.Equal(review.Id, latest!.Id);
        Assert.Equal(HttpStatusCode.NoContent, understood.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        Assert.NotNull((await db.WorkoutReviews.SingleAsync(item => item.Id == review.Id)).UnderstoodAt);
    }

    [Fact]
    public async Task Revisao_de_outro_corredor_nao_e_revelada()
    {
        var (_, review) = await ReviewAsync();
        var stranger = factory.CreateClient().AsCorredor($"stranger-{Guid.NewGuid()}");

        var response = await stranger.GetAsync($"/api/workout-reviews/by-execution/{review.ExecutionId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Corredor_pode_contestar_sem_alterar_recomendacao()
    {
        var (client, review) = await ReviewAsync();

        var response = await client.PostAsync($"/api/workout-reviews/{review.Id}/contest", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var stored = await db.WorkoutReviews.SingleAsync(item => item.Id == review.Id);
        Assert.True(stored.Contested);
        Assert.Equal(AuthorizedAction.ReduceLoad, stored.Action);
    }

    private async Task<(HttpClient Client, WorkoutReviewEntity Review)> ReviewAsync()
    {
        var sub = $"review-endpoint-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredor(sub);
        await client.GetAsync("/api/plan-requests");
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var corredor = await db.Corredores.SingleAsync(item => item.GoogleSub == sub);
        var review = new WorkoutReviewEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredor.Id,
            ExecutionId = Guid.NewGuid(),
            ExecutionKind = WorkoutExecutionKind.Running,
            ExecutionDate = new DateOnly(2026, 8, 30),
            Status = WorkoutAdherenceStatus.Divergent,
            Action = AuthorizedAction.ReduceLoad,
            PolicyVersion = 1,
            PlanVersion = 1,
            ComparisonJson = "{\"facts\":[]}",
            ExplanationStatus = ExplanationStatus.Unavailable,
            CoherenceStatus = CoherenceStatus.Unknown,
            CreatedAt = DateTime.UtcNow
        };
        db.WorkoutReviews.Add(review);
        await db.SaveChangesAsync();
        return (client, review);
    }
}
