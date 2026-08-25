using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Steady.Infrastructure.Persistence;
using Steady.Infrastructure.Repositories;

namespace Steady.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// A connection string é resolvida em tempo de DI (não no startup síncrono) para que
    /// overrides de configuração — como os aplicados por WebApplicationFactory em teste — sejam respeitados.
    /// </summary>
    public static IServiceCollection AddSteadyInfrastructure(this IServiceCollection services)
    {
        services.AddDbContext<SteadyDbContext>((serviceProvider, options) =>
        {
            var connectionString = serviceProvider.GetRequiredService<IConfiguration>().GetConnectionString("SteadyDb")
                ?? throw new InvalidOperationException(
                    "Connection string 'SteadyDb' não configurada. Defina ConnectionStrings__SteadyDb como variável de ambiente.");

            options.UseNpgsql(connectionString);
        });

        services.AddScoped<ICorredorRepository, CorredorRepository>();
        services.AddScoped<IRunningSessionRepository, RunningSessionRepository>();
        services.AddScoped<IStrengthSessionRepository, StrengthSessionRepository>();
        services.AddScoped<IPainLogRepository, PainLogRepository>();
        services.AddScoped<IPlanRequestRepository, PlanRequestRepository>();
        services.AddScoped<ICoachingLinkRepository, CoachingLinkRepository>();
        services.AddScoped<ITrainingSheetRepository, TrainingSheetRepository>();

        return services;
    }
}
