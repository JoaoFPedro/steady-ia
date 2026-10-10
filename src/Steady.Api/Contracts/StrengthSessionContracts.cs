using Steady.Domain.Training;

namespace Steady.Api.Contracts;

public sealed record StrengthSessionRequest(
    DateOnly Date,
    MuscleGroup? MuscleGroup,
    Intensity? Intensity,
    int DurationMinutes,
    bool PainReported = false);

public sealed record StrengthSessionResponse(
    Guid Id,
    DateOnly Date,
    MuscleGroup MuscleGroup,
    Intensity Intensity,
    int DurationMinutes);
