using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class CoachingCardinalityEndpointTests(CustomWebApplicationFactory factory)
{
    private static PublishTrainingSheetBody ValidSheet() => new(
        Push: [new ExercisePrescriptionBody("Supino reto", 4, 6)],
        Pull: [new ExercisePrescriptionBody("Remada curvada", 4, 8)],
        Lower: [new ExercisePrescriptionBody("Agachamento livre", 4, 6)],
        RunDescription: "Moderada com fartlek leve, pace X, tempo estimado Y");

    private async Task<(HttpClient Client, Guid Id)> RunnerAsync(string prefix)
    {
        var suffix = Guid.NewGuid().ToString("N");
        var client = factory.CreateClient().AsCorredorComEmail(
            $"{prefix}-{suffix}", $"{prefix}-{suffix}@example.com");
        var account = await client.GetFromJsonAsync<CurrentAccountResponse>("/api/account");
        return (client, account!.Id);
    }

    private static async Task<CoachingLinkResponse> RequestAsync(
        HttpClient personal, Guid runnerId)
    {
        var response = await personal.PostAsJsonAsync(
            "/api/coaching/links", new CreateCoachingLinkBody(runnerId));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CoachingLinkResponse>())!;
    }

    [Fact]
    public async Task Aceitar_uma_de_varias_solicitacoes_expira_as_demais()
    {
        var (runner, runnerId) = await RunnerAsync("multi-pending");
        var suffix = Guid.NewGuid().ToString("N");
        var personalOne = await factory.CreatePersonalClientAsync(
            $"personal-one-{suffix}", $"personal-one-{suffix}@example.com");
        var personalTwo = await factory.CreatePersonalClientAsync(
            $"personal-two-{suffix}", $"personal-two-{suffix}@example.com");
        var first = await RequestAsync(personalOne, runnerId);
        var second = await RequestAsync(personalTwo, runnerId);

        var accepted = await runner.PostAsync($"/api/coaching/links/{first.Id}/accept", null);
        var expired = await runner.PostAsync($"/api/coaching/links/{second.Id}/accept", null);
        var pending = await runner.GetFromJsonAsync<List<CoachingLinkResponse>>(
            "/api/coaching/links/pending");

        accepted.StatusCode.Should().Be(HttpStatusCode.OK);
        expired.StatusCode.Should().Be(HttpStatusCode.NotFound);
        pending.Should().BeEmpty();
        (await personalOne.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners")).Should().ContainSingle();
        (await personalTwo.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners")).Should().BeEmpty();
    }

    [Fact]
    public async Task Historico_de_varios_corredores_permanece_isolado()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var personal = await factory.CreatePersonalClientAsync(
            $"multi-coach-{suffix}", $"multi-coach-{suffix}@example.com");
        var (runnerOne, runnerOneId) = await RunnerAsync("runner-one");
        var (runnerTwo, runnerTwoId) = await RunnerAsync("runner-two");
        var linkOne = await RequestAsync(personal, runnerOneId);
        var linkTwo = await RequestAsync(personal, runnerTwoId);
        await runnerOne.PostAsync($"/api/coaching/links/{linkOne.Id}/accept", null);
        await runnerTwo.PostAsync($"/api/coaching/links/{linkTwo.Id}/accept", null);

        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runnerOneId}/training-sheets", ValidSheet());
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runnerTwoId}/training-sheets", ValidSheet());
        await ExecuteLowerAsync(runnerOne, load: 40);
        await ExecuteLowerAsync(runnerTwo, load: 80);

        var one = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runnerOneId}/history");
        var two = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runnerTwoId}/history");
        var linked = await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners");

        linked.Should().HaveCount(2);
        one!.StrengthExecutions.SelectMany(item => item.Exercises)
            .Should().ContainSingle(item => item.LoadKg == 40);
        two!.StrengthExecutions.SelectMany(item => item.Exercises)
            .Should().ContainSingle(item => item.LoadKg == 80);
    }

    [Fact]
    public async Task Evolucao_e_ordenada_da_execucao_mais_recente_para_a_mais_antiga()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var personal = await factory.CreatePersonalClientAsync(
            $"timeline-{suffix}", $"timeline-{suffix}@example.com");
        var (runner, runnerId) = await RunnerAsync("timeline-runner");
        var link = await RequestAsync(personal, runnerId);
        await runner.PostAsync($"/api/coaching/links/{link.Id}/accept", null);
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runnerId}/training-sheets", ValidSheet());

        await ExecuteLowerAsync(runner, 50, "2026-08-20");
        await ExecuteLowerAsync(runner, 55, "2026-08-24");
        var history = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runnerId}/history");

        history!.StrengthExecutions.Select(item => item.Date)
            .Should().Equal("2026-08-24", "2026-08-20");
    }

    private static async Task ExecuteLowerAsync(
        HttpClient runner, decimal load, string date = "2026-08-24")
    {
        var sheet = (await runner.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active"))!;
        var exercise = sheet.Workouts.Single(workout => workout.Type == "lower").Exercises.Single();
        var response = await runner.PostRegistroAsync(
            "/api/coaching/strength-executions",
            new StrengthWorkoutExecutionBody(
                sheet.Id,
                "lower",
                date,
                [new ExerciseExecutionBody(exercise.Id, load, null, Skipped: false)]));
        response.EnsureSuccessStatusCode();
    }
}
