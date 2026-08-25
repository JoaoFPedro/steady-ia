using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public enum AcceptLinkResult
{
    Accepted,
    NotFound,
    AlreadyLinked
}

public sealed record LinkedRunner(Guid LinkId, Guid CorredorId, string? Email);

public interface ICoachingLinkRepository
{
    Task<SaveResult<CoachingLinkEntity>> RequestAsync(
        Guid personalId, Guid corredorId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CoachingLinkEntity>> GetPendingAsync(
        Guid corredorId, CancellationToken cancellationToken);
    Task<AcceptLinkResult> AcceptAsync(
        Guid linkId, Guid corredorId, CancellationToken cancellationToken);
    Task<bool> EndAsync(Guid linkId, Guid actorId, CancellationToken cancellationToken);
    Task<bool> HasActiveAsync(Guid personalId, Guid corredorId, CancellationToken cancellationToken);
    Task<bool> RunnerHasActiveAsync(Guid corredorId, CancellationToken cancellationToken);
    Task<CoachingLinkEntity?> GetActiveForRunnerAsync(
        Guid corredorId, CancellationToken cancellationToken);
    Task<IReadOnlyList<LinkedRunner>> GetLinkedRunnersAsync(
        Guid personalId, CancellationToken cancellationToken);
}
