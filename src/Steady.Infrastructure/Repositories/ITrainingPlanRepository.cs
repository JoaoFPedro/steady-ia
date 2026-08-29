using Steady.Domain.Planning;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public interface ITrainingPlanRepository
{
    /// <summary>
    /// A versão vigente no momento da chamada (ADR-013). Usada no
    /// provisionamento do corredor — nunca reatribuída depois.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// Nenhuma versão está marcada como vigente. Falha de configuração —
    /// nunca deve virar plano vazio para o corredor.
    /// </exception>
    Task<TrainingPlanVersionEntity> GetCurrentVersionAsync(CancellationToken cancellationToken);

    /// <summary>O plano associado ao corredor — a versão que ele recebeu no provisionamento.</summary>
    Task<SteadyTrainingPlan?> GetForRunnerAsync(Guid corredorId, CancellationToken cancellationToken);
}
