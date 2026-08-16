using Google.Apis.Auth;

namespace Steady.Api.Auth;

/// <summary>
/// Valida o ID token do Google via chave pública cacheada pela biblioteca oficial (ADR-002).
/// </summary>
public sealed class GoogleTokenValidator : IGoogleTokenValidator
{
    public async Task<string?> ValidateAndGetSubAsync(string idToken)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
            return payload.Subject;
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
