using Microsoft.EntityFrameworkCore;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class CorredorRepository(SteadyDbContext dbContext) : ICorredorRepository
{
    public async Task<CorredorEntity> GetOrCreateBySubAsync(
        string googleSub,
        string? email,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.Corredores
            .FirstOrDefaultAsync(c => c.GoogleSub == googleSub, cancellationToken);

        if (existing is not null)
            return await SincronizarEmailAsync(existing, email, cancellationToken);

        var corredor = new CorredorEntity
        {
            Id = Guid.NewGuid(),
            GoogleSub = googleSub,
            Email = email,
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
            // Corrida entre duas requisições do mesmo corredor: o índice único de
            // google_sub garante que só uma inserção vence. A perdedora relê a vencedora.
            dbContext.Entry(corredor).State = EntityState.Detached;

            var vencedor = await dbContext.Corredores
                .FirstAsync(c => c.GoogleSub == googleSub, cancellationToken);

            return await SincronizarEmailAsync(vencedor, email, cancellationToken);
        }
    }

    /// <summary>
    /// Mantém o e-mail alinhado com o que o provedor informou no acesso atual.
    ///
    /// Duas guardas, ambas deliberadas (STORY-009, regras 4 e 5):
    /// claim ausente <b>não apaga</b> o e-mail guardado — perder dado bom por causa de
    /// dado faltante é pior que ficar desatualizado; e valor igual não escreve — este
    /// caminho roda em toda requisição autenticada.
    /// </summary>
    private async Task<CorredorEntity> SincronizarEmailAsync(
        CorredorEntity corredor,
        string? email,
        CancellationToken cancellationToken)
    {
        if (email is null || corredor.Email == email)
            return corredor;

        corredor.Email = email;
        await dbContext.SaveChangesAsync(cancellationToken);

        return corredor;
    }
}
