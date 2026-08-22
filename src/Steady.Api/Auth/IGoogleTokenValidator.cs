namespace Steady.Api.Auth;

public interface IGoogleTokenValidator
{
    /// <summary>Identidade do token válido, ou null se o token for inválido/expirado.</summary>
    Task<GoogleIdentity?> ValidateAsync(string idToken);
}
