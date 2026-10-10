namespace Steady.Api.Contracts;

public sealed record RunningSessionRequest(
    DateOnly Date,
    double DistanceKm,
    int DurationMinutes,
    double AveragePaceMinPerKm,
    int PerceivedEffort,
    bool PainReported = false);

public sealed record RunningSessionResponse(
    Guid Id,
    DateOnly Date,
    double DistanceKm,
    int DurationMinutes,
    double AveragePaceMinPerKm,
    int PerceivedEffort);
