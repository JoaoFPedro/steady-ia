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

    public async Task<GoogleIdentity?> ValidateAsync(string idToken)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, _settings);

            // Sem "sub" não há identidade — tratar como token inválido é mais seguro que
            // seguir com uma chave vazia, que colidiria entre corredores (ADR-002).
            if (string.IsNullOrWhiteSpace(payload.Subject))
                return null;

            return new GoogleIdentity(payload.Subject, NormalizarEmail(payload.Email));
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }

    /// <summary>Claim ausente chega como null ou vazio — os dois significam "sem e-mail".</summary>
    private static string? NormalizarEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? null : email.Trim();
}
