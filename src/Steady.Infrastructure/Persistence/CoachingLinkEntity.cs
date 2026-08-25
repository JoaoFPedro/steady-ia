using Steady.Domain.Coaching;

namespace Steady.Infrastructure.Persistence;

public sealed class CoachingLinkEntity
{
    public Guid Id { get; set; }
    public Guid PersonalId { get; set; }
    public Guid CorredorId { get; set; }
    public CoachingLinkStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}

