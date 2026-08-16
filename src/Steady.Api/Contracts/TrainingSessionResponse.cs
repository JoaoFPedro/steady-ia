namespace Steady.Api.Contracts;

public sealed record TrainingSessionResponse(
    Guid Id,
    string Type,
    DateOnly Date,
    int DurationMinutes,
    double? DistanceKm,
    double? AveragePaceMinPerKm,
    int? PerceivedEffort,
    string? MuscleGroup,
    string? Intensity);
