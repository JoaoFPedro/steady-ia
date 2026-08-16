namespace Steady.Api.Auth;

public interface IGoogleTokenValidator
{
    /// <summary>Retorna o claim "sub" do token válido, ou null se o token for inválido/expirado.</summary>
    Task<string?> ValidateAndGetSubAsync(string idToken);
}
