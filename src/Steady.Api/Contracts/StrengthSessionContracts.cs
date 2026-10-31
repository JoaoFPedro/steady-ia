using Steady.Domain.Training;

namespace Steady.Api.Contracts;

public sealed record StrengthSessionRequest(
    DateOnly Date,
    MuscleGroup? MuscleGroup,
    Intensity? Intensity,
    int DurationMinutes,
    bool PainReported = false,
    DateTimeOffset? RegisteredAt = null);

public sealed record StrengthSessionResponse(
    Guid Id,
    DateOnly Date,
    MuscleGroup MuscleGroup,
    Intensity Intensity,
    int DurationMinutes);
