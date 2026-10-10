using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Infrastructure.Persistence;
using Steady.Infrastructure.Repositories;
using Steady.Domain.Coaching;
using Steady.Domain.Adherence;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class AdherencePersistenceTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task Arranque_possui_uma_unica_politica_vigente_com_seed_v1()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();

        var current = await db.AdherencePolicyVersions.Where(policy => policy.IsCurrent).ToListAsync();

        var policy = Assert.Single(current);
        Assert.Equal(1, policy.Version);
    }

    [Fact]
    public async Task Execucao_dor_e_outbox_sao_confirmadas_na_mesma_operacao()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var request = new RunningSessionRequest(
            new DateOnly(2026, 8, 30), 8, 50, 6.25, 8, PainReported: true);

        var response = await client.PostRegistroAsync("/api/running-sessions", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var execution = await response.Content.ReadFromJsonAsync<RunningSessionResponse>();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        Assert.NotNull(await db.ReviewOutbox.SingleOrDefaultAsync(item => item.ExecutionId == execution!.Id));
        Assert.NotNull(await db.PainLogs.SingleOrDefaultAsync(item =>
            item.CorredorId == db.ReviewOutbox.Single(outbox => outbox.ExecutionId == execution!.Id).CorredorId &&
            item.Date == request.Date));
    }

    [Fact]
    public async Task Reenvio_nao_duplica_evento_de_revisao()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredor(googleSub);
        var key = Guid.NewGuid();
        var request = new RunningSessionRequest(
            new DateOnly(2026, 8, 30), 8, 50, 6.25, 8, PainReported: false);

        await client.PostWithKeyAsync("/api/running-sessions", request, key);
        await client.PostWithKeyAsync("/api/running-sessions", request, key);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var corredorId = await db.Corredores
            .Where(corredor => corredor.GoogleSub == googleSub)
            .Select(corredor => corredor.Id)
            .SingleAsync();
        Assert.Equal(1, await db.ReviewOutbox.CountAsync(item =>
            item.CorredorId == corredorId && item.IdempotencyKey == key));
    }

    [Fact]
    public async Task Worker_processa_evento_pendente_e_cria_uma_revisao_divergente()
    {
        var googleSub = $"review-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredor(googleSub);
        await client.GetAsync("/api/plan-requests");

        await using (var setup = factory.Services.CreateAsyncScope())
        {
            var db = setup.ServiceProvider.GetRequiredService<SteadyDbContext>();
            var corredor = await db.Corredores.SingleAsync(item => item.GoogleSub == googleSub);
            var sheet = TrainingSheet.Create(
                Guid.NewGuid(),
                Strength(WorkoutType.Push, "Supino"),
                Strength(WorkoutType.Pull, "Remada"),
                Strength(WorkoutType.Lower, "Agachamento"),
                RunningWorkout.Create(
                    RunPrescription.Create("Terça", distanceKmMin: 10),
                    RunPrescription.Create("Quinta"),
                    RunPrescription.Create("Sábado")));
            db.TrainingSheets.Add(new TrainingSheetEntity
            {
                Id = sheet.Id,
                PersonalId = corredor.Id,
                CorredorId = corredor.Id,
                DefinitionJson = TrainingSheetDocuments.Serialize(sheet),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        var response = await client.PostRegistroAsync(
            "/api/running-sessions",
            new RunningSessionRequest(new DateOnly(2026, 9, 1), 8, 50, 6.25, 8, false));
        var execution = (await response.Content.ReadFromJsonAsync<RunningSessionResponse>())!;

        await using (var processing = factory.Services.CreateAsyncScope())
        {
            var processor = processing.ServiceProvider.GetRequiredService<ReviewOutboxProcessor>();
            // A factory é compartilhada pela collection. Torna este evento o
            // mais antigo sem apagar nem processar eventos pertencentes a
            // outros cenários.
            var processingDb = processing.ServiceProvider.GetRequiredService<SteadyDbContext>();
            var target = await processingDb.ReviewOutbox.SingleAsync(item => item.ExecutionId == execution.Id);
            target.CreatedAt = DateTime.UnixEpoch.AddDays(-1);
            await processingDb.SaveChangesAsync();
            Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        }

        await using var assertion = factory.Services.CreateAsyncScope();
        var assertionDb = assertion.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var review = await assertionDb.WorkoutReviews.SingleAsync(item => item.ExecutionId == execution.Id);
        Assert.Equal(WorkoutAdherenceStatus.Divergent, review.Status);
        Assert.Equal(1, review.PolicyVersion);
        Assert.Equal(ExplanationStatus.Unavailable, review.ExplanationStatus);
    }

    [Fact]
    public async Task Lease_expirado_e_retomado_sem_criar_segunda_revisao()
    {
        var googleSub = $"lease-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredor(googleSub);
        await client.GetAsync("/api/plan-requests");
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var corredor = await db.Corredores.SingleAsync(item => item.GoogleSub == googleSub);
        var run = new RunningSessionEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredor.Id,
            IdempotencyKey = Guid.NewGuid(),
            Date = new DateOnly(2026, 9, 2),
            DistanceKm = 8,
            DurationMinutes = 50,
            AveragePaceMinPerKm = 6.25,
            PerceivedEffort = 8
        };
        var pending = new ReviewOutboxEntity
        {
            Id = Guid.NewGuid(),
            CorredorId = corredor.Id,
            ExecutionId = run.Id,
            ExecutionKind = WorkoutExecutionKind.Running,
            IdempotencyKey = run.IdempotencyKey,
            ExecutionDate = run.Date,
            Status = ReviewOutboxStatus.Processing,
            LeaseUntil = DateTime.UtcNow.AddMinutes(-1),
            CreatedAt = DateTime.UnixEpoch
        };
        db.RunningSessions.Add(run);
        db.ReviewOutbox.Add(pending);
        await db.SaveChangesAsync();

        var processor = scope.ServiceProvider.GetRequiredService<ReviewOutboxProcessor>();
        await processor.ProcessNextAsync(CancellationToken.None);

        Assert.Equal(ReviewOutboxStatus.Completed, pending.Status);
        Assert.True(await db.WorkoutReviews.CountAsync(item => item.ExecutionId == pending.ExecutionId) <= 1);
    }

    private static StrengthWorkout Strength(WorkoutType type, string name) =>
        StrengthWorkout.Create(type, [ExercisePrescription.Create(Guid.NewGuid(), name, 3, 10)]);
}
