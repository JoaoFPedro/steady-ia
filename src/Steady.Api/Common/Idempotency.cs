namespace Steady.Api.Common;

/// <summary>
/// Chave de idempotência exigida nos endpoints de registro (ADR-003).
/// A fila offline do app reenvia livremente; a chave é o que impede que um reenvio
/// vire um treino duplicado e infle a carga usada pelo ADR-001.
/// </summary>
internal static class Idempotency
{
    public const string HeaderName = "Idempotency-Key";

    public static IResult MissingKey() => Results.BadRequest(
        new { error = $"O header {HeaderName} é obrigatório para registrar." });
}
