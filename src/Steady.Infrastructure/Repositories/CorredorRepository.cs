using Microsoft.EntityFrameworkCore;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class CorredorRepository(
    SteadyDbContext dbContext,
    ITrainingPlanRepository trainingPlans) : ICorredorRepository
{
    public async Task<CorredorEntity> GetOrCreateBySubAsync(
        string googleSub,
        string? email,
        string? name,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.Corredores
            .FirstOrDefaultAsync(c => c.GoogleSub == googleSub, cancellationToken);

        if (existing is not null)
            return await SincronizarPerfilAsync(existing, email, name, cancellationToken);

        // A versão vigente no momento do provisionamento fica fixa nesta conta
        // (ADR-013) — publicar uma versão nova depois não a realoca.
        var currentPlan = await trainingPlans.GetCurrentVersionAsync(cancellationToken);

        var corredor = new CorredorEntity
        {
            Id = Guid.NewGuid(),
            GoogleSub = googleSub,
            Email = email,
            Name = name,
            Roles = ["Corredor"],
            TrainingPlanVersionId = currentPlan.Id,
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

            return await SincronizarPerfilAsync(vencedor, email, name, cancellationToken);
        }
    }

    public async Task<CorredorEntity?> FindRunnerByEmailAsync(
        string email, CancellationToken cancellationToken)
    {
        // A coleção é exposta como IReadOnlyList para não vazar mutabilidade, mas o
        // provider do PostgreSQL não traduz Enumerable.Contains nesse tipo. O e-mail
        // reduz o conjunto no banco; a checagem do papel ocorre sobre os poucos
        // resultados (e e-mail duplicado continua sendo um estado válido).
        var accounts = await dbContext.Corredores
            .Where(account => account.Email == email)
            .ToListAsync(cancellationToken);

        return accounts.FirstOrDefault(account => account.Roles.Contains("Corredor"));
    }

    public Task<CorredorEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Corredores.FirstOrDefaultAsync(account => account.Id == id, cancellationToken);

    /// <summary>
    /// Mantém o e-mail alinhado com o que o provedor informou no acesso atual.
    ///
    /// Duas guardas, ambas deliberadas (STORY-009, regras 4 e 5):
    /// claim ausente <b>não apaga</b> o que está guardado — perder dado bom por causa de
    /// dado faltante é pior que ficar desatualizado; e valor igual não escreve — este
    /// caminho roda em toda requisição autenticada.
    /// </summary>
    private async Task<CorredorEntity> SincronizarPerfilAsync(
        CorredorEntity corredor,
        string? email,
        string? name,
        CancellationToken cancellationToken)
    {
        var mudouEmail = email is not null && corredor.Email != email;
        var mudouNome = name is not null && corredor.Name != name;

        if (!mudouEmail && !mudouNome)
            return corredor;

        if (mudouEmail) corredor.Email = email;
        if (mudouNome) corredor.Name = name;
        await dbContext.SaveChangesAsync(cancellationToken);

        return corredor;
    }
}
