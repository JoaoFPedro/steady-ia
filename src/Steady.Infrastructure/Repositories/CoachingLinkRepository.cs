using Microsoft.EntityFrameworkCore;
using Steady.Domain.Coaching;
using Steady.Infrastructure.Persistence;

namespace Steady.Infrastructure.Repositories;

public sealed class CoachingLinkRepository(SteadyDbContext dbContext) : ICoachingLinkRepository
{
    public async Task<SaveResult<CoachingLinkEntity>> RequestAsync(
        Guid personalId, Guid corredorId, CancellationToken cancellationToken)
    {
        var existing = await dbContext.CoachingLinks.FirstOrDefaultAsync(
            link => link.PersonalId == personalId &&
                    link.CorredorId == corredorId &&
                    link.Status == CoachingLinkStatus.Pending,
            cancellationToken);

        if (existing is not null)
            return new SaveResult<CoachingLinkEntity>(existing, Created: false);

        var requestedAt = DateTime.UtcNow;
        var domain = CoachingLink.Request(personalId, corredorId, requestedAt);
        var entity = new CoachingLinkEntity
        {
            Id = Guid.NewGuid(),
            PersonalId = domain.PersonalId,
            CorredorId = domain.CorredorId,
            Status = domain.Status,
            RequestedAt = domain.RequestedAt
        };

        dbContext.CoachingLinks.Add(entity);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return new SaveResult<CoachingLinkEntity>(entity, Created: true);
        }
        catch (DbUpdateException)
        {
            // Duas requisições iguais podem atravessar a leitura acima antes de
            // qualquer uma gravar. O índice parcial decide a corrida; a perdedora
            // devolve a solicitação vencedora em vez de vazar um 500.
            dbContext.Entry(entity).State = EntityState.Detached;
            var winner = await dbContext.CoachingLinks.FirstOrDefaultAsync(
                link => link.PersonalId == personalId &&
                        link.CorredorId == corredorId &&
                        link.Status == CoachingLinkStatus.Pending,
                cancellationToken);
            if (winner is not null)
                return new SaveResult<CoachingLinkEntity>(winner, Created: false);

            throw;
        }
    }

    public async Task<IReadOnlyList<CoachingLinkEntity>> GetPendingAsync(
        Guid corredorId, CancellationToken cancellationToken) =>
        await dbContext.CoachingLinks
            .Where(link => link.CorredorId == corredorId && link.Status == CoachingLinkStatus.Pending)
            .OrderByDescending(link => link.RequestedAt)
            .ToListAsync(cancellationToken);

    public async Task<AcceptLinkResult> AcceptAsync(
        Guid linkId, Guid corredorId, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var link = await dbContext.CoachingLinks.FirstOrDefaultAsync(
            item => item.Id == linkId &&
                    item.CorredorId == corredorId &&
                    item.Status == CoachingLinkStatus.Pending,
            cancellationToken);

        if (link is null)
            return AcceptLinkResult.NotFound;

        if (await RunnerHasActiveAsync(corredorId, cancellationToken))
            return AcceptLinkResult.AlreadyLinked;

        var now = DateTime.UtcNow;
        link.Status = CoachingLinkStatus.Active;
        link.AcceptedAt = now;

        var otherPending = await dbContext.CoachingLinks
            .Where(item => item.CorredorId == corredorId &&
                           item.Id != linkId &&
                           item.Status == CoachingLinkStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var pending in otherPending)
        {
            pending.Status = CoachingLinkStatus.Expired;
            pending.EndedAt = now;
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return AcceptLinkResult.Accepted;
        }
        catch (DbUpdateException)
        {
            // Aceites concorrentes são serializados pelo índice único do vínculo
            // ativo. Depois do rollback, confirme que outra solicitação venceu.
            await transaction.RollbackAsync(cancellationToken);
            var anotherWon = await dbContext.CoachingLinks
                .AsNoTracking()
                .AnyAsync(item => item.CorredorId == corredorId &&
                                  item.Status == CoachingLinkStatus.Active,
                    cancellationToken);
            if (anotherWon)
                return AcceptLinkResult.AlreadyLinked;

            throw;
        }
    }

    public async Task<bool> EndAsync(Guid linkId, Guid actorId, CancellationToken cancellationToken)
    {
        var link = await dbContext.CoachingLinks.FirstOrDefaultAsync(
            item => item.Id == linkId &&
                    (item.PersonalId == actorId || item.CorredorId == actorId) &&
                    (item.Status == CoachingLinkStatus.Pending || item.Status == CoachingLinkStatus.Active),
            cancellationToken);

        if (link is null)
            return false;

        link.Status = CoachingLinkStatus.Ended;
        link.EndedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task<bool> HasActiveAsync(
        Guid personalId, Guid corredorId, CancellationToken cancellationToken) =>
        dbContext.CoachingLinks.AnyAsync(
            link => link.PersonalId == personalId &&
                    link.CorredorId == corredorId &&
                    link.Status == CoachingLinkStatus.Active,
            cancellationToken);

    public Task<bool> RunnerHasActiveAsync(Guid corredorId, CancellationToken cancellationToken) =>
        dbContext.CoachingLinks.AnyAsync(
            link => link.CorredorId == corredorId && link.Status == CoachingLinkStatus.Active,
            cancellationToken);

    public Task<CoachingLinkEntity?> GetActiveForRunnerAsync(
        Guid corredorId, CancellationToken cancellationToken) =>
        dbContext.CoachingLinks.FirstOrDefaultAsync(
            link => link.CorredorId == corredorId && link.Status == CoachingLinkStatus.Active,
            cancellationToken);

    public async Task<IReadOnlyList<LinkedRunner>> GetLinkedRunnersAsync(
        Guid personalId, CancellationToken cancellationToken) =>
        await (
            from link in dbContext.CoachingLinks
            join corredor in dbContext.Corredores on link.CorredorId equals corredor.Id
            where link.PersonalId == personalId && link.Status == CoachingLinkStatus.Active
            // Ordena pelo que o personal lê: o nome quando existe, o e-mail enquanto não.
            orderby corredor.Name ?? corredor.Email
            select new LinkedRunner(link.Id, corredor.Id, corredor.Email, corredor.Name))
            .ToListAsync(cancellationToken);
}
