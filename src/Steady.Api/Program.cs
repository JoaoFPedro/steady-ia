using Steady.Api.Auth;
using Steady.Api.Endpoints;
using Steady.Infrastructure.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSteadyInfrastructure();

builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services.AddScoped<CurrentCorredor>();
builder.Services.AddScoped<AuthenticationFilter>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var api = app.MapGroup("/api").AddEndpointFilter<AuthenticationFilter>();
api.MapRunningSessionEndpoints();
api.MapStrengthSessionEndpoints();
api.MapPainLogEndpoints();
api.MapOverloadAssessmentEndpoints();
api.MapTrainingHistoryEndpoints();

app.Run();

public partial class Program;
