using Steady.Api.Auth;
using Steady.Api.Endpoints;
using Steady.Api.Services;
using Steady.Infrastructure.DependencyInjection;
using Steady.Domain.Adherence;
using Steady.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSteadyInfrastructure();
builder.Services.AddHttpClient<ClaudeExplanationProvider>();
builder.Services.AddScoped<IExplanationProvider>(services =>
    string.IsNullOrWhiteSpace(builder.Configuration["Anthropic:ApiKey"])
        ? services.GetRequiredService<UnavailableExplanationProvider>()
        : services.GetRequiredService<ClaudeExplanationProvider>());

// Falha fechada: sem o client ID, a validação do ID token não verificaria a audiência
// e a API aceitaria token emitido para qualquer outro aplicativo (ADR-002). Como isso é
// invisível em runtime, a API se recusa a subir em vez de rodar insegura.
var googleClientId = builder.Configuration["Google:ClientId"];
if (string.IsNullOrWhiteSpace(googleClientId))
{
    throw new InvalidOperationException(
        "Google:ClientId não configurado. Sem ele a validação do ID token não verifica a audiência " +
        "e qualquer token válido do Google seria aceito (ADR-002). " +
        "Defina Google__ClientId como variável de ambiente.");
}

builder.Services.AddSingleton(new GoogleAuthOptions(googleClientId));
builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services.AddScoped<CurrentCorredor>();
builder.Services.AddScoped<AuthenticationFilter>();
builder.Services.AddHostedService<ReviewOutboxWorker>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var api = app.MapGroup("/api").AddEndpointFilter<AuthenticationFilter>();
api.MapRunningSessionEndpoints();
api.MapStrengthSessionEndpoints();
api.MapPainLogEndpoints();
api.MapOverloadAssessmentEndpoints();
api.MapTrainingHistoryEndpoints();
api.MapPlanRequestEndpoints();
api.MapCoachingLinkEndpoints();
api.MapTrainingSheetEndpoints();
api.MapTrainingPlanEndpoints();
api.MapWorkoutReviewEndpoints();

app.Run();

public partial class Program;
