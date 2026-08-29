using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class CoachingEndpointTests(CustomWebApplicationFactory factory)
{
    private static PublishTrainingSheetBody ValidSheet() => new(
        Push: [new ExercisePrescriptionBody("Supino reto", 4, 6)],
        Pull: [new ExercisePrescriptionBody("Remada curvada", 4, 8)],
        Lower: [new ExercisePrescriptionBody("Agachamento livre", 4, 6)],
        TuesdayRun: new RunPrescriptionBody("Moderada com fartlek leve", null, null, null),
        ThursdayRun: new RunPrescriptionBody("Intervalado ou tempo run", null, null, null),
        SaturdayRun: new RunPrescriptionBody("Longão em ritmo confortável", null, null, null));

    private async Task<(HttpClient Personal, HttpClient Corredor, CoachingLinkResponse Link)> ActiveLinkAsync()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var corredorEmail = $"corredor-{suffix}@example.com";
        var corredor = factory.CreateClient().AsCorredorComEmail($"runner-{suffix}", corredorEmail);
        await corredor.GetAsync("/api/plan-requests");

        var personal = await factory.CreatePersonalClientAsync(
            $"coach-{suffix}", $"personal-{suffix}@example.com");
        var search = await personal.GetFromJsonAsync<RunnerSearchResponse>(
            $"/api/coaching/runners/search?email={Uri.EscapeDataString(corredorEmail)}");
        var requested = await personal.PostAsJsonAsync(
            "/api/coaching/links", new CreateCoachingLinkBody(search!.CorredorId));
        var link = (await requested.Content.ReadFromJsonAsync<CoachingLinkResponse>())!;

        var accepted = await corredor.PostAsync($"/api/coaching/links/{link.Id}/accept", null);
        accepted.StatusCode.Should().Be(HttpStatusCode.OK);

        return (personal, corredor, link);
    }

    [Fact]
    public async Task Busca_e_solicitacao_nao_concedem_acesso_antes_do_aceite()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var email = $"runner-{suffix}@example.com";
        var corredor = factory.CreateClient().AsCorredorComEmail($"runner-{suffix}", email);
        await corredor.GetAsync("/api/plan-requests");
        var personal = await factory.CreatePersonalClientAsync(
            $"coach-{suffix}", $"coach-{suffix}@example.com");

        var found = await personal.GetFromJsonAsync<RunnerSearchResponse>(
            $"/api/coaching/runners/search?email={Uri.EscapeDataString(email)}");
        var request = await personal.PostAsJsonAsync(
            "/api/coaching/links", new CreateCoachingLinkBody(found!.CorredorId));

        request.StatusCode.Should().Be(HttpStatusCode.Created);
        var history = await personal.GetAsync($"/api/coaching/runners/{found.CorredorId}/history");
        history.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var pending = await corredor.GetFromJsonAsync<List<CoachingLinkResponse>>("/api/coaching/links/pending");
        pending.Should().ContainSingle(item => item.Status == "pending");
    }

    [Fact]
    public async Task Corredor_aceita_e_personal_publica_ficha_completa()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();

        var linked = await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners");
        var response = await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{linked!.Single().CorredorId}/training-sheets", ValidSheet());

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var active = await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active");
        active!.Workouts.Should().HaveCount(4);
        active.Workouts.Select(workout => workout.Type)
            .Should().Equal("push", "pull", "lower", "run");
        active.Workouts.Single(workout => workout.Type == "run").RunDescriptions.Should().Be(
            new RunningPrescriptionsResponse(
                new RunPrescriptionResponse("Moderada com fartlek leve", null, null, null),
                new RunPrescriptionResponse("Intervalado ou tempo run", null, null, null),
                new RunPrescriptionResponse("Longão em ritmo confortável", null, null, null)));
        active.Workouts.Where(workout => workout.Type != "run")
            .SelectMany(workout => workout.Exercises)
            .Should().OnlyContain(exercise => exercise.SuggestedLoadKg == null);
    }

    [Fact]
    public async Task Publicar_com_campos_numericos_opcionais_preserva_faixas_e_alvo_exato()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var linked = await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners");

        var sheet = ValidSheet() with
        {
            TuesdayRun = new RunPrescriptionBody(
                "Moderada", new NumericRangeBody(8, 10), new IntRangeBody(45, 55), new IntRangeBody(5, 6)),
            ThursdayRun = new RunPrescriptionBody("Qualidade", null, null, new IntRangeBody(7, 8)),
            SaturdayRun = new RunPrescriptionBody("Longão", new NumericRangeBody(21, null), null, null),
        };

        var response = await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{linked!.Single().CorredorId}/training-sheets", sheet);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var active = await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active");
        var run = active!.Workouts.Single(workout => workout.Type == "run").RunDescriptions!;

        run.Tuesday.DistanceKm.Should().Be(new NumericRangeResponse(8, 10));
        run.Tuesday.DurationMinutes.Should().Be(new IntRangeResponse(45, 55));
        run.Tuesday.PerceivedEffort.Should().Be(new IntRangeResponse(5, 6));
        run.Thursday.DistanceKm.Should().BeNull();
        run.Thursday.PerceivedEffort.Should().Be(new IntRangeResponse(7, 8));
        run.Saturday.DistanceKm.Should().Be(new NumericRangeResponse(21, null));
    }

    [Fact]
    public async Task Publicar_com_faixa_invertida_retorna_400_e_nao_cria_ficha()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var linked = await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners");
        var corredorId = linked!.Single().CorredorId;

        var invalid = ValidSheet() with
        {
            SaturdayRun = new RunPrescriptionBody("Longão", new NumericRangeBody(12, 8), null, null),
        };

        var response = await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{corredorId}/training-sheets", invalid);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await corredor.GetAsync("/api/coaching/training-sheet/active"))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Execucao_completa_e_idempotente_aparece_no_historico_do_personal()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync($"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = (await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active"))!;
        var lower = sheet.Workouts.Single(workout => workout.Type == "lower");
        var exercise = lower.Exercises.Single();
        var key = Guid.NewGuid();
        var body = new StrengthWorkoutExecutionBody(
            sheet.Id,
            "lower",
            "2026-08-24",
            [new ExerciseExecutionBody(exercise.Id, 60.50m, "Ajustar posição dos pés", Skipped: false)]);

        var first = await corredor.PostWithKeyAsync("/api/coaching/strength-executions", body, key);
        var duplicate = await corredor.PostWithKeyAsync("/api/coaching/strength-executions", body, key);

        first.StatusCode.Should().Be(HttpStatusCode.Created);
        duplicate.StatusCode.Should().Be(HttpStatusCode.OK);
        var nextWorkout = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");
        nextWorkout!.Workouts.Single(workout => workout.Type == "lower")
            .Exercises.Single().SuggestedLoadKg.Should().Be(60.50m);
        var history = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runner.CorredorId}/history");
        history!.StrengthExecutions.Should().ContainSingle();
        history.StrengthExecutions.Single().Exercises.Single().LoadKg.Should().Be(60.50m);
        history.StrengthExecutions.Single().Exercises.Single().Note.Should().Be("Ajustar posição dos pés");
    }

    [Fact]
    public async Task Registro_combinado_e_atomico_e_idempotente()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = (await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active"))!;
        var lower = sheet.Workouts.Single(workout => workout.Type == "lower");
        var exercise = lower.Exercises.Single();
        var key = Guid.NewGuid();
        var body = new CombinedWorkoutExecutionBody(
            new StrengthWorkoutExecutionBody(
                sheet.Id,
                "lower",
                "2026-08-25",
                [new ExerciseExecutionBody(exercise.Id, 60, null, false)]),
            new RunningSessionRequest(new DateOnly(2026, 8, 25), 8, 45, 5.6, 5));

        var first = await corredor.PostWithKeyAsync(
            "/api/coaching/combined-executions", body, key);
        var duplicate = await corredor.PostWithKeyAsync(
            "/api/coaching/combined-executions", body, key);
        var history = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runner.CorredorId}/history");

        first.StatusCode.Should().Be(HttpStatusCode.Created);
        duplicate.StatusCode.Should().Be(HttpStatusCode.OK);
        history!.StrengthExecutions.Should().ContainSingle();
        history.RunningSessions.Should().ContainSingle();
    }

    [Fact]
    public async Task Corrida_invalida_nao_persiste_metade_do_registro_combinado()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = (await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active"))!;
        var exercise = sheet.Workouts.Single(workout => workout.Type == "lower").Exercises.Single();
        var body = new CombinedWorkoutExecutionBody(
            new StrengthWorkoutExecutionBody(
                sheet.Id,
                "lower",
                "2026-08-25",
                [new ExerciseExecutionBody(exercise.Id, 60, null, false)]),
            new RunningSessionRequest(new DateOnly(2026, 8, 25), 0, 45, 5.6, 5));

        var response = await corredor.PostRegistroAsync(
            "/api/coaching/combined-executions", body);
        var history = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runner.CorredorId}/history");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        history!.StrengthExecutions.Should().BeEmpty();
        history.RunningSessions.Should().BeEmpty();
    }

    [Fact]
    public async Task Exercicio_pulado_nao_sugere_carga_no_proximo_treino()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync($"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = (await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active"))!;
        var lower = sheet.Workouts.Single(workout => workout.Type == "lower");
        var exercise = lower.Exercises.Single();
        var body = new StrengthWorkoutExecutionBody(
            sheet.Id, "lower", "2026-08-24",
            [new ExerciseExecutionBody(exercise.Id, null, "Equipamento ocupado", Skipped: true)]);

        await corredor.PostRegistroAsync("/api/coaching/strength-executions", body);

        var next = await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active");
        next!.Workouts.Single(workout => workout.Type == "lower")
            .Exercises.Single().SuggestedLoadKg.Should().BeNull();
    }

    [Fact]
    public async Task Nova_ficha_substitui_ativa_sem_apagar_historico_e_reseta_sugestoes()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync($"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var first = (await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active"))!;
        var exercise = first.Workouts.Single(workout => workout.Type == "lower").Exercises.Single();
        await corredor.PostRegistroAsync("/api/coaching/strength-executions", new StrengthWorkoutExecutionBody(
            first.Id, "lower", "2026-08-24", [new ExerciseExecutionBody(exercise.Id, 80, null, false)]));

        await personal.PostAsJsonAsync($"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());

        var second = await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active");
        second!.Id.Should().NotBe(first.Id);
        second.Workouts.SelectMany(workout => workout.Exercises)
            .Should().OnlyContain(item => item.SuggestedLoadKg == null);
        var history = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runner.CorredorId}/history");
        history!.StrengthExecutions.Should().ContainSingle();
    }

    [Fact]
    public async Task Encerrar_vinculo_revoga_acesso_imediatamente()
    {
        var (personal, corredor, link) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners"))!.Single();
        var runnerLink = await corredor.GetFromJsonAsync<CoachingLinkResponse>("/api/coaching/link/active");

        var ended = await corredor.DeleteAsync($"/api/coaching/links/{link.Id}");
        var history = await personal.GetAsync($"/api/coaching/runners/{runner.CorredorId}/history");

        runner.LinkId.Should().Be(link.Id);
        runnerLink!.Id.Should().Be(link.Id);
        ended.StatusCode.Should().Be(HttpStatusCode.NoContent);
        history.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Corredor_so_pode_ter_um_vinculo_ativo()
    {
        var (_, corredor, _) = await ActiveLinkAsync();
        var suffix = Guid.NewGuid().ToString("N");
        var personal2 = await factory.CreatePersonalClientAsync(
            $"coach2-{suffix}", $"coach2-{suffix}@example.com");
        var account = await corredor.GetFromJsonAsync<CurrentAccountResponse>("/api/account");
        var request = await personal2.PostAsJsonAsync(
            "/api/coaching/links", new CreateCoachingLinkBody(account!.Id));

        request.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Usuario_sem_role_personal_nao_pode_buscar_corredor()
    {
        var ordinary = factory.CreateClient().AsCorredor($"ordinary-{Guid.NewGuid()}");

        var response = await ordinary.GetAsync("/api/coaching/runners/search?email=someone@example.com");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Busca_email_inexistente_retorna_404()
    {
        var personal = await factory.CreatePersonalClientAsync(
            $"coach-{Guid.NewGuid()}", $"coach-{Guid.NewGuid()}@example.com");

        var response = await personal.GetAsync("/api/coaching/runners/search?email=missing@example.com");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Ficha_incompleta_ou_invalida_retorna_400()
    {
        var (personal, _, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners"))!.Single();
        var invalid = ValidSheet() with
        {
            Push = [new ExercisePrescriptionBody("A", 21, 101)],
            TuesdayRun = new RunPrescriptionBody("", null, null, null)
        };

        var response = await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", invalid);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Falha_ao_publicar_preserva_a_ficha_ativa()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var before = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");

        var failed = await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets",
            ValidSheet() with { SaturdayRun = new RunPrescriptionBody("", null, null, null) });
        var after = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");

        failed.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        after!.Id.Should().Be(before!.Id);
    }

    [Fact]
    public async Task Corrida_realizada_aparece_no_historico_do_personal()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();
        var run = new RunningSessionRequest(
            new DateOnly(2026, 8, 24), 8, 45, 5.6, 5);

        await corredor.PostRegistroAsync("/api/running-sessions", run);
        var history = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runner.CorredorId}/history");

        history!.RunningSessions.Should().ContainSingle(item =>
            item.Date == run.Date && item.DistanceKm == run.DistanceKm);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(1000)]
    [InlineData(10.123)]
    public async Task Carga_invalida_retorna_400(decimal invalidLoad)
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync($"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = (await corredor.GetFromJsonAsync<TrainingSheetResponse>("/api/coaching/training-sheet/active"))!;
        var exercise = sheet.Workouts.Single(workout => workout.Type == "lower").Exercises.Single();

        var response = await corredor.PostRegistroAsync("/api/coaching/strength-executions", new StrengthWorkoutExecutionBody(
            sheet.Id, "lower", "2026-08-24",
            [new ExerciseExecutionBody(exercise.Id, invalidLoad, null, false)]));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // STORY-017 — tempo e observação opcionais no exercício.

    [Fact]
    public async Task Ficha_publicada_devolve_tempo_e_observacao_do_exercicio()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();

        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets",
            ValidSheet() with
            {
                Push = [new ExercisePrescriptionBody("Prancha", 3, 1, 40, "não travar o cotovelo")]
            });
        var active = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");

        var exercise = active!.Workouts.Single(workout => workout.Type == "push").Exercises.Single();
        exercise.DurationSeconds.Should().Be(40);
        exercise.Observation.Should().Be("não travar o cotovelo");
    }

    [Fact]
    public async Task Exercicio_sem_tempo_nem_observacao_volta_ausente()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();

        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var active = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");

        var exercise = active!.Workouts.Single(workout => workout.Type == "push").Exercises.Single();
        exercise.DurationSeconds.Should().BeNull();
        exercise.Observation.Should().BeNull();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Tempo_zero_ou_negativo_e_recusado(int durationSeconds)
    {
        var (personal, _, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();

        var response = await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets",
            ValidSheet() with
            {
                Push = [new ExercisePrescriptionBody("Prancha", 3, 1, durationSeconds, null)]
            });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Observacao_acima_do_limite_e_recusada()
    {
        var (personal, _, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();

        var response = await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets",
            ValidSheet() with
            {
                Push = [new ExercisePrescriptionBody("Supino reto", 4, 6, null, new string('A', 201))]
            });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // Execução pela ficha precisa contar como treino do dia (correção da
    // STORY-018): sem isso o dia nunca fecha e o histórico do corredor não a mostra.

    [Fact]
    public async Task Execucao_pela_ficha_aparece_no_historico_do_corredor()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");
        var exercise = sheet!.Workouts.Single(workout => workout.Type == "push").Exercises.Single();

        corredor.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        var registered = await corredor.PostAsJsonAsync(
            "/api/coaching/strength-executions",
            new StrengthWorkoutExecutionBody(
                sheet.Id, "push", "2026-08-29",
                [new ExerciseExecutionBody(exercise.Id, 40m, null, false)]));
        registered.StatusCode.Should().Be(HttpStatusCode.Created);

        var history = await corredor.GetFromJsonAsync<List<TrainingSessionResponse>>(
            "/api/training-sessions");

        var session = history!.Should().ContainSingle(item => item.Type == "Musculacao").Subject;
        session.Date.Should().Be(new DateOnly(2026, 8, 29));
        session.WorkoutType.Should().Be("push");
        session.DurationMinutes.Should().BeNull("a execução pela ficha não registra duração");
    }

    [Fact]
    public async Task Historico_do_corredor_nao_traz_execucao_de_outro_corredor()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");
        var exercise = sheet!.Workouts.Single(workout => workout.Type == "push").Exercises.Single();
        corredor.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        await corredor.PostAsJsonAsync(
            "/api/coaching/strength-executions",
            new StrengthWorkoutExecutionBody(
                sheet.Id, "push", "2026-08-29",
                [new ExerciseExecutionBody(exercise.Id, 40m, null, false)]));

        var outro = factory.CreateClient().AsCorredorComEmail(
            $"outro-{Guid.NewGuid():N}", $"outro-{Guid.NewGuid():N}@example.com");
        var history = await outro.GetFromJsonAsync<List<TrainingSessionResponse>>(
            "/api/training-sessions");

        history!.Should().BeEmpty();
    }

    // STORY-019 — o personal vê o nome do corredor, não o e-mail.

    [Fact]
    public async Task Personal_ve_o_nome_do_corredor_vinculado()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var email = $"corredor-{suffix}@example.com";
        var corredor = factory.CreateClient().AsCorredorComNome($"runner-{suffix}", email, "Ana Prado");
        await corredor.GetAsync("/api/plan-requests");

        var personal = await factory.CreatePersonalClientAsync(
            $"coach-{suffix}", $"personal-{suffix}@example.com");
        var search = await personal.GetFromJsonAsync<RunnerSearchResponse>(
            $"/api/coaching/runners/search?email={Uri.EscapeDataString(email)}");
        search!.Name.Should().Be("Ana Prado");

        var requested = await personal.PostAsJsonAsync(
            "/api/coaching/links", new CreateCoachingLinkBody(search.CorredorId));
        var link = (await requested.Content.ReadFromJsonAsync<CoachingLinkResponse>())!;
        await corredor.PostAsync($"/api/coaching/links/{link.Id}/accept", null);

        var linked = await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>("/api/coaching/runners");

        linked!.Single().Name.Should().Be("Ana Prado");
        linked.Single().Email.Should().Be(email, "o e-mail continua disponível como identificador");
    }

    [Fact]
    public async Task Corredor_sem_claim_de_nome_fica_sem_nome()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var email = $"corredor-{suffix}@example.com";
        var corredor = factory.CreateClient().AsCorredorComNome($"runner-{suffix}", email, null);
        await corredor.GetAsync("/api/plan-requests");

        var personal = await factory.CreatePersonalClientAsync(
            $"coach-{suffix}", $"personal-{suffix}@example.com");
        var search = await personal.GetFromJsonAsync<RunnerSearchResponse>(
            $"/api/coaching/runners/search?email={Uri.EscapeDataString(email)}");

        search!.Name.Should().BeNull();
    }

    [Fact]
    public async Task Nome_e_atualizado_quando_o_corredor_volta_a_entrar()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var email = $"corredor-{suffix}@example.com";
        var sub = $"runner-{suffix}";

        // Primeiro acesso sem nome — como as contas que já existiam antes desta story.
        await factory.CreateClient().AsCorredorComNome(sub, email, null).GetAsync("/api/plan-requests");
        // Acesso seguinte já traz o claim.
        await factory.CreateClient().AsCorredorComNome(sub, email, "Ana Prado").GetAsync("/api/plan-requests");

        var personal = await factory.CreatePersonalClientAsync(
            $"coach-{suffix}", $"personal-{suffix}@example.com");
        var search = await personal.GetFromJsonAsync<RunnerSearchResponse>(
            $"/api/coaching/runners/search?email={Uri.EscapeDataString(email)}");

        search!.Name.Should().Be("Ana Prado");
    }

    [Fact]
    public async Task Personal_ve_no_historico_o_treino_que_o_corredor_registrou_pela_ficha()
    {
        var (personal, corredor, _) = await ActiveLinkAsync();
        var runner = (await personal.GetFromJsonAsync<List<LinkedRunnerResponse>>(
            "/api/coaching/runners"))!.Single();
        await personal.PostAsJsonAsync(
            $"/api/coaching/runners/{runner.CorredorId}/training-sheets", ValidSheet());
        var sheet = await corredor.GetFromJsonAsync<TrainingSheetResponse>(
            "/api/coaching/training-sheet/active");
        var exercise = sheet!.Workouts.Single(workout => workout.Type == "push").Exercises.Single();

        corredor.DefaultRequestHeaders.Add("Idempotency-Key", Guid.NewGuid().ToString());
        var registered = await corredor.PostAsJsonAsync(
            "/api/coaching/strength-executions",
            new StrengthWorkoutExecutionBody(
                sheet.Id, "push", "2026-08-29",
                [new ExerciseExecutionBody(exercise.Id, 42.5m, "pesado hoje", false)]));
        registered.StatusCode.Should().Be(HttpStatusCode.Created);

        var history = await personal.GetFromJsonAsync<CoachingHistoryResponse>(
            $"/api/coaching/runners/{runner.CorredorId}/history");

        var execution = history!.StrengthExecutions.Should().ContainSingle().Subject;
        execution.Date.Should().Be("2026-08-29");
        execution.WorkoutType.Should().Be("push");
        var registeredExercise = execution.Exercises.Should().ContainSingle().Subject;
        registeredExercise.Name.Should().Be("Supino reto");
        registeredExercise.LoadKg.Should().Be(42.5m);
        registeredExercise.Note.Should().Be("pesado hoje");
    }
}
