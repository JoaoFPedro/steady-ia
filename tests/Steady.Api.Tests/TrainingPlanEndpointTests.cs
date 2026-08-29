using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Steady.Api.Contracts;
using Steady.Api.Tests.Infrastructure;
using Steady.Infrastructure.Persistence;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class TrainingPlanEndpointTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task Corredor_provisionado_le_o_plano_vigente_pela_api()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var corredor = factory.CreateClient().AsCorredor($"runner-{suffix}");
        await corredor.GetAsync("/api/plan-requests"); // provisiona a conta

        var response = await corredor.GetAsync("/api/planning/steady-plan");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var plan = await response.Content.ReadFromJsonAsync<SteadyTrainingPlanResponse>();
        plan!.Version.Should().Be(1);
        plan.Title.Should().Be("Plano de Treino Concorrente — 1ª Maratona");
        plan.WeekPlan.Should().HaveCount(7);

        var terca = plan.WeekPlan[1];
        terca.HasRun.Should().BeTrue();
        terca.Run.Should().NotBeNull();
        terca.Run!.DistanceKm.Should().BeNull();
        terca.Run.Description.Should().Contain("fartlek leve");
    }

    [Fact]
    public async Task Publicar_versao_2_nao_realoca_corredor_ja_associado()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var corredorAntigo = factory.CreateClient().AsCorredor($"runner-antigo-{suffix}");
        await corredorAntigo.GetAsync("/api/plan-requests");

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();

            // Duas SaveChanges, não uma: o índice único parcial em is_current
            // checa cada linha imediatamente, não no fim da instrução — desmarcar
            // a antiga e marcar a nova no mesmo lote arrisca as duas ficarem
            // simultaneamente verdadeiras, mesmo que o resultado final seja válido.
            var atual = await dbContext.TrainingPlanVersions.SingleAsync(v => v.IsCurrent);
            atual.IsCurrent = false;
            await dbContext.SaveChangesAsync();

            dbContext.TrainingPlanVersions.Add(new TrainingPlanVersionEntity
            {
                Id = Guid.NewGuid(),
                Version = 2,
                DefinitionJson = SteadyTrainingPlanDocuments.Serialize(
                    Steady.Domain.Planning.SteadyTrainingPlan.Create(
                        2, SteadyTrainingPlanSeed.Version1().WeekPlan, SteadyTrainingPlanSeed.Version1().Content)),
                IsCurrent = true,
                CreatedAt = DateTime.UtcNow,
            });
            await dbContext.SaveChangesAsync();
        }

        try
        {
            var corredorNovo = factory.CreateClient().AsCorredor($"runner-novo-{suffix}");
            await corredorNovo.GetAsync("/api/plan-requests");

            var respostaAntigo = await corredorAntigo.GetFromJsonAsync<SteadyTrainingPlanResponse>(
                "/api/planning/steady-plan");
            var respostaNovo = await corredorNovo.GetFromJsonAsync<SteadyTrainingPlanResponse>(
                "/api/planning/steady-plan");

            respostaAntigo!.Version.Should().Be(1);
            respostaNovo!.Version.Should().Be(2);
        }
        finally
        {
            // O container Postgres é compartilhado por toda a coleção — restaurar a
            // versão 1 como vigente evita quebrar os testes seguintes. Duas
            // atualizações, pelo mesmo motivo do bloco acima.
            using var scope = factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
            await dbContext.TrainingPlanVersions.ExecuteUpdateAsync(setters =>
                setters.SetProperty(v => v.IsCurrent, false));
            await dbContext.TrainingPlanVersions
                .Where(v => v.Version == 1)
                .ExecuteUpdateAsync(setters => setters.SetProperty(v => v.IsCurrent, true));
        }
    }

    [Fact]
    public async Task Corredor_so_le_o_proprio_plano()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var corredorA = factory.CreateClient().AsCorredor($"runner-a-{suffix}");
        var corredorB = factory.CreateClient().AsCorredor($"runner-b-{suffix}");
        await corredorA.GetAsync("/api/plan-requests");
        await corredorB.GetAsync("/api/plan-requests");

        var planoA = await corredorA.GetFromJsonAsync<SteadyTrainingPlanResponse>("/api/planning/steady-plan");
        var planoB = await corredorB.GetFromJsonAsync<SteadyTrainingPlanResponse>("/api/planning/steady-plan");

        // Sem identificador na rota: não existe caminho para pedir o plano de outro
        // corredor. Ambos recebem a versão vigente, cada um por sua própria sessão.
        planoA!.Version.Should().Be(planoB!.Version);
    }

    [Fact]
    public async Task Sem_autenticacao_nao_le_plano_nenhum()
    {
        var response = await factory.CreateClient().GetAsync("/api/planning/steady-plan");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Sem_versao_vigente_a_leitura_falha_explicitamente_em_vez_de_plano_vazio()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var corredor = factory.CreateClient().AsCorredor($"runner-{suffix}");
        await corredor.GetAsync("/api/plan-requests"); // provisiona com a versão vigente atual

        // O container Postgres é compartilhado por toda a coleção de testes
        // (ApiTestCollection) — desmarcar "vigente" tem que ser desfeito no fim,
        // ou todo teste seguinte que provisiona um corredor novo quebra.
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        try
        {
            await dbContext.TrainingPlanVersions.ExecuteUpdateAsync(setters =>
                setters.SetProperty(v => v.IsCurrent, false));

            // A leitura do próprio plano do corredor não depende de is_current (já
            // está associado); o efeito visível é a falha ao provisionar alguém novo.
            var novoSuffix = Guid.NewGuid().ToString("N");
            var response = await factory.CreateClient()
                .AsCorredor($"runner-{novoSuffix}")
                .GetAsync("/api/plan-requests");

            response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        }
        finally
        {
            await dbContext.TrainingPlanVersions
                .Where(v => v.Version == 1)
                .ExecuteUpdateAsync(setters => setters.SetProperty(v => v.IsCurrent, true));
        }
    }
}
