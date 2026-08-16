namespace Steady.Api.Common;

/// <summary>
/// Traduz a validação das factories de <c>Steady.Domain</c> (guard clauses) em 400,
/// reutilizando a mensagem de domínio (spec.bdd.md STORY-002, regra de negócio #5).
/// </summary>
internal static class DomainFactory
{
    public static bool TryCreate<T>(Func<T> factory, out T? value, out IResult? error)
    {
        try
        {
            value = factory();
            error = null;
            return true;
        }
        catch (ArgumentException ex)
        {
            value = default;
            error = Results.BadRequest(new { error = ex.Message });
            return false;
        }
    }
}
