using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Domain.Training;

namespace Steady.Api.Tests;

/// <summary>
/// Cenários "API" da spec (specs/STORY-025/spec.bdd.md, ADR-021): o detalhe do
/// treino por id passa a encontrar a execução da ficha, com os exercícios.
/// </summary>
[Collection(ApiTestCollection.Name)]
public sealed class TrainingDetailEndpointTests(CustomWebApplicationFactory factory)
{
    private static PublishTrainingSheetBody Sheet() => new(
        Push: [new ExercisePrescriptionBody("Supino reto", 3, 10), new ExercisePrescriptionBody("Crucifixo", 3, 12)],
        Pull: [new ExercisePrescriptionBody("Remada curvada", 4, 8)],
        Lower: [new ExercisePrescriptionBody("Agachamento livre", 4, 6)],
        TuesdayRun: new RunPrescriptionBody("Moderada com fartlek leve", null, null, null),
        ThursdayRun: new RunPrescriptionBody("Intervalado ou tempo run", null, null, null),
        SaturdayRun: new RunPrescriptionBody("Longão em ritmo confortável", null, null, null));

    /// <summary>Corredor vinculado a um personal, com ficha ativa e uma execução de "push" registrada.</summary>
    private async Task<(HttpClient Corredor, Guid ExecutionId)> CorredorComExecucaoAsync()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var email = $"corredor-{suffix}@example.com";
        var corredor = factory.CreateClient().AsCorredorComEmail($"runner-{suffix}", email);
        await corredor.GetAsync("/api/plan-requests");

        var personal = await factory.CreatePersonalClientAsync($"coach-{suffix}", $"personal-{suffix}@example.com");
        var search = await personal.GetFromJsonAsync<RunnerSearchResponse>(
            $"/api/coaching/runners/search?email={Uri.EscapeDataString(email)}");
        var link = await (await personal.PostAsJsonAsync("/api/coaching/links", new CreateCoachingLinkBody(search!.CorredorId)))
            .Content.ReadFromJsonAsync<CoachingLinkResponse>();
        (await corredor.PostAsync($"/api/coaching/links/{link!.Id}/accept", null)).EnsureSuccessStatusCode();
        await personal.PostAsJsonAsync($"/api/coaching/runners/{search.CorredorId}/training-sheets", Sheet());

        var sheet = (await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active"))!;
        var push = sheet.Workouts.Single(workout => workout.Type == "push");
        var body = new StrengthWorkoutExecutionBody(sheet.Id, "push", "2026-10-30",
        [
            new ExerciseExecutionBody(push.Exercises[0].Id, 20m, "Banco inclinado", Skipped: false),
            new ExerciseExecutionBody(push.Exercises[1].Id, null, null, Skipped: true),
        ]);

        var created = await corredor.PostWithKeyAsync("/api/coaching/strength-executions", body, Guid.NewGuid());
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var execution = await created.Content.ReadFromJsonAsync<StrengthWorkoutExecutionResponse>();
        return (corredor, execution!.Id);
    }

    [Fact]
    public async Task Detalhe_da_execucao_da_ficha_traz_tipo_e_exercicios()
    {
        var (corredor, id) = await CorredorComExecucaoAsync();

        var response = await corredor.GetAsync($"/api/training-sessions/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var detail = await response.Content.ReadFromJsonAsync<TrainingSessionResponse>();
        detail!.Type.Should().Be("Musculacao");
        detail.WorkoutType.Should().Be("push");
        detail.Date.Should().Be(new DateOnly(2026, 10, 30));
        detail.Exercises.Should().HaveCount(2);

        var supino = detail.Exercises!.Single(exercise => exercise.Name == "Supino reto");
        supino.Sets.Should().Be(3);
        supino.Repetitions.Should().Be(10);
        supino.LoadKg.Should().Be(20m);
        supino.Note.Should().Be("Banco inclinado");
        supino.Skipped.Should().BeFalse();
        supino.DurationSeconds.Should().BeNull();

        detail.Exercises!.Single(exercise => exercise.Name == "Crucifixo").Skipped.Should().BeTrue();
    }

    [Fact]
    public async Task Detalhe_da_avulsa_e_da_corrida_mantem_o_contrato_sem_exercicios()
    {
        var client = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var strength = await (await client.PostRegistroAsync("/api/strength-sessions",
                new StrengthSessionRequest(today, MuscleGroup.Ombro, Intensity.Leve, DurationMinutes: 20)))
            .Content.ReadFromJsonAsync<JsonElement>();
        var running = await (await client.PostRegistroAsync("/api/running-sessions",
                new RunningSessionRequest(today, DistanceKm: 5, DurationMinutes: 30, AveragePaceMinPerKm: 6.0, PerceivedEffort: 4)))
            .Content.ReadFromJsonAsync<JsonElement>();

        foreach (var created in new[] { strength, running })
        {
            var json = await client.GetFromJsonAsync<JsonElement>(
                $"/api/training-sessions/{created.GetProperty("id").GetGuid()}");
            json.TryGetProperty("exercises", out var exercises).Should().BeTrue("o campo é omitido ou nulo");
            exercises.ValueKind.Should().Be(JsonValueKind.Null);
        }

        var strengthJson = await client.GetFromJsonAsync<JsonElement>(
            $"/api/training-sessions/{strength.GetProperty("id").GetGuid()}");
        strengthJson.GetProperty("muscleGroup").GetString().Should().Be("Ombro");
        strengthJson.GetProperty("durationMinutes").GetInt32().Should().Be(20);
    }

    [Fact]
    public async Task Detalhe_de_execucao_de_outro_corredor_devolve_404_sem_revelar_dados()
    {
        var (_, id) = await CorredorComExecucaoAsync();
        var outro = factory.CreateClient().AsCorredor($"sub-{Guid.NewGuid()}");

        var response = await outro.GetAsync($"/api/training-sessions/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await response.Content.ReadAsStringAsync()).Should().NotContain("Supino");
    }

    [Fact]
    public async Task Detalhe_exige_autenticacao()
    {
        var anonimo = factory.CreateClient();

        var response = await anonimo.GetAsync($"/api/training-sessions/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Listagem_nao_traz_exercicios()
    {
        var (corredor, _) = await CorredorComExecucaoAsync();

        var sessions = await corredor.GetFromJsonAsync<JsonElement>("/api/training-sessions");

        sessions.GetArrayLength().Should().BeGreaterThan(0);
        foreach (var session in sessions.EnumerateArray())
            (session.TryGetProperty("exercises", out var exercises) ? exercises.ValueKind : JsonValueKind.Null)
                .Should().Be(JsonValueKind.Null);
    }
}
