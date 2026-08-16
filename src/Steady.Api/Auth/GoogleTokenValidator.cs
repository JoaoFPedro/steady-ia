using Google.Apis.Auth;

namespace Steady.Api.Auth;

/// <summary>
/// Valida o ID token do Google via chave pública cacheada pela biblioteca oficial (ADR-002).
/// </summary>
public sealed class GoogleTokenValidator(GoogleAuthOptions options) : IGoogleTokenValidator
{
    /// <summary>
    /// Restringe a audiência ao client ID do Steady.
    ///
    /// Sem <c>Audience</c>, a biblioteca <b>não verifica o claim `aud`</b> e passa a
    /// aceitar qualquer ID token válido do Google — inclusive um emitido para outro
    /// aplicativo, o que permitiria entrar na conta de um corredor com um token obtido
    /// fora do Steady. A checagem de assinatura sozinha não protege contra isso.
    /// </summary>
    private readonly GoogleJsonWebSignature.ValidationSettings _settings = new()
    {
        Audience = [options.ClientId],
    };

    public async Task<string?> ValidateAndGetSubAsync(string idToken)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, _settings);
            return payload.Subject;
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
