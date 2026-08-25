using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface ICorredorRepository
{
    /// <summary>
    /// Resolve o corredor pelo "sub" do Google, criando-o no primeiro acesso.
    /// <paramref name="email"/> é gravado como cache do provedor — nunca usado para
    /// localizar o corredor, e nulo não apaga o que já estava guardado (STORY-009).
    /// </summary>
    Task<CorredorEntity> GetOrCreateBySubAsync(string googleSub, string? email, CancellationToken cancellationToken);
    Task<CorredorEntity?> FindRunnerByEmailAsync(string email, CancellationToken cancellationToken);
    Task<CorredorEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
