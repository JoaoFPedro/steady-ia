namespace Steady.Domain.Coaching;

public enum CoachingLinkStatus
{
    Pending,
    Active,
    Ended,
    Expired
}

public sealed class CoachingLink
{
    public Guid PersonalId { get; }
    public Guid CorredorId { get; }
    public CoachingLinkStatus Status { get; private set; }
    public DateTime RequestedAt { get; }
    public DateTime? AcceptedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }
    public bool GrantsAccess => Status == CoachingLinkStatus.Active;

    private CoachingLink(
        Guid personalId,
        Guid corredorId,
        CoachingLinkStatus status,
        DateTime requestedAt,
        DateTime? acceptedAt,
        DateTime? endedAt)
    {
        PersonalId = personalId;
        CorredorId = corredorId;
        Status = status;
        RequestedAt = requestedAt;
        AcceptedAt = acceptedAt;
        EndedAt = endedAt;
    }

    public static CoachingLink Request(Guid personalId, Guid corredorId, DateTime requestedAt)
    {
        if (personalId == Guid.Empty)
            throw new ArgumentException("O personal é obrigatório.", nameof(personalId));

        if (corredorId == Guid.Empty)
            throw new ArgumentException("O corredor é obrigatório.", nameof(corredorId));

        if (personalId == corredorId)
            throw new ArgumentException("Uma conta não pode criar vínculo consigo mesma.", nameof(corredorId));

        return new CoachingLink(
            personalId, corredorId, CoachingLinkStatus.Pending,
            requestedAt, acceptedAt: null, endedAt: null);
    }

    public static CoachingLink Restore(
        Guid personalId,
        Guid corredorId,
        CoachingLinkStatus status,
        DateTime requestedAt,
        DateTime? acceptedAt,
        DateTime? endedAt) =>
        new(personalId, corredorId, status, requestedAt, acceptedAt, endedAt);

    public void Accept(DateTime acceptedAt)
    {
        if (Status != CoachingLinkStatus.Pending)
            throw new InvalidOperationException("Somente uma solicitação pendente pode ser aceita.");

        Status = CoachingLinkStatus.Active;
        AcceptedAt = acceptedAt;
    }

    public void End(DateTime endedAt)
    {
        if (Status is CoachingLinkStatus.Ended or CoachingLinkStatus.Expired)
            return;

        Status = CoachingLinkStatus.Ended;
        EndedAt = endedAt;
    }

    public void Expire(DateTime endedAt)
    {
        if (Status != CoachingLinkStatus.Pending)
            return;

        Status = CoachingLinkStatus.Expired;
        EndedAt = endedAt;
    }
}

