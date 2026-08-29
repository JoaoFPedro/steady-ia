namespace Steady.Api.Contracts;

/// <summary>
/// Uma linha do histórico de treino do corredor. Reúne três origens: corrida,
/// musculação avulsa e execução da ficha do personal. A execução da ficha não
/// registra duração nem grupo muscular — por isso `DurationMinutes` é
/// opcional, e `WorkoutType` diz de qual treino da ficha ela veio.
/// </summary>
public sealed record TrainingSessionResponse(
    Guid Id,
    string Type,
    DateOnly Date,
    int? DurationMinutes,
    double? DistanceKm,
    double? AveragePaceMinPerKm,
    int? PerceivedEffort,
    string? MuscleGroup,
    string? Intensity,
    string? WorkoutType = null);
