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

    /// <summary>Token com e-mail e nome — o nome também é claim opcional do Google.</summary>
    public static string TokenFor(string googleSub, string? email, string? name) =>
        $"{googleSub}{EmailSeparator}{email}{EmailSeparator}{name}";

    /// <summary>E-mail que <see cref="TokenFor(string)"/> produz para um dado "sub".</summary>
    public static string DefaultEmailFor(string googleSub) => $"{googleSub}@exemplo.test";

    public Task<GoogleIdentity?> ValidateAsync(string idToken)
    {
        if (idToken == InvalidToken)
            return Task.FromResult<GoogleIdentity?>(null);

        var parts = idToken.Split(EmailSeparator);

        if (parts.Length == 1)
            return Task.FromResult<GoogleIdentity?>(
                new GoogleIdentity(idToken, DefaultEmailFor(idToken), null));

        var email = parts[1];
        var name = parts.Length > 2 ? parts[2] : string.Empty;

        return Task.FromResult<GoogleIdentity?>(new GoogleIdentity(
            parts[0],
            email.Length == 0 ? null : email,
            name.Length == 0 ? null : name));
    }
}
