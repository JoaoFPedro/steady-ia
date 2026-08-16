namespace Steady.Api.Auth;

/// <summary>
/// Client ID do Google aceito por esta API.
///
/// É a audiência esperada do ID token: só tokens emitidos para este client ID
/// autenticam aqui (ADR-002). Não é segredo — identifica o aplicativo, não o autoriza.
/// </summary>
public sealed record GoogleAuthOptions(string ClientId);
