namespace Steady.Infrastructure.Persistence;

public sealed class CorredorEntity
{
    public Guid Id { get; set; }
    public required string GoogleSub { get; set; }

    /// <summary>
    /// E-mail da conta Google, como o ID token informou no último acesso.
    ///
    /// Anulável de propósito: linhas anteriores à STORY-009 não têm e-mail e o claim
    /// pode faltar. É cache do provedor, nunca identidade — a busca é sempre por
    /// <see cref="GoogleSub"/> (ADR-002), e a coluna não tem índice único.
    /// </summary>
    public string? Email { get; set; }

    public DateTime CreatedAt { get; set; }
}
