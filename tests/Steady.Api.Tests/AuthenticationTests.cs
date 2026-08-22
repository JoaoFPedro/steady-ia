using System.Net;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Steady.Api.Tests.Infrastructure;
using Steady.Infrastructure.Persistence;

namespace Steady.Api.Tests;

[Collection(ApiTestCollection.Name)]
public sealed class AuthenticationTests(CustomWebApplicationFactory factory)
{
    [Fact]
    public async Task NovoCorredor_PrimeiroLogin_CriaCorredorAutomaticamente()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredor(googleSub);

        var response = await client.GetAsync("/api/training-sessions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var corredor = await dbContext.Corredores.SingleOrDefaultAsync(c => c.GoogleSub == googleSub);
        corredor.Should().NotBeNull();
    }

    [Fact]
    public async Task CorredorExistente_LoginNovamente_NaoDuplicaCorredor()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredor(googleSub);

        await client.GetAsync("/api/training-sessions");
        await client.GetAsync("/api/training-sessions");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var count = await dbContext.Corredores.CountAsync(c => c.GoogleSub == googleSub);
        count.Should().Be(1);
    }

    [Fact]
    public async Task SemToken_Retorna401()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/training-sessions");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TokenInvalido_Retorna401()
    {
        var client = factory.CreateClient().AsCorredor(FakeGoogleTokenValidator.InvalidToken);

        var response = await client.GetAsync("/api/training-sessions");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // --- STORY-009: e-mail do corredor ------------------------------------------

    [Fact]
    public async Task PrimeiroLogin_GravaEmailDoToken()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredorComEmail(googleSub, "corredor@exemplo.test");

        var response = await client.GetAsync("/api/training-sessions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await CorredorDe(googleSub))!.Email.Should().Be("corredor@exemplo.test");
    }

    [Fact]
    public async Task EmailMudouNoGoogle_AtualizaOGuardado()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";

        await factory.CreateClient()
            .AsCorredorComEmail(googleSub, "antigo@exemplo.test")
            .GetAsync("/api/training-sessions");

        await factory.CreateClient()
            .AsCorredorComEmail(googleSub, "novo@exemplo.test")
            .GetAsync("/api/training-sessions");

        (await CorredorDe(googleSub))!.Email.Should().Be("novo@exemplo.test");
        (await ContagemDe(googleSub)).Should().Be(1);
    }

    [Fact]
    public async Task MesmoEmail_NaoDuplicaNemAltera()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";

        await factory.CreateClient()
            .AsCorredorComEmail(googleSub, "corredor@exemplo.test")
            .GetAsync("/api/training-sessions");

        await factory.CreateClient()
            .AsCorredorComEmail(googleSub, "corredor@exemplo.test")
            .GetAsync("/api/training-sessions");

        (await CorredorDe(googleSub))!.Email.Should().Be("corredor@exemplo.test");
        (await ContagemDe(googleSub)).Should().Be(1);
    }

    [Fact]
    public async Task TokenSemEmail_CriaCorredorSemEmail()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";
        var client = factory.CreateClient().AsCorredorSemEmail(googleSub);

        var response = await client.GetAsync("/api/training-sessions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var corredor = await CorredorDe(googleSub);
        corredor.Should().NotBeNull();
        corredor!.Email.Should().BeNull();
    }

    [Fact]
    public async Task TokenSemEmail_NaoApagaEmailJaGuardado()
    {
        var googleSub = $"sub-{Guid.NewGuid()}";

        await factory.CreateClient()
            .AsCorredorComEmail(googleSub, "corredor@exemplo.test")
            .GetAsync("/api/training-sessions");

        await factory.CreateClient()
            .AsCorredorSemEmail(googleSub)
            .GetAsync("/api/training-sessions");

        (await CorredorDe(googleSub))!.Email.Should().Be("corredor@exemplo.test");
    }

    [Fact]
    public async Task MesmoEmailEmDoisSubs_SaoDoisCorredores()
    {
        // ADR-002: a identidade é o "sub". E-mail repetido é estado válido, não conflito —
        // por isso a coluna não tem índice único.
        var primeiroSub = $"sub-{Guid.NewGuid()}";
        var segundoSub = $"sub-{Guid.NewGuid()}";

        await factory.CreateClient()
            .AsCorredorComEmail(primeiroSub, "mesmo@exemplo.test")
            .GetAsync("/api/training-sessions");

        await factory.CreateClient()
            .AsCorredorComEmail(segundoSub, "mesmo@exemplo.test")
            .GetAsync("/api/training-sessions");

        var primeiro = await CorredorDe(primeiroSub);
        var segundo = await CorredorDe(segundoSub);

        primeiro.Should().NotBeNull();
        segundo.Should().NotBeNull();
        primeiro!.Id.Should().NotBe(segundo!.Id);
        primeiro.Email.Should().Be("mesmo@exemplo.test");
        segundo.Email.Should().Be("mesmo@exemplo.test");
    }

    [Fact]
    public async Task TokenInvalido_NaoCriaCorredor()
    {
        var antes = await TotalDeCorredores();

        await factory.CreateClient()
            .WithToken(FakeGoogleTokenValidator.InvalidToken)
            .GetAsync("/api/training-sessions");

        (await TotalDeCorredores()).Should().Be(antes);
    }

    // --- helpers -----------------------------------------------------------------

    private async Task<CorredorEntity?> CorredorDe(string googleSub)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        return await dbContext.Corredores.AsNoTracking().SingleOrDefaultAsync(c => c.GoogleSub == googleSub);
    }

    private async Task<int> ContagemDe(string googleSub)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        return await dbContext.Corredores.CountAsync(c => c.GoogleSub == googleSub);
    }

    private async Task<int> TotalDeCorredores()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        return await dbContext.Corredores.CountAsync();
    }
}
