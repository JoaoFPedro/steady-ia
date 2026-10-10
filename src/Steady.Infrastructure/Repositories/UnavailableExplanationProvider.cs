using Steady.Domain.Adherence;

namespace Steady.Infrastructure.Repositories;

public sealed class UnavailableExplanationProvider : IExplanationProvider
{
    public Task<StructuredExplanation?> ExplainAsync(
        ExplanationContext context, CancellationToken cancellationToken) => Task.FromResult<StructuredExplanation?>(null);
}
