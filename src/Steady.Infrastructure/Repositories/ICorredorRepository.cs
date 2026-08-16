using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface ICorredorRepository
{
    Task<CorredorEntity> GetOrCreateBySubAsync(string googleSub, CancellationToken cancellationToken);
}
