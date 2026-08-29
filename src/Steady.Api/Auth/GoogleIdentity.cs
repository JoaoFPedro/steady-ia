namespace Steady.Api.Auth;

/// <summary>
/// O que o ID token validado do Google diz sobre quem está autenticado.
///
/// <paramref name="Sub"/> é a identidade e nunca é nulo (ADR-002).
/// <paramref name="Email"/> é <b>cache do provedor</b>, não identificador: o escopo
/// `email` é concedido pelo corredor, então o claim pode faltar (STORY-009, regra 2).
/// <paramref name="Name"/> é cache do provedor pelo mesmo motivo: vem do escopo
/// `profile` e pode faltar. Serve para exibição, nunca para identificar.
/// </summary>
public sealed record GoogleIdentity(string Sub, string? Email, string? Name);
