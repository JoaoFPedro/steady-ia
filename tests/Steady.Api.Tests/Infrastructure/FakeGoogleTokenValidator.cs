using Steady.Api.Auth;

namespace Steady.Api.Tests.Infrastructure;

/// <summary>
/// Stub de validação de token (Playbook 4.5) — evita depender do Google real em teste.
/// O token enviado pelo teste É o "sub" do corredor, exceto o sentinel <see cref="InvalidToken"/>.
/// </summary>
public sealed class FakeGoogleTokenValidator : IGoogleTokenValidator
{
    public const string InvalidToken = "invalid-token";

    public Task<string?> ValidateAndGetSubAsync(string idToken) =>
        Task.FromResult(idToken == InvalidToken ? null : idToken);
}
