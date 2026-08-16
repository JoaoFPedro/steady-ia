namespace Steady.Api.Auth;

/// <summary>Corredor autenticado resolvido pelo <see cref="AuthenticationFilter"/> para a requisição atual.</summary>
public sealed class CurrentCorredor
{
    public Guid Id { get; set; }
}
