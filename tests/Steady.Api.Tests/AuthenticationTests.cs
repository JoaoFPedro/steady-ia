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
}
