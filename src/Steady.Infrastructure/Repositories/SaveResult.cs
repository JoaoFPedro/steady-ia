namespace Steady.Infrastructure.Repositories;

/// <summary>
/// Resultado de um registro idempotente (ADR-003).
/// <paramref name="Created"/> distingue um registro novo de um reenvio que
/// devolveu o registro já existente — é o que permite responder 201 ou 200.
/// </summary>
public readonly record struct SaveResult<TEntity>(TEntity Entity, bool Created);
