using Microsoft.EntityFrameworkCore;
using Steady.Domain.Planning;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class TrainingPlanRepository(SteadyDbContext dbContext) : ITrainingPlanRepository
{
    public async Task<TrainingPlanVersionEntity> GetCurrentVersionAsync(CancellationToken cancellationToken) =>
        await dbContext.TrainingPlanVersions.FirstOrDefaultAsync(v => v.IsCurrent, cancellationToken)
            ?? throw new InvalidOperationException(
                "Nenhuma versão do plano do Steady está marcada como vigente. A migration de seed não rodou " +
                "ou a coluna is_current foi apagada — corrija antes de provisionar corredores (ADR-013).");

    public async Task<SteadyTrainingPlan?> GetForRunnerAsync(Guid corredorId, CancellationToken cancellationToken)
    {
        var corredor = await dbContext.Corredores
            .Where(c => c.Id == corredorId)
            .Select(c => new { c.TrainingPlanVersionId })
            .FirstOrDefaultAsync(cancellationToken);

        if (corredor is null)
            return null;

        var version = await dbContext.TrainingPlanVersions
            .FirstOrDefaultAsync(v => v.Id == corredor.TrainingPlanVersionId, cancellationToken);

        return version is null ? null : SteadyTrainingPlanDocuments.Deserialize(version.Version, version.DefinitionJson);
    }
}
