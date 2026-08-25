namespace Steady.Api.Auth;

/// <summary>Corredor autenticado resolvido pelo <see cref="AuthenticationFilter"/> para a requisição atual.</summary>
public sealed class CurrentCorredor
{
    public Guid Id { get; set; }
    public IReadOnlyList<string> Roles { get; set; } = [];

    public bool HasRole(string role) => Roles.Contains(role, StringComparer.Ordinal);
}
