using Microsoft.AspNetCore.Http.HttpResults;
using Steady.Infrastructure.Repositories;

namespace Steady.Api.Auth;

/// <summary>
/// Valida o ID token do Google em toda requisição do grupo /api (ADR-002).
/// Sem token válido: 401 antes de qualquer lógica de negócio.
/// Com token válido: resolve/cria o Corredor por "sub" e disponibiliza via <see cref="CurrentCorredor"/>.
/// O e-mail do token acompanha a resolução como cache do provedor (STORY-009) — nunca
/// como identidade, e nunca em log (OWASP A09; dado pessoal, Constituição §3).
/// </summary>
public sealed class AuthenticationFilter(
    IGoogleTokenValidator tokenValidator,
    ICorredorRepository corredorRepository,
    CurrentCorredor currentCorredor,
    ILogger<AuthenticationFilter> logger) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var authorizationHeader = context.HttpContext.Request.Headers.Authorization.ToString();

        if (!authorizationHeader.StartsWith("Bearer ", StringComparison.Ordinal))
            return Unauthorized(context, reason: "missing_bearer_token");

        var idToken = authorizationHeader["Bearer ".Length..].Trim();

        if (string.IsNullOrWhiteSpace(idToken))
            return Unauthorized(context, reason: "missing_bearer_token");

        var identity = await tokenValidator.ValidateAsync(idToken);

        if (identity is null)
            return Unauthorized(context, reason: "invalid_or_expired_token");

        var corredor = await corredorRepository.GetOrCreateBySubAsync(
            identity.Sub, identity.Email, identity.Name, context.HttpContext.RequestAborted);
        currentCorredor.Id = corredor.Id;
        currentCorredor.Roles = corredor.Roles;

        return await next(context);
    }

    // OWASP A09 — falhas de autenticação logadas com contexto, nunca com o token em si.
    private UnauthorizedHttpResult Unauthorized(EndpointFilterInvocationContext context, string reason)
    {
        logger.LogWarning(
            "auth.failed path={Path} reason={Reason} ip={RemoteIp}",
            context.HttpContext.Request.Path,
            reason,
            context.HttpContext.Connection.RemoteIpAddress);

        return TypedResults.Unauthorized();
    }
}
