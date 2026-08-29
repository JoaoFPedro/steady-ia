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

    /// <summary>
    /// Nome vindo do claim `name` do Google — cache do provedor, como
    /// <see cref="Email"/>. Só para exibição; nulo enquanto o corredor não
    /// tiver entrado novamente depois da STORY-019.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Capacidades da conta. Contas são corredores por padrão; a role Personal é
    /// provisionada administrativamente e nunca por endpoint público (ADR-008).
    /// </summary>
    public IReadOnlyList<string> Roles { get; set; } = ["Corredor"];

    /// <summary>
    /// Versão do plano do Steady vigente no provisionamento (ADR-013). Fixa
    /// desde a criação — uma versão nova publicada depois não realoca quem já
    /// tem uma associada.
    /// </summary>
    public Guid TrainingPlanVersionId { get; set; }

    public DateTime CreatedAt { get; set; }
}
