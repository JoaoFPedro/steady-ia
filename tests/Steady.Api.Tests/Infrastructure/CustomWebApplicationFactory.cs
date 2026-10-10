using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Steady.Api.Auth;
using Steady.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace Steady.Api.Tests.Infrastructure;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("steady")
        .WithUsername("steady")
        .WithPassword("steady")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // UseSetting, e não ConfigureAppConfiguration: o Program.cs lê o client ID no
        // startup, antes de as fontes de configuração do teste serem aplicadas.
        // O valor é irrelevante — o FakeGoogleTokenValidator substitui a validação real.
        builder.UseSetting("Google:ClientId", "client-id-de-teste.apps.googleusercontent.com");
        builder.UseSetting("ReviewProcessing:Enabled", "false");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:SteadyDb"] = _postgres.GetConnectionString(),
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IGoogleTokenValidator>();
            services.AddScoped<IGoogleTokenValidator, FakeGoogleTokenValidator>();
        });
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    public async Task<HttpClient> CreatePersonalClientAsync(string googleSub, string email)
    {
        var client = CreateClient().AsCorredorComEmail(googleSub, email);

        // Provisiona a conta pelo mesmo filtro usado em produção.
        await client.GetAsync("/api/plan-requests");

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SteadyDbContext>();
        var account = await dbContext.Corredores.SingleAsync(c => c.GoogleSub == googleSub);
        account.Roles = ["Corredor", "Personal"];
        await dbContext.SaveChangesAsync();

        return client;
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }
}
