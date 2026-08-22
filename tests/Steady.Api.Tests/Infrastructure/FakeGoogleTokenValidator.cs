using Steady.Api.Auth;

namespace Steady.Api.Tests.Infrastructure;

/// <summary>
/// Stub de validação de token (Playbook 4.5) — evita depender do Google real em teste.
///
/// O token enviado pelo teste codifica a identidade que o Google devolveria:
/// <c>"sub"</c> sozinho rende um e-mail derivado; <c>"sub|email"</c> fixa o e-mail;
/// <c>"sub|"</c> representa um token <b>sem</b> claim de e-mail (STORY-009, regra 2).
/// O sentinel <see cref="InvalidToken"/> representa token inválido/expirado.
/// </summary>
public sealed class FakeGoogleTokenValidator : IGoogleTokenValidator
{
    /// <summary>
    /// Token que este dublê sempre recusa. O valor é arbitrário e curto de
    /// propósito: o detector de secrets do pre-commit casa qualquer literal de
    /// 8+ caracteres atribuído a algo chamado "token", e aqui não há credencial
    /// alguma — é justamente o valor que nunca autenticaria ninguém.
    /// </summary>
    public const string InvalidToken = "recusar";

    private const char EmailSeparator = '|';

    /// <summary>Token que rende <paramref name="googleSub"/> com o e-mail derivado dele.</summary>
    public static string TokenFor(string googleSub) => googleSub;

    /// <summary>Token que rende <paramref name="googleSub"/> com o e-mail informado — nulo para "sem claim".</summary>
    public static string TokenFor(string googleSub, string? email) =>
        $"{googleSub}{EmailSeparator}{email}";

    /// <summary>E-mail que <see cref="TokenFor(string)"/> produz para um dado "sub".</summary>
    public static string DefaultEmailFor(string googleSub) => $"{googleSub}@exemplo.test";

    public Task<GoogleIdentity?> ValidateAsync(string idToken)
    {
        if (idToken == InvalidToken)
            return Task.FromResult<GoogleIdentity?>(null);

        var separator = idToken.IndexOf(EmailSeparator);

        if (separator < 0)
            return Task.FromResult<GoogleIdentity?>(new GoogleIdentity(idToken, DefaultEmailFor(idToken)));

        var sub = idToken[..separator];
        var email = idToken[(separator + 1)..];

        return Task.FromResult<GoogleIdentity?>(new GoogleIdentity(sub, email.Length == 0 ? null : email));
    }
}
