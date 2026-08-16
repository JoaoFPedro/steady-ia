using Microsoft.EntityFrameworkCore;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class CorredorRepository(SteadyDbContext dbContext) : ICorredorRepository
{
    public async Task<CorredorEntity> GetOrCreateBySubAsync(string googleSub, CancellationToken cancellationToken)
    {
        var existing = await dbContext.Corredores
            .FirstOrDefaultAsync(c => c.GoogleSub == googleSub, cancellationToken);

        if (existing is not null)
            return existing;

        var corredor = new CorredorEntity
        {
            Id = Guid.NewGuid(),
            GoogleSub = googleSub,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Corredores.Add(corredor);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return corredor;
        }
        catch (DbUpdateException)
        {
            dbContext.Entry(corredor).State = EntityState.Detached;

            return await dbContext.Corredores
                .FirstAsync(c => c.GoogleSub == googleSub, cancellationToken);
        }
    }
}
